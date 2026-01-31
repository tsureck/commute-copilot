import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ConversationMessage } from '../types';
import { AnimatedWaveform } from './AnimatedWaveform';

interface ConversationBubbleProps {
  message: ConversationMessage;
  onPlayAudio?: () => void;
  isPlaying?: boolean;
}

export function ConversationBubble({ 
  message, 
  onPlayAudio, 
  isPlaying = false 
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
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={onPlayAudio}
            activeOpacity={0.7}
          >
            <AnimatedWaveform 
              isPlaying={isPlaying} 
              size="small" 
              color={theme.colors.accent}
            />
            <Text style={styles.audioLabel}>
              {isPlaying ? 'Playing...' : 'Listen'}
            </Text>
          </TouchableOpacity>
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
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
  },
  audioLabel: {
    fontSize: theme.typography.sm,
    color: theme.colors.accent,
    marginLeft: theme.spacing.sm,
  },
});
