import React, { useState, useRef } from 'react';
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
  ModernIcon,
} from '../components';
import { useSettings, useAudioRecorder } from '../hooks';
import { getDecision, postFollowUp, resetFollowUpCount } from '../api';
import { AgentDecision, ConversationMessage } from '../types';
import { generateId } from '../utils';

// View modes
type ViewMode = 'widget' | 'expanded';

export default function HomeScreen() {
  const { settings } = useSettings();
  const audioRecorder = useAudioRecorder();
  
  const [viewMode, setViewMode] = useState<ViewMode>('widget');
  const [decision, setDecision] = useState<AgentDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  
  const scrollViewRef = useRef<ScrollView>(null);

  const loadDecision = async () => {
    setIsLoading(true);
    try {
      const data = await getDecision();
      setDecision(data);
      return data;
    } catch (error) {
      console.error('Failed to load decision:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDecision();
    setIsRefreshing(false);
  };

  // Handle confidence button tap - toggles between widget and expanded view
  const handleConfidencePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (viewMode === 'widget') {
      // Fetch data from backend and expand
      const data = await loadDecision();
      if (data) {
        setViewMode('expanded');
      }
    } else {
      // Go back to widget view
      setViewMode('widget');
      setConversation([]); // Clear conversation when collapsing
      resetFollowUpCount(); // Reset audio counter for next session
    }
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

  // Widget View - Simple recommendation display
  const renderWidgetView = () => (
    <View style={styles.widgetContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good morning</Text>
          <Text style={styles.title}>Commute Copilot</Text>
        </View>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={handleOpenSettings}
          activeOpacity={0.7}
        >
          <SettingsIcon size={24} color={theme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Widget Card */}
      <View style={styles.widgetCard}>
        <View style={styles.widgetIconContainer}>
          <ModernIcon type="train" size={48} color={theme.colors.iconWeather} />
        </View>
        
        <Text style={styles.widgetAction}>Your Next Train</Text>
        <Text style={styles.widgetInstruction}>RE4 at 08:34</Text>
        <Text style={styles.widgetSubtext}>Tap below to get details</Text>

        {/* Confidence Button - Triggers API call */}
        <TouchableOpacity
          style={styles.confidenceButton}
          onPress={handleConfidencePress}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={theme.colors.textPrimary} />
          ) : (
            <>
              <View style={[styles.confidenceDot, { backgroundColor: theme.colors.confidenceHigh }]} />
              <Text style={styles.confidenceButtonText}>High confidence</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  // Expanded View - Full decision with all details
  const renderExpandedView = () => (
    <>
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
            <Text style={styles.greeting}>Your Commute</Text>
            <Text style={styles.title}>Details</Text>
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
              onConfidencePress={handleConfidencePress}
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
    </>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {viewMode === 'widget' ? renderWidgetView() : renderExpandedView()}
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
  
  // Widget View Styles
  widgetContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
  },
  widgetCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    marginTop: -theme.spacing.xxxl, // Offset to center better
  },
  widgetIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.glassBackground,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xxl,
  },
  widgetAction: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  widgetInstruction: {
    fontSize: 36,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  widgetSubtext: {
    fontSize: theme.typography.sm,
    color: theme.colors.textTertiary,
    marginBottom: theme.spacing.xxxl,
  },
  confidenceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    minWidth: 180,
    justifyContent: 'center',
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: theme.spacing.sm,
  },
  confidenceButtonText: {
    fontSize: theme.typography.md,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
  },

  // Header Styles
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
