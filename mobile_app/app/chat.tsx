/**
 * Chat screen implementing the new voice communication flow:
 * 1. Record audio → send to Eleven Bridge for STT
 * 2. Send transcribed text to n8n → get assistant response
 * 3. Display response → get TTS from Eleven Bridge
 * 4. Store audio with message for playback
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

// ============================================================================
// Configuration
// ============================================================================

// Eleven Bridge FastAPI service for speech-to-text and text-to-speech
const ELEVEN_BRIDGE_BASE_URL = 'http://localhost:8000';

// n8n workflow backend for assistant responses
const N8N_BASE_URL = 'https://prothos.app.n8n.cloud/webhook-test';

// Default decision ID for the hackathon demo
const DEFAULT_DECISION_ID = 'dec_u1_001';

// ============================================================================
// Types
// ============================================================================

type LoadingState = 
  | 'idle'
  | 'recording'
  | 'transcribing'  // Sending to Eleven Bridge STT
  | 'thinking'      // Waiting for n8n response
  | 'generating'    // Getting TTS from Eleven Bridge
  | 'error';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioBase64?: string;
  audioFormat?: 'mp3';
  created_at: string;
}

// ============================================================================
// API Functions
// ============================================================================

async function speechToText(
  decisionId: string,
  audio: string,
  audioFormat: 'm4a' | 'mp3' | 'wav' | 'webm'
): Promise<string> {
  const url = `${ELEVEN_BRIDGE_BASE_URL}/speech_to_text/`;
  // #region agent log
  console.log('[DEBUG] API CALL: POST', url);
  console.log('[DEBUG] Request data: { decisionId:', decisionId, ', audioFormat:', audioFormat, ', audio.length:', audio.length, '}');
  // #endregion
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decisionId, audio, audioFormat }),
  });

  // #region agent log
  console.log('[DEBUG] Response status:', response.status);
  // #endregion
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    // #region agent log
    console.log('[DEBUG] STT Error:', error);
    // #endregion
    throw new Error(error.detail || `STT failed: ${response.status}`);
  }

  const data = await response.json();
  // #region agent log
  console.log('[DEBUG] STT Response text:', data.text);
  // #endregion
  return data.text;
}

async function sendUserAnswer(
  decisionId: string,
  text: string
): Promise<{ id: string; role: 'assistant'; text: string; created_at: string }> {
  const url = `${N8N_BASE_URL}/user_answer`;
  // #region agent log
  console.log('[DEBUG] API CALL: POST', url);
  console.log('[DEBUG] Request data: { decisionId:', decisionId, ', text:', text, '}');
  // #endregion
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decisionId, text }),
  });

  // #region agent log
  console.log('[DEBUG] Response status:', response.status);
  // #endregion
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    // #region agent log
    console.log('[DEBUG] n8n Error:', error);
    // #endregion
    throw new Error(error.detail || `n8n failed: ${response.status}`);
  }

  const data = await response.json();
  // #region agent log
  console.log('[DEBUG] n8n Response:', data);
  // #endregion
  return data;
}

async function textToSpeech(
  decisionId: string,
  text: string
): Promise<{ audio: string; audioFormat: 'mp3' }> {
  const url = `${ELEVEN_BRIDGE_BASE_URL}/text_to_speech/`;
  // #region agent log
  console.log('[DEBUG] API CALL: POST', url);
  console.log('[DEBUG] Request data: { decisionId:', decisionId, ', text:', text, '}');
  // #endregion
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decisionId, text }),
  });

  // #region agent log
  console.log('[DEBUG] Response status:', response.status);
  // #endregion
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    // #region agent log
    console.log('[DEBUG] TTS Error:', error);
    // #endregion
    throw new Error(error.detail || `TTS failed: ${response.status}`);
  }

  const data = await response.json();
  // #region agent log
  console.log('[DEBUG] TTS Response audio.length:', data.audio?.length, 'format:', data.audioFormat);
  // #endregion
  return data;
}

// ============================================================================
// Audio Utilities
// ============================================================================

async function readAudioAsBase64(uri: string): Promise<string> {
  return FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
}

async function saveBase64AudioToFile(base64Audio: string, format: string = 'mp3'): Promise<string> {
  const uri = `${FileSystem.cacheDirectory}response_${Date.now()}.${format}`;
  await FileSystem.writeAsStringAsync(uri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return uri;
}

function getAudioFormat(uri: string): 'm4a' | 'mp3' | 'wav' | 'webm' {
  const ext = uri.split('.').pop()?.toLowerCase();
  if (ext === 'mp3') return 'mp3';
  if (ext === 'wav') return 'wav';
  if (ext === 'webm') return 'webm';
  return 'm4a';
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// ============================================================================
// Main Component
// ============================================================================

export default function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const addMessage = useCallback((msg: Omit<ChatMessage, 'id' | 'created_at'>) => {
    const newMsg: ChatMessage = {
      ...msg,
      id: generateId(),
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    return newMsg;
  }, []);

  const startRecording = useCallback(async () => {
    // #region agent log
    console.log('[DEBUG] startRecording called, loadingState:', loadingState);
    // #endregion
    try {
      // #region agent log
      console.log('[DEBUG] Requesting mic permission...');
      // #endregion
      const { granted } = await Audio.requestPermissionsAsync();
      // #region agent log
      console.log('[DEBUG] Permission result:', granted);
      // #endregion
      if (!granted) {
        console.error('Microphone permission not granted');
        return false;
      }

      // #region agent log
      console.log('[DEBUG] Setting audio mode...');
      // #endregion
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      // #region agent log
      console.log('[DEBUG] Audio mode set successfully');
      // #endregion

      const recording = new Audio.Recording();
      // #region agent log
      console.log('[DEBUG] Preparing to record...');
      // #endregion
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      // #region agent log
      console.log('[DEBUG] Recording prepared');
      // #endregion
      // #region agent log
      console.log('[DEBUG] Starting recording...');
      // #endregion
      await recording.startAsync();
      // #region agent log
      console.log('[DEBUG] Recording started');
      // #endregion
      
      recordingRef.current = recording;
      setLoadingState('recording');
      // #region agent log
      console.log('[DEBUG] Triggering haptics...');
      // #endregion
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // #region agent log
      console.log('[DEBUG] Recording started successfully!');
      // #endregion
      
      return true;
    } catch (err) {
      // #region agent log
      console.log('[DEBUG] Error in startRecording:', err instanceof Error ? err.message : String(err));
      // #endregion
      console.error('Failed to start recording:', err);
      return false;
    }
  }, []);

  const stopRecordingAndProcess = useCallback(async () => {
    // #region agent log
    console.log('[DEBUG] stopRecordingAndProcess called');
    // #endregion
    if (!recordingRef.current) {
      // #region agent log
      console.log('[DEBUG] No recording ref - returning');
      // #endregion
      return;
    }

    try {
      // Stop recording
      // #region agent log
      console.log('[DEBUG] Stopping recording...');
      // #endregion
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      
      const audioUri = recordingRef.current.getURI();
      // #region agent log
      console.log('[DEBUG] Audio URI:', audioUri);
      // #endregion
      recordingRef.current = null;
      
      if (!audioUri) {
        // #region agent log
        console.log('[DEBUG] No audio URI - error');
        // #endregion
        setLoadingState('error');
        return;
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Step 1: Transcribe audio
      // #region agent log
      console.log('[DEBUG] Transcribing audio...');
      // #endregion
      setLoadingState('transcribing');
      const audioBase64 = await readAudioAsBase64(audioUri);
      // #region agent log
      console.log('[DEBUG] Audio base64 length:', audioBase64.length);
      // #endregion
      const audioFormat = getAudioFormat(audioUri);
      // #region agent log
      console.log('[DEBUG] Calling speechToText with format:', audioFormat);
      // #endregion
      const userText = await speechToText(DEFAULT_DECISION_ID, audioBase64, audioFormat);
      // #region agent log
      console.log('[DEBUG] Transcription result:', userText);
      // #endregion

      if (!userText.trim()) {
        // #region agent log
        console.log('[DEBUG] Empty transcription - error');
        // #endregion
        setLoadingState('error');
        setTimeout(() => setLoadingState('idle'), 2000);
        return;
      }

      // Add user message
      addMessage({ role: 'user', text: userText });

      // Step 2: Get assistant response from n8n
      // #region agent log
      console.log('[DEBUG] Calling n8n...');
      // #endregion
      setLoadingState('thinking');
      const assistantResponse = await sendUserAnswer(DEFAULT_DECISION_ID, userText);
      // #region agent log
      console.log('[DEBUG] n8n response:', assistantResponse.text);
      // #endregion

      // Step 3: Generate TTS audio
      // #region agent log
      console.log('[DEBUG] Generating TTS...');
      // #endregion
      setLoadingState('generating');
      const ttsResponse = await textToSpeech(DEFAULT_DECISION_ID, assistantResponse.text);
      // #region agent log
      console.log('[DEBUG] TTS response audio length:', ttsResponse.audio.length);
      // #endregion

      // Add assistant message with audio
      addMessage({
        role: 'assistant',
        text: assistantResponse.text,
        audioBase64: ttsResponse.audio,
        audioFormat: ttsResponse.audioFormat,
      });

      setLoadingState('idle');
      // #region agent log
      console.log('[DEBUG] Flow completed successfully');
      // #endregion
    } catch (error) {
      // #region agent log
      console.log('[DEBUG] Error in stopRecordingAndProcess:', error instanceof Error ? error.message : String(error));
      // #endregion
      console.error('Voice message flow error:', error);
      setLoadingState('error');
      setTimeout(() => setLoadingState('idle'), 2000);
    }
  }, [addMessage]);

  const handlePressIn = useCallback(async () => {
    // #region agent log
    console.log('[DEBUG] handlePressIn called, loadingState:', loadingState);
    // #endregion
    if (loadingState !== 'idle') {
      // #region agent log
      console.log('[DEBUG] handlePressIn skipped - not idle');
      // #endregion
      return;
    }
    await startRecording();
  }, [loadingState, startRecording]);

  const handlePressOut = useCallback(async () => {
    // #region agent log
    console.log('[DEBUG] handlePressOut called, loadingState:', loadingState);
    // #endregion
    if (loadingState === 'recording') {
      await stopRecordingAndProcess();
    }
  }, [loadingState, stopRecordingAndProcess]);

  const playAudio = useCallback(async (message: ChatMessage) => {
    if (!message.audioBase64) return;

    try {
      // Stop any currently playing audio
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      // If same message, just toggle off
      if (playingMessageId === message.id) {
        setPlayingMessageId(null);
        return;
      }

      // Save base64 to file and play
      const uri = await saveBase64AudioToFile(message.audioBase64, message.audioFormat);
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded && status.didJustFinish) {
            setPlayingMessageId(null);
          }
        }
      );

      soundRef.current = sound;
      setPlayingMessageId(message.id);
    } catch (err) {
      console.error('Failed to play audio:', err);
    }
  }, [playingMessageId]);

  const getStatusText = () => {
    switch (loadingState) {
      case 'recording': return 'Release to send';
      case 'transcribing': return 'Transcribing...';
      case 'thinking': return 'Thinking...';
      case 'generating': return 'Generating audio...';
      case 'error': return 'Error - try again';
      default: return 'Hold to talk';
    }
  };

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const hasAudio = !!item.audioBase64;
    const isPlaying = playingMessageId === item.id;

    return (
      <View style={[styles.messageContainer, isUser ? styles.userContainer : styles.assistantContainer]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.assistantText]}>
            {item.text}
          </Text>
          
          {hasAudio && !isUser && (
            <TouchableOpacity 
              style={styles.audioButton}
              onPress={() => playAudio(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.audioIcon}>{isPlaying ? '⏹' : '▶'}</Text>
              <Text style={styles.audioLabel}>{isPlaying ? 'Stop' : 'Play'}</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.assistantTimestamp]}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [playingMessageId, playAudio]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🎤</Text>
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Hold the button to record your message.{'\n'}
        I'll transcribe it and respond with voice.
      </Text>
    </View>
  );

  const isProcessing = ['transcribing', 'thinking', 'generating'].includes(loadingState);
  const isRecording = loadingState === 'recording';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commute Copilot</Text>
        <Text style={styles.headerSubtitle}>Voice Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.dockContainer}>
        <TouchableOpacity
          style={[
            styles.recordButton,
            isRecording && styles.recordButtonRecording,
            isProcessing && styles.recordButtonProcessing,
          ]}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={theme.colors.textPrimary} />
          ) : (
            <Text style={styles.recordIcon}>{isRecording ? '🔴' : '🎤'}</Text>
          )}
        </TouchableOpacity>
        
        <Text style={[styles.statusText, loadingState === 'error' && styles.errorText]}>
          {getStatusText()}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.glassBorder,
  },
  headerTitle: {
    fontSize: theme.typography.xl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxxl * 2,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: theme.typography.xl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtitle: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
  messageContainer: {
    marginVertical: theme.spacing.sm,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
  },
  userBubble: {
    backgroundColor: theme.colors.accent,
    borderBottomRightRadius: theme.spacing.xs,
  },
  assistantBubble: {
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  messageText: {
    fontSize: theme.typography.md,
    lineHeight: 22,
  },
  userText: {
    color: theme.colors.textPrimary,
  },
  assistantText: {
    color: theme.colors.textPrimary,
  },
  timestamp: {
    fontSize: theme.typography.xs,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.xs,
  },
  userTimestamp: {
    marginRight: theme.spacing.xs,
  },
  assistantTimestamp: {
    marginLeft: theme.spacing.xs,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  audioIcon: {
    fontSize: 14,
    marginRight: theme.spacing.sm,
    color: theme.colors.accent,
  },
  audioLabel: {
    fontSize: theme.typography.sm,
    color: theme.colors.accent,
  },
  dockContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonRecording: {
    backgroundColor: theme.colors.error,
    transform: [{ scale: 1.1 }],
  },
  recordButtonProcessing: {
    backgroundColor: theme.colors.surface,
  },
  recordIcon: {
    fontSize: 32,
  },
  statusText: {
    marginTop: theme.spacing.md,
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
  errorText: {
    color: theme.colors.error,
  },
});
