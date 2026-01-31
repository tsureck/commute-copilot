import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { CurrentUpdate, Severity } from '../types';
import { ModernIcon } from './UpdateIcon';

interface UpdateCardProps {
  update: CurrentUpdate;
}

const severityColors: Record<Severity, string> = {
  high: theme.colors.severityHigh,
  medium: theme.colors.severityMedium,
  low: theme.colors.severityLow,
};

// Weather types use dark blue color
const weatherTypes = ['weather', 'rain', 'sun', 'cloud', 'snow'];

export function UpdateCard({ update }: UpdateCardProps) {
  // Use dark blue for weather, otherwise use severity color
  const isWeather = weatherTypes.includes(update.type) || weatherTypes.includes(update.icon);
  const iconColor = isWeather ? theme.colors.iconWeather : severityColors[update.severity];
  const severityColor = severityColors[update.severity];
  
  return (
    <View style={styles.container}>
      {/* Icon with glow effect */}
      <View style={styles.iconContainer}>
        <View style={[styles.iconGlow, { backgroundColor: iconColor }]} />
        <View style={styles.iconWrapper}>
          <ModernIcon 
            type={update.icon as any} 
            size={28} 
            color={iconColor} 
          />
        </View>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{update.title}</Text>
          {update.line && (
            <View style={[styles.lineBadge, { borderColor: severityColor }]}>
              <Text style={[styles.lineText, { color: severityColor }]}>{update.line}</Text>
            </View>
          )}
        </View>
        <Text style={styles.message}>{update.message}</Text>
      </View>
      
      {/* Severity indicator dot */}
      <View style={styles.severityContainer}>
        <View style={[styles.severityDot, { backgroundColor: severityColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
  },
  iconContainer: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  iconGlow: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    opacity: 0.15,
    top: -6,
    left: -6,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  lineBadge: {
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  lineText: {
    fontSize: theme.typography.xs,
    fontWeight: theme.typography.bold,
  },
  message: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  severityContainer: {
    marginLeft: theme.spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
