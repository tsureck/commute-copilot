import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Recommendation, ConfidenceIndicator } from '../types';
import { AnimatedWaveform } from './AnimatedWaveform';

interface RecommendationCardProps {
  recommendation: Recommendation;
  confidence: ConfidenceIndicator;
  isPlaying: boolean;
  onPlayAudio: () => void;
}

const iconMap: Record<string, string> = {
  train: '🚆',
  home: '🏠',
  car: '🚗',
  bus: '🚌',
  walk: '🚶',
  default: '✓',
};

const confidenceColors: Record<ConfidenceIndicator, string> = {
  high: theme.colors.confidenceHigh,
  medium: theme.colors.confidenceMedium,
  low: theme.colors.confidenceLow,
};

export function RecommendationCard({ 
  recommendation, 
  confidence,
  isPlaying,
  onPlayAudio,
}: RecommendationCardProps) {
  const icon = iconMap[recommendation.icon] || iconMap.default;
  const confidenceColor = confidenceColors[confidence];
  
  return (
    <View style={styles.container}>
      {/* Header with action */}
      <View style={styles.header}>
        <View style={styles.actionBadge}>
          <Text style={styles.actionIcon}>{icon}</Text>
          <Text style={styles.actionText}>{recommendation.action}</Text>
        </View>
        <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
      </View>
      
      {/* Primary instruction */}
      <Text style={styles.primaryInstruction}>
        {recommendation.primaryInstruction}
      </Text>
      
      {/* Time badge if available */}
      {recommendation.recommendedDepartureTime && (
        <View style={styles.timeBadge}>
          <Text style={styles.timeLabel}>Departure</Text>
          <Text style={styles.timeValue}>{recommendation.recommendedDepartureTime}</Text>
        </View>
      )}
      
      {/* Reason */}
      <Text style={styles.reason}>{recommendation.reasonShort}</Text>
      
      {/* Audio player */}
      <TouchableOpacity 
        style={styles.audioButton}
        onPress={onPlayAudio}
        activeOpacity={0.7}
      >
        <View style={styles.audioLeft}>
          <AnimatedWaveform 
            isPlaying={isPlaying} 
            size="small" 
            color={theme.colors.accent}
          />
        </View>
        <Text style={styles.audioLabel}>
          {isPlaying ? 'Playing explanation...' : 'Listen to explanation'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  actionIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
  },
  confidenceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  primaryInstruction: {
    fontSize: theme.typography.xxl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  timeLabel: {
    fontSize: theme.typography.sm,
    color: theme.colors.textTertiary,
    marginRight: theme.spacing.sm,
  },
  timeValue: {
    fontSize: theme.typography.lg,
    fontWeight: theme.typography.semibold,
    color: theme.colors.accent,
  },
  reason: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: theme.spacing.lg,
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  audioLeft: {
    marginRight: theme.spacing.md,
  },
  audioLabel: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
});
