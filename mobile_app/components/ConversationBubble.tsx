import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ConversationMessage } from '../types';
import { AudioPlayButton } from './AudioPlayButton';

interface ConversationBubbleProps {
  message: ConversationMessage;
}

export function ConversationBubble({ 
  message, 
}: ConversationBubbleProps) {
  const isUser = message.role === 'user';
  
  return (
    <View style={[
      styles.container,
      isUser ? styles.userContainer : styles.assistantContainer,
    ]}>
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <Text style={styles.avatarEmoji}>🤖</Text>
        </View>
      )}
      
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
        
        {/* Audio button for assistant messages */}
        {message.audioUrl && !isUser && (
          <View style={styles.audioContainer}>
            <AudioPlayButton
              audioUrl={message.audioUrl}
              label="Listen"
              size="medium"
            />
          </View>
        )}
      </View>
      
      {isUser && (
        <View style={styles.userAvatar}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  userContainer: {
    justifyContent: 'flex-end',
  },
  assistantContainer: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    maxWidth: '75%',
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
  audioContainer: {
    marginTop: theme.spacing.md,
  },
});
