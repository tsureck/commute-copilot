/**
 * Chat bubble component for displaying messages.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { ChatMessage } from '../types';

interface ChatBubbleProps {
  message: ChatMessage;
  onPlayAudio?: () => void;
  isPlayingAudio?: boolean;
  isLoadingAudio?: boolean;
}

export function ChatBubble({ 
  message, 
  onPlayAudio, 
  isPlayingAudio,
  isLoadingAudio,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const hasAudio = !!message.audioBase64;
  
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
        
        {hasAudio && !isUser && (
          <TouchableOpacity 
            style={styles.audioButton}
            onPress={onPlayAudio}
            activeOpacity={0.7}
            disabled={isLoadingAudio}
          >
            {isLoadingAudio ? (
              <ActivityIndicator size="small" color="#4A90D9" />
            ) : (
              <>
                <Text style={styles.audioIcon}>
                  {isPlayingAudio ? '⏹' : '▶'}
                </Text>
                <Text style={styles.audioLabel}>
                  {isPlayingAudio ? 'Stop' : 'Play'}
                </Text>
              </>
            )}
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
    marginVertical: 8,
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
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: '#4A90D9',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#2A2A2E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  assistantText: {
    color: '#E5E5E7',
  },
  timestamp: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  userTimestamp: {
    marginRight: 4,
  },
  assistantTimestamp: {
    marginLeft: 4,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  audioIcon: {
    fontSize: 14,
    marginRight: 8,
    color: '#4A90D9',
  },
  audioLabel: {
    fontSize: 14,
    color: '#4A90D9',
  },
});
