import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { CurrentUpdate, Severity } from '../types';

interface UpdateCardProps {
  update: CurrentUpdate;
}

const iconMap: Record<string, string> = {
  rain: '🌧️',
  sun: '☀️',
  cloud: '☁️',
  snow: '❄️',
  train: '🚆',
  bus: '🚌',
  car: '🚗',
  calendar: '📅',
  default: '📋',
};

const severityColors: Record<Severity, string> = {
  high: theme.colors.severityHigh,
  medium: theme.colors.severityMedium,
  low: theme.colors.severityLow,
};

export function UpdateCard({ update }: UpdateCardProps) {
  const icon = iconMap[update.icon] || iconMap.default;
  const severityColor = severityColors[update.severity];
  
  return (
    <View style={styles.container}>
      <View style={[styles.severityBar, { backgroundColor: severityColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.title}>{update.title}</Text>
          {update.line && (
            <View style={styles.lineBadge}>
              <Text style={styles.lineText}>{update.line}</Text>
            </View>
          )}
        </View>
        <Text style={styles.message}>{update.message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  severityBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  icon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  lineBadge: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  lineText: {
    fontSize: theme.typography.xs,
    fontWeight: theme.typography.semibold,
    color: theme.colors.accent,
  },
  message: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
});
