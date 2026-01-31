import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';
import { Recommendation, ConfidenceIndicator } from '../types';
import { AudioPlayButton } from './AudioPlayButton';
import { ModernIcon } from './UpdateIcon';

interface RecommendationCardProps {
  recommendation: Recommendation;
  confidence: ConfidenceIndicator;
  audioUrl?: string;
  autoPlayAudio?: boolean;
  onConfidencePress?: () => void;
}

const confidenceColors: Record<ConfidenceIndicator, string> = {
  high: theme.colors.confidenceHigh,
  medium: theme.colors.confidenceMedium,
  low: theme.colors.confidenceLow,
};

const confidenceLabels: Record<ConfidenceIndicator, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
};

export function RecommendationCard({ 
  recommendation, 
  confidence,
  audioUrl,
  autoPlayAudio = false,
  onConfidencePress,
}: RecommendationCardProps) {
  const confidenceColor = confidenceColors[confidence];
  
  const ConfidenceBadgeContent = (
    <>
      <View style={[styles.confidenceDot, { backgroundColor: confidenceColor }]} />
      <Text style={[styles.confidenceText, { color: confidenceColor }]}>
        {confidenceLabels[confidence]}
      </Text>
    </>
  );
  
  return (
    <View style={styles.container}>
      {/* Header with action */}
      <View style={styles.header}>
        <View style={styles.actionBadge}>
          <View style={styles.actionIconWrapper}>
            <ModernIcon 
              type={recommendation.icon as any || 'default'} 
              size={20} 
              color={theme.colors.iconWeather} 
            />
          </View>
          <Text style={styles.actionText}>{recommendation.action}</Text>
        </View>
        {onConfidencePress ? (
          <TouchableOpacity 
            style={styles.confidenceBadgeButton}
            onPress={onConfidencePress}
            activeOpacity={0.7}
          >
            {ConfidenceBadgeContent}
          </TouchableOpacity>
        ) : (
          <View style={styles.confidenceBadge}>
            {ConfidenceBadgeContent}
          </View>
        )}
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
      {audioUrl && (
        <AudioPlayButton
          audioUrl={audioUrl}
          label="Listen to explanation"
          size="large"
          autoPlay={autoPlayAudio}
        />
      )}
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
    marginBottom: theme.spacing.lg,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
  },
  actionIconWrapper: {
    marginRight: theme.spacing.sm,
  },
  actionText: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.xs,
  },
  confidenceText: {
    fontSize: theme.typography.xs,
    fontWeight: theme.typography.medium,
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
});
