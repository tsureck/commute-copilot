import React, { useEffect, useState, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { 
  UpdateCard,
  RecommendationCard,
  ConversationBubble,
  MicButton,
  Button,
} from '../components';
import { useSettings, useAudioPlayer, useAudioRecorder } from '../hooks';
import { getDecision, postFollowUp } from '../api';
import { AgentDecision, ConversationMessage } from '../types';
import { generateId } from '../utils';

export default function HomeScreen() {
  const { settings } = useSettings();
  const audioPlayer = useAudioPlayer();
  const audioRecorder = useAudioRecorder();
  
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Load decision on mount
  useEffect(() => {
    loadDecision();
  }, []);

  // Auto-play voice summary if enabled
  useEffect(() => {
    if (decision?.audioUrl && settings.autoplayVoice && !audioPlayer.isLoading) {
      setPlayingMessageId('recommendation');
      audioPlayer.load(decision.audioUrl, true);
    }
  }, [decision?.audioUrl, settings.autoplayVoice]);

  // Reset playing state when audio stops
  useEffect(() => {
    if (!audioPlayer.isPlaying) {
      setPlayingMessageId(null);
    }
  }, [audioPlayer.isPlaying]);

  const loadDecision = async () => {
    try {
      const data = await getDecision();
      setDecision(data);
    } catch (error) {
      console.error('Failed to load decision:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDecision();
    setIsRefreshing(false);
  };

  const handlePlayRecommendationAudio = () => {
    if (decision?.audioUrl) {
      if (playingMessageId === 'recommendation' && audioPlayer.isPlaying) {
        audioPlayer.pause();
        setPlayingMessageId(null);
      } else {
        setPlayingMessageId('recommendation');
        audioPlayer.load(decision.audioUrl, true);
      }
    }
  };

  const handlePlayMessageAudio = (messageId: string, audioUrl: string) => {
    if (playingMessageId === messageId && audioPlayer.isPlaying) {
      audioPlayer.pause();
      setPlayingMessageId(null);
    } else {
      setPlayingMessageId(messageId);
      audioPlayer.load(audioUrl, true);
    }
  };

  const handleMicPress = async () => {
    if (audioRecorder.isRecording) {
      // Stop recording and process
      const transcription = await audioRecorder.stopRecording();
      if (transcription) {
        await sendMessage(transcription);
      }
    } else {
      // Start recording
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await audioRecorder.startRecording();
    }
  };

  const sendMessage = async (text: string) => {
    setIsSending(true);
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: generateId(),
      role: 'user',
      text,
      created_at: new Date().toISOString(),
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Get AI response
      const response = await postFollowUp(text);
      
      setConversation(prev => [...prev, response]);
      
      // Auto-play response audio if enabled
      if (settings.autoplayVoice && response.audioUrl) {
        setPlayingMessageId(response.id);
        await audioPlayer.load(response.audioUrl, true);
      }
      
      // Scroll to bottom again
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to get response:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenSettings = () => {
    router.push('/settings');
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading your commute...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good morning</Text>
            <Text style={styles.title}>Your Commute</Text>
          </View>
          <Button
            title="⚙️"
            onPress={handleOpenSettings}
            variant="ghost"
            size="small"
          />
        </View>

        {/* Quick Status */}
        {decision && decision.currentUpdates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Status</Text>
            {decision.currentUpdates.map((update, index) => (
              <UpdateCard key={index} update={update} />
            ))}
          </View>
        )}

        {/* Recommendation */}
        {decision && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recommendation</Text>
            <RecommendationCard
              recommendation={decision.recommendation}
              confidence={decision.uiHints.confidenceIndicator}
              isPlaying={playingMessageId === 'recommendation' && audioPlayer.isPlaying}
              onPlayAudio={handlePlayRecommendationAudio}
            />
          </View>
        )}

        {/* Conversation Thread */}
        {conversation.length > 0 && (
          <View style={styles.conversationSection}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            {conversation.map((message) => (
              <ConversationBubble
                key={message.id}
                message={message}
                isPlaying={playingMessageId === message.id && audioPlayer.isPlaying}
                onPlayAudio={() => message.audioUrl && handlePlayMessageAudio(message.id, message.audioUrl)}
              />
            ))}
            
            {/* Sending indicator */}
            {isSending && (
              <View style={styles.sendingIndicator}>
                <ActivityIndicator size="small" color={theme.colors.accent} />
                <Text style={styles.sendingText}>Getting response...</Text>
              </View>
            )}
          </View>
        )}

        {/* Spacer for mic button */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Mic Button (fixed at bottom) */}
      <View style={styles.micContainer}>
        <MicButton
          isRecording={audioRecorder.isRecording}
          isProcessing={audioRecorder.isProcessing || isSending}
          onPress={handleMicPress}
          disabled={isLoading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: 160, // Space for mic button
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.xxl,
  },
  greeting: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
  },
  title: {
    fontSize: theme.typography.xxxl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xs,
  },
  section: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
  },
  conversationSection: {
    marginTop: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  sendingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  sendingText: {
    marginLeft: theme.spacing.sm,
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
  bottomSpacer: {
    height: 40,
  },
  micContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    paddingBottom: theme.spacing.lg,
  },
});
