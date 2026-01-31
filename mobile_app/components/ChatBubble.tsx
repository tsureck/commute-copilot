import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onPlayAudio?: (url: string) => void;
  isPlayingAudio?: boolean;
}

export function ChatBubble({ message, onPlayAudio, isPlayingAudio }: ChatBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer,
    ]}>
      <View style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
      ]}>
        <Text style={[
          styles.text,
          isUser ? styles.userText : styles.assistantText,
        ]}>
          {message.text}
        </Text>
        
        {message.audio_url && !isUser && (
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={() => onPlayAudio?.(message.audio_url!)}
            activeOpacity={0.7}
          >
            <Text style={styles.audioIcon}>
              {isPlayingAudio ? '🔊' : '🔈'}
            </Text>
            <Text style={styles.audioLabel}>
              {isPlayingAudio ? 'Playing...' : 'Listen'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={[
        styles.timestamp,
        isUser ? styles.userTimestamp : styles.assistantTimestamp,
      ]}>
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: {
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
  text: {
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
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  audioLabel: {
    fontSize: theme.typography.sm,
    color: theme.colors.accent,
  },
});
