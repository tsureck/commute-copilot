import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { theme } from '../theme';
import { AnimatedWaveform } from './AnimatedWaveform';

interface AudioControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  onToggle: () => void;
  onSeek?: (position: number) => void;
  reduceMotion?: boolean;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AudioControls({
  isPlaying,
  isLoading,
  progress,
  currentTime,
  duration,
  onToggle,
  onSeek,
  reduceMotion = false,
}: AudioControlsProps) {
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.playButton} 
        onPress={onToggle}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.textPrimary} size="small" />
        ) : (
          <Text style={styles.playIcon}>
            {isPlaying ? '⏸️' : '▶️'}
          </Text>
        )}
      </TouchableOpacity>

      <View style={styles.progressContainer}>
        <View style={styles.waveformContainer}>
          {isPlaying && !reduceMotion ? (
            <AnimatedWaveform 
              isPlaying={isPlaying} 
              size="small" 
              reduceMotion={reduceMotion}
            />
          ) : (
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${progress * 100}%` }
                ]} 
              />
            </View>
          )}
        </View>
        
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
          <Text style={styles.timeText}>{formatTime(duration)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  playButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  playIcon: {
    fontSize: 18,
  },
  progressContainer: {
    flex: 1,
  },
  waveformContainer: {
    height: 24,
    justifyContent: 'center',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: theme.colors.glassBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  timeText: {
    fontSize: theme.typography.xs,
    color: theme.colors.textSecondary,
  },
});
