import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Confidence } from '../types';

interface ConfidencePillProps {
  confidence: Confidence;
}

const confidenceConfig: Record<Confidence, { label: string; color: string }> = {
  high: { label: 'High confidence', color: theme.colors.confidenceHigh },
  medium: { label: 'Medium confidence', color: theme.colors.confidenceMedium },
  low: { label: 'Low confidence', color: theme.colors.confidenceLow },
};

export function ConfidencePill({ confidence }: ConfidencePillProps) {
  const config = confidenceConfig[confidence];
  
  return (
    <View style={[styles.pill, { backgroundColor: `${config.color}20` }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }]}>
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: theme.spacing.sm,
  },
  label: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.medium,
  },
});
