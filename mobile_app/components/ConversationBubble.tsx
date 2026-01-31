import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { ConversationMessage } from '../types';
import { AudioPlayButton } from './AudioPlayButton';

// Modern AI/Copilot icon - abstract waveform/signal shape
function AiIcon({ size, color }: { size: number; color: string }) {
  const barWidth = size * 0.12;
  const gap = size * 0.08;
  const heights = [0.4, 0.7, 1, 0.7, 0.4];
  
  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
      flexDirection: 'row',
      gap: gap,
    }}>
      {heights.map((heightRatio, index) => (
        <View
          key={index}
          style={{
            width: barWidth,
            height: size * 0.6 * heightRatio,
            backgroundColor: color,
            borderRadius: barWidth / 2,
          }}
        />
      ))}
    </View>
  );
}

// Modern User icon - abstract person silhouette
function UserIcon({ size, color }: { size: number; color: string }) {
  return (
    <View style={{ 
      width: size, 
      height: size, 
      alignItems: 'center', 
      justifyContent: 'center',
    }}>
      {/* Head */}
      <View
        style={{
          width: size * 0.35,
          height: size * 0.35,
          borderRadius: size * 0.175,
          backgroundColor: color,
          marginBottom: size * 0.05,
        }}
      />
      {/* Body/shoulders */}
      <View
        style={{
          width: size * 0.6,
          height: size * 0.3,
          backgroundColor: color,
          borderTopLeftRadius: size * 0.3,
          borderTopRightRadius: size * 0.3,
          borderBottomLeftRadius: size * 0.1,
          borderBottomRightRadius: size * 0.1,
        }}
      />
    </View>
  );
}

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
          <AiIcon size={18} color={theme.colors.iconWeather} />
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
        
        {/* Audio button for assistant messages - auto-plays */}
        {message.audioUrl && !isUser && (
          <View style={styles.audioContainer}>
            <AudioPlayButton
              audioUrl={message.audioUrl}
              label="Listen"
              size="medium"
              autoPlay={true}
            />
          </View>
        )}
      </View>
      
      {isUser && (
        <View style={styles.userAvatar}>
          <UserIcon size={18} color={theme.colors.textPrimary} />
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
