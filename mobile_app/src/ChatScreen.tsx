/**
 * Main chat screen implementing the new communication flow:
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
} from 'react-native';

import { ChatMessage, LoadingState } from './types';
import { DEFAULT_DECISION_ID } from './config';
import { speechToText, textToSpeech, sendUserAnswer } from './api';
import { useChatStore } from './chatStore';
import { useAudioRecorder } from './useAudioRecorder';
import { useAudioPlayer } from './useAudioPlayer';
import { ChatBubble, RecordButton } from './components';

export function ChatScreen() {
  const chatStore = useChatStore();
  const audioRecorder = useAudioRecorder();
  const audioPlayer = useAudioPlayer();
  
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatStore.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatStore.messages.length]);

  /**
   * Handle the complete voice message flow:
   * 1. Stop recording and get audio
   * 2. Send audio to Eleven Bridge for transcription
   * 3. Send transcribed text to n8n
   * 4. Display assistant response
   * 5. Get TTS audio from Eleven Bridge
   * 6. Store audio with message
   */
  const handleVoiceMessage = useCallback(async () => {
    try {
      // Step 1: Stop recording and get audio
      const recording = await audioRecorder.stopRecording();
      if (!recording) {
        setLoadingState('error');
        return;
      }

      // Step 2: Transcribe audio via Eleven Bridge
      setLoadingState('transcribing');
      const userText = await speechToText(
        DEFAULT_DECISION_ID,
        recording.audioBase64,
        recording.audioFormat
      );

      if (!userText.trim()) {
        setLoadingState('error');
        return;
      }

      // Add user message to chat
      chatStore.addUserMessage(userText);
      
      // Step 3: Send to n8n and get assistant response
      setLoadingState('thinking');
      const assistantResponse = await sendUserAnswer(DEFAULT_DECISION_ID, userText);

      // Step 4: Generate TTS audio from Eleven Bridge
      setLoadingState('generating');
      const ttsResponse = await textToSpeech(DEFAULT_DECISION_ID, assistantResponse.text);

      // Step 5: Add assistant message with audio
      chatStore.addAssistantMessage(
        assistantResponse.text,
        ttsResponse.audio,
        ttsResponse.audioFormat
      );

      setLoadingState('idle');
    } catch (error) {
      console.error('Voice message flow error:', error);
      setLoadingState('error');
      
      // Reset to idle after showing error
      setTimeout(() => setLoadingState('idle'), 2000);
    }
  }, [audioRecorder, chatStore]);

  const handlePressIn = useCallback(async () => {
    if (loadingState !== 'idle') return;
    
    const started = await audioRecorder.startRecording();
    if (started) {
      setLoadingState('recording');
    }
  }, [loadingState, audioRecorder]);

  const handlePressOut = useCallback(async () => {
    if (loadingState === 'recording') {
      await handleVoiceMessage();
    }
  }, [loadingState, handleVoiceMessage]);

  const handlePlayAudio = useCallback(async (message: ChatMessage) => {
    if (!message.audioBase64) return;

    // If already playing this message, stop it
    if (playingMessageId === message.id && audioPlayer.isPlaying) {
      await audioPlayer.stop();
      setPlayingMessageId(null);
      return;
    }

    // Play the audio
    setPlayingMessageId(message.id);
    await audioPlayer.playFromBase64(message.audioBase64, message.audioFormat);
  }, [playingMessageId, audioPlayer]);

  // Clear playing message ID when audio stops
  useEffect(() => {
    if (!audioPlayer.isPlaying && playingMessageId) {
      setPlayingMessageId(null);
    }
  }, [audioPlayer.isPlaying, playingMessageId]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item}
      onPlayAudio={() => handlePlayAudio(item)}
      isPlayingAudio={playingMessageId === item.id && audioPlayer.isPlaying}
      isLoadingAudio={playingMessageId === item.id && audioPlayer.isLoading}
    />
  ), [playingMessageId, audioPlayer.isPlaying, audioPlayer.isLoading, handlePlayAudio]);

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🎤</Text>
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Hold the button to record your message.
        I'll transcribe it and respond with voice.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commute Copilot</Text>
        <Text style={styles.headerSubtitle}>Voice Assistant</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={chatStore.messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />

      <RecordButton
        loadingState={loadingState}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={loadingState !== 'idle' && loadingState !== 'recording'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});
