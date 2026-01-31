import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { theme } from '../theme';
import {
  ChatBubble,
  ConversationDock,
  QuickReplyChips,
} from '../components';
import {
  useAudioPlayer,
  useAudioRecorder,
  useSettings,
  useChatStorage,
} from '../hooks';
import { postChat } from '../api';
import { ChatMessage } from '../types';

const QUICK_REPLIES = [
  "What's the weather like?",
  "Train status?",
  "Best route home?",
  "Traffic update",
];

export default function ChatScreen() {
  const { settings } = useSettings();
  const chatStorage = useChatStorage('main-chat');
  const audioPlayer = useAudioPlayer();
  const audioRecorder = useAudioRecorder();
  
  const [isSending, setIsSending] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const flatListRef = useRef<FlatList>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatStorage.messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatStorage.messages.length]);

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
      
      // Autoplay audio if enabled
      if (settings.autoplayVoice && response.audio_url) {
        setPlayingMessageId(response.id);
        await audioPlayer.load(response.audio_url, true);
      }
    } catch (err) {
      console.error('Failed to get chat response:', err);
      // Add error message
      await chatStorage.addMessage({
        role: 'assistant',
        text: "Sorry, I couldn't process that. Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  }, [chatStorage, settings.autoplayVoice, audioPlayer]);

  const handleStartRecording = async () => {
    await audioRecorder.startRecording();
  };

  const handleStopRecording = async () => {
    const transcription = await audioRecorder.stopRecording();
    if (transcription) {
      await handleSendMessage(transcription);
    }
  };

  const handlePlayAudio = async (url: string, messageId?: string) => {
    if (messageId) {
      setPlayingMessageId(messageId);
    }
    await audioPlayer.load(url, true);
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <ChatBubble
      message={item}
      onPlayAudio={(url) => handlePlayAudio(url, item.id)}
      isPlayingAudio={playingMessageId === item.id && audioPlayer.isPlaying}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={styles.emptyTitle}>Start a conversation</Text>
      <Text style={styles.emptySubtitle}>
        Ask me about your commute, weather, or traffic conditions.
      </Text>
    </View>
  );

  const renderFooter = () => {
    // Show quick replies only after assistant messages
    const lastMessage = chatStorage.messages[chatStorage.messages.length - 1];
    if (lastMessage?.role === 'assistant' && !isSending) {
      return (
        <QuickReplyChips
          chips={QUICK_REPLIES}
          onSelect={handleQuickReply}
        />
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={chatStorage.messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
        />

        <ConversationDock
          onSendMessage={handleSendMessage}
          onStartRecording={handleStartRecording}
          onStopRecording={handleStopRecording}
          isRecording={audioRecorder.isRecording}
          isProcessing={audioRecorder.isProcessing}
          isSending={isSending}
          reduceMotion={settings.reduceMotion}
        />
      </KeyboardAvoidingView>
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
  messageList: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 100, // Account for header
    paddingBottom: theme.spacing.md,
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
});
