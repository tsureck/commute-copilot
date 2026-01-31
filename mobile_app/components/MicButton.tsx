import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Animated, Easing } from 'react-native';
import { theme } from '../theme';

interface MicButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onPress: () => void;
  disabled?: boolean;
}

// Animated waveform bar
function AnimatedBar({ 
  color, 
  width, 
  maxHeight, 
  isAnimating, 
  delay 
}: { 
  color: string; 
  width: number; 
  maxHeight: number; 
  isAnimating: boolean; 
  delay: number;
}) {
  const heightAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isAnimating) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(heightAnim, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 150 + Math.random() * 150,
            delay,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(heightAnim, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: 150 + Math.random() * 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      Animated.timing(heightAnim, {
        toValue: 0.4,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  }, [isAnimating, delay, heightAnim]);

  return (
    <Animated.View
      style={{
        width,
        height: heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, maxHeight],
        }),
        backgroundColor: color,
        borderRadius: width / 2,
      }}
    />
  );
}

// Waveform style icon for microphone (5 bars)
function WaveformIcon({ color, size, isAnimating = false }: { color: string; size: number; isAnimating?: boolean }) {
  const barWidth = size * 0.12;
  const maxHeight = size * 0.7;
  const delays = [0, 50, 100, 50, 0];
  
  // Static heights when not animating
  const staticHeights = [0.35, 0.55, 0.8, 0.55, 0.35];
  
  return (
    <View style={{ 
      width: size, 
      height: size, 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center',
      gap: size * 0.06,
    }}>
      {staticHeights.map((heightRatio, index) => (
        isAnimating ? (
          <AnimatedBar
            key={index}
            color={color}
            width={barWidth}
            maxHeight={maxHeight}
            isAnimating={isAnimating}
            delay={delays[index]}
          />
        ) : (
          <View
            key={index}
            style={{
              width: barWidth,
              height: maxHeight * heightRatio,
              backgroundColor: color,
              borderRadius: barWidth / 2,
            }}
          />
        )
      ))}
    </View>
  );
}

// Stop icon (square)
function StopIcon({ color, size }: { color: string; size: number }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.5,
        height: size * 0.5,
        backgroundColor: color,
        borderRadius: size * 0.08,
      }} />
    </View>
  );
}

// Knight Rider style scanning animation
function ProcessingIcon({ color, size }: { color: string; size: number }) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const barCount = 5;
  const barWidth = size * 0.1;
  const totalWidth = size * 0.8;
  
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [scanAnim]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: totalWidth }}>
        {Array.from({ length: barCount }).map((_, index) => {
          // Calculate opacity based on distance from scan position
          const barPosition = index / (barCount - 1);
          const opacity = scanAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [
              1 - Math.abs(barPosition - 0) * 1.5,
              1 - Math.abs(barPosition - 1) * 1.5,
            ],
          });
          
          return (
            <Animated.View
              key={index}
              style={{
                width: barWidth,
                height: size * 0.5,
                backgroundColor: color,
                borderRadius: barWidth / 2,
                opacity: opacity.interpolate({
                  inputRange: [-0.5, 0, 1],
                  outputRange: [0.2, 0.2, 1],
                  extrapolate: 'clamp',
                }),
              }}
            />
          );
        })}
      </View>
    </View>
  );
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

  const iconColor = isRecording ? theme.colors.textPrimary : theme.colors.accent;
  
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
            <ProcessingIcon color={iconColor} size={36} />
          ) : (
            <WaveformIcon color={iconColor} size={36} isAnimating={isRecording} />
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
  label: {
    marginTop: theme.spacing.sm,
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
});
