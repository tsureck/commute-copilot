import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { theme } from '../theme';

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  disabled?: boolean;
}

export function MicButton({ 
  isRecording, 
  isProcessing, 
  onPress,
  disabled = false,
}: MicButtonProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRecording]);
  
  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.buttonOuter,
        isRecording && styles.buttonOuterRecording,
        { transform: [{ scale: pulseAnim }] },
      ]}>
        <TouchableOpacity
          style={[
            styles.button,
            isRecording && styles.buttonRecording,
            disabled && styles.buttonDisabled,
          ]}
          onPress={onPress}
          disabled={disabled || isProcessing}
          activeOpacity={0.8}
        >
          {isProcessing ? (
            <Text style={styles.icon}>⏳</Text>
          ) : (
            <Text style={styles.icon}>{isRecording ? '⏹️' : '🎤'}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      <Text style={styles.label}>
        {isProcessing 
          ? 'Processing...' 
          : isRecording 
            ? 'Tap to stop' 
            : 'Tap to respond'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  buttonOuter: {
    padding: 4,
    borderRadius: 40,
    backgroundColor: 'transparent',
  },
  buttonOuterRecording: {
    backgroundColor: `${theme.colors.micActive}30`,
  },
  button: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.glassBorder,
  },
  buttonRecording: {
    backgroundColor: theme.colors.micActive,
    borderColor: theme.colors.micActive,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 28,
  },
  label: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
});
