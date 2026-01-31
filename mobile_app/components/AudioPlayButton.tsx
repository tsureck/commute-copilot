import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { theme } from '../theme';

interface AudioPlayButtonProps {
  audioUrl: string;
  label?: string;
  size?: 'medium' | 'large';
  autoPlay?: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Animated waveform bar component
function WaveBar({ index, isPlaying, height }: { index: number; isPlaying: boolean; height: number }) {
  const scaleY = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isPlaying) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleY, {
            toValue: 0.3 + Math.random() * 0.7,
            duration: 200 + Math.random() * 300,
            delay: index * 50,
            useNativeDriver: true,
          }),
          Animated.timing(scaleY, {
            toValue: 0.2 + Math.random() * 0.3,
            duration: 200 + Math.random() * 300,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      // Static waveform pattern when not playing
      Animated.timing(scaleY, {
        toValue: 0.3 + (Math.sin(index * 0.8) * 0.3 + 0.3),
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPlaying, index, scaleY]);

  return (
    <Animated.View
      style={[
        styles.waveBar,
        { 
          height,
          transform: [{ scaleY }],
          backgroundColor: isPlaying ? theme.colors.accent : theme.colors.textTertiary,
        },
      ]}
    />
  );
}

export function AudioPlayButton({
  audioUrl,
  label = 'Listen to explanation',
  size = 'large',
  autoPlay = false,
  onPlayStateChange,
}: AudioPlayButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const hasAutoPlayed = useRef(false);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const isLarge = size === 'large';
  const barCount = isLarge ? 20 : 14;
  const barHeight = isLarge ? 32 : 24;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  // Notify parent of play state changes
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && audioUrl && !hasAutoPlayed.current) {
      hasAutoPlayed.current = true;
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        handlePress();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPlay, audioUrl]);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    setIsPlaying(status.isPlaying);
    setDuration(status.durationMillis || 0);
    setCurrentTime(status.positionMillis || 0);

    if (status.didJustFinish) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, []);

  const handlePress = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
          } else {
            if (status.positionMillis >= (status.durationMillis || 0) - 100) {
              await soundRef.current.setPositionAsync(0);
            }
            await soundRef.current.playAsync();
          }
        }
      } else {
        setIsLoading(true);
        
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: audioUrl },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );

        soundRef.current = sound;
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsLoading(false);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <TouchableOpacity
      style={[styles.container, isLarge && styles.containerLarge]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={[styles.label, isLarge && styles.labelLarge]} numberOfLines={1}>
          {isPlaying ? 'Playing...' : label}
        </Text>
        {isLoading && (
          <ActivityIndicator size="small" color={theme.colors.accent} />
        )}
      </View>

      {/* Waveform - the main clickable element */}
      <View style={[styles.waveformContainer, isLarge && styles.waveformContainerLarge]}>
        {Array.from({ length: barCount }).map((_, i) => (
          <WaveBar key={i} index={i} isPlaying={isPlaying} height={barHeight} />
        ))}
        
        {/* Progress overlay */}
        <View 
          style={[
            styles.progressOverlay,
            { width: `${progress}%` }
          ]} 
        />
      </View>
      
      {/* Duration row */}
      <View style={styles.durationRow}>
        <Text style={styles.duration}>
          {formatDuration(currentTime)}
        </Text>
        <Text style={styles.duration}>
          {duration > 0 ? formatDuration(duration) : '--:--'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  containerLarge: {
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.medium,
    color: theme.colors.textSecondary,
  },
  labelLarge: {
    fontSize: theme.typography.md,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 32,
    marginBottom: theme.spacing.sm,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: theme.borderRadius.sm,
  },
  waveformContainerLarge: {
    height: 40,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
  },
  progressOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.colors.accent,
    opacity: 0.15,
    borderRadius: theme.borderRadius.sm,
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  duration: {
    fontSize: theme.typography.xs,
    color: theme.colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
});
