/**
 * Record button component for voice input.
 */

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { LoadingState } from '../types';

interface RecordButtonProps {
  loadingState: LoadingState;
  onPressIn: () => void;
  onPressOut: () => void;
  disabled?: boolean;
}

export function RecordButton({ 
  loadingState, 
  onPressIn, 
  onPressOut, 
  disabled,
}: RecordButtonProps) {
  const isRecording = loadingState === 'recording';
  const isProcessing = ['transcribing', 'thinking', 'generating'].includes(loadingState);
  
  const getStatusText = () => {
    switch (loadingState) {
      case 'recording':
        return 'Release to send';
      case 'transcribing':
        return 'Transcribing...';
      case 'thinking':
        return 'Thinking...';
      case 'generating':
        return 'Generating audio...';
      case 'error':
        return 'Error - try again';
      default:
        return 'Hold to talk';
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          isRecording && styles.buttonRecording,
          isProcessing && styles.buttonProcessing,
          disabled && styles.buttonDisabled,
        ]}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled || isProcessing}
        activeOpacity={0.8}
      >
        {isProcessing ? (
          <ActivityIndicator size="large" color="#FFFFFF" />
        ) : (
          <Text style={styles.buttonIcon}>
            {isRecording ? '🔴' : '🎤'}
          </Text>
        )}
      </TouchableOpacity>
      
      <Text style={[
        styles.statusText,
        loadingState === 'error' && styles.errorText,
      ]}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90D9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonRecording: {
    backgroundColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  buttonProcessing: {
    backgroundColor: '#636366',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonIcon: {
    fontSize: 32,
  },
  statusText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    color: '#FF3B30',
  },
});
