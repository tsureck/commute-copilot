import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { theme } from '../../theme';
import {
  GlassCard,
  AnimatedWaveform,
  UpdateIcon,
  ConfidencePill,
  AudioControls,
  ConversationDock,
  ChatBubble,
} from '../../components';
import { 
  useAudioPlayer, 
  useAudioRecorder, 
  useSettings,
  useChatStorage,
} from '../../hooks';
import { getDecision, postChat } from '../../api';
import { Decision, ChatMessage } from '../../types';

export default function DecisionScreen() {
  const { decisionId } = useLocalSearchParams<{ decisionId: string }>();
  const { settings } = useSettings();
  
  const [decision, setDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  
  const audioPlayer = useAudioPlayer();
  const audioRecorder = useAudioRecorder();
  const chatStorage = useChatStorage(`decision-${decisionId}`);

  // Load decision data
  useEffect(() => {
    loadDecision();
  }, [decisionId]);

  // Autoplay audio when decision loads
  useEffect(() => {
    if (decision?.audio_url && settings.autoplayVoice && !audioPlayer.isLoading) {
      audioPlayer.load(decision.audio_url, true);
    }
  }, [decision?.audio_url, settings.autoplayVoice]);

  const loadDecision = async () => {
    if (!decisionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getDecision(decisionId);
      setDecision(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decision');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    setIsSending(true);
    
    // Add user message
    await chatStorage.addMessage({
      role: 'user',
      text: text.trim(),
    });
    
    try {
      // Get AI response
      const response = await postChat(
        chatStorage.threadId,
        chatStorage.messages,
        text.trim()
      );
      
      // Add assistant message
      await chatStorage.addMessage({
        role: 'assistant',
        text: response.text,
        audio_url: response.audio_url,
      });
    } catch (err) {
      console.error('Failed to get chat response:', err);
    } finally {
      setIsSending(false);
    }
  }, [chatStorage]);

  const handleStartRecording = async () => {
    await audioRecorder.startRecording();
  };

  const handleStopRecording = async () => {
    const transcription = await audioRecorder.stopRecording();
    if (transcription) {
      await handleSendMessage(transcription);
    }
  };

  const handlePlayMessageAudio = (url: string) => {
    audioPlayer.load(url, true);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading decision...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !decision) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorEmoji}>😕</Text>
          <Text style={styles.errorText}>{error || 'Decision not found'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Waveform */}
          <View style={styles.waveformContainer}>
            <AnimatedWaveform
              isPlaying={audioPlayer.isPlaying}
              size="large"
              color={theme.colors.accent}
              reduceMotion={settings.reduceMotion}
            />
            <Text style={styles.title}>{decision.title}</Text>
          </View>

          {/* Audio Controls */}
          {decision.audio_url && (
            <View style={styles.audioSection}>
              <AudioControls
                isPlaying={audioPlayer.isPlaying}
                isLoading={audioPlayer.isLoading}
                progress={audioPlayer.progress}
                currentTime={audioPlayer.currentTime}
                duration={audioPlayer.duration}
                onToggle={audioPlayer.toggle}
                reduceMotion={settings.reduceMotion}
              />
            </View>
          )}

          {/* Current Updates Card */}
          <GlassCard 
            style={styles.card} 
            delay={100}
            reduceMotion={settings.reduceMotion}
          >
            <Text style={styles.cardTitle}>Current Updates</Text>
            {decision.updates.map((update, index) => (
              <View key={index} style={styles.updateRow}>
                <UpdateIcon type={update.type} />
                <Text style={styles.updateText}>{update.text}</Text>
              </View>
            ))}
          </GlassCard>

          {/* Recommendation Card */}
          <GlassCard 
            style={styles.card} 
            delay={200}
            reduceMotion={settings.reduceMotion}
          >
            <View style={styles.recommendationHeader}>
              <Text style={styles.cardTitle}>Recommendation</Text>
              <ConfidencePill confidence={decision.confidence} />
            </View>
            <Text style={styles.recommendationText}>
              {decision.recommendation}
            </Text>
          </GlassCard>

          {/* Mini Chat Thread */}
          {chatStorage.messages.length > 0 && (
            <View style={styles.chatThread}>
              <Text style={styles.chatThreadTitle}>Conversation</Text>
              {chatStorage.messages.slice(-4).map((message) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  onPlayAudio={handlePlayMessageAudio}
                  isPlayingAudio={audioPlayer.isPlaying}
                />
              ))}
            </View>
          )}

          {/* Spacer for dock */}
          <View style={styles.dockSpacer} />
        </ScrollView>

        {/* Conversation Dock */}
        <ConversationDock
          onSendMessage={handleSendMessage}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecording={audioRecorder.isRecording}
          isProcessing={audioRecorder.isProcessing}
          isSending={isSending}
          reduceMotion={settings.reduceMotion}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 100, // Account for header
    paddingBottom: theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  errorEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  waveformContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  title: {
    fontSize: theme.typography.xxl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.lg,
  },
  audioSection: {
    marginBottom: theme.spacing.xl,
  },
  card: {
    marginBottom: theme.spacing.lg,
  },
  cardTitle: {
    fontSize: theme.typography.lg,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  updateText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  recommendationText: {
    fontSize: theme.typography.xl,
    fontWeight: theme.typography.bold,
    color: theme.colors.accent,
    lineHeight: 30,
  },
  chatThread: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  chatThreadTitle: {
    fontSize: theme.typography.md,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  dockSpacer: {
    height: 100,
  },
});
