import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { 
  UpdateCard,
  RecommendationCard,
  ConversationBubble,
  MicButton,
  SettingsIcon,
} from '../components';
import { useSettings, useAudioRecorder } from '../hooks';
import { getDecision, postFollowUp } from '../api';
import { AgentDecision, ConversationMessage } from '../types';
import { generateId } from '../utils';

export default function HomeScreen() {
  const { settings } = useSettings();
  const audioRecorder = useAudioRecorder();
  
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Load decision on mount
  useEffect(() => {
    loadDecision();
  }, []);

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

  const handleMicPress = async () => {
    if (audioRecorder.isRecording) {
      // Stop recording and process
      const result = await audioRecorder.stopRecording();
      if (result) {
        await sendMessage(result.transcription, result.audioUri);
      }
    } else {
      // Start recording
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await audioRecorder.startRecording();
    }
  };

  const sendMessage = async (text: string, userAudioUri?: string) => {
    setIsSending(true);
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: generateId(),
      role: 'user',
      text,
      audioUrl: userAudioUri, // Store user's audio too
      created_at: new Date().toISOString(),
    };
    
    setConversation(prev => [...prev, userMessage]);
    
    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Get AI response - send audio URI for backend processing
      const response = await postFollowUp(text, userAudioUri);
      
      setConversation(prev => [...prev, response]);
      
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
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Loading your commute...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleOpenSettings}
            activeOpacity={0.7}
          >
            <SettingsIcon size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
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
              audioUrl={decision.audioUrl}
              autoPlayAudio={settings.autoplayVoice}
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
    backgroundColor: 'transparent',
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
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
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
