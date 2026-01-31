import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface StatusPreviewCardProps {
  title: string;
  subtitle: string;
  emoji: string;
  onPress?: () => void;
}

export function StatusPreviewCard({ title, subtitle, emoji, onPress }: StatusPreviewCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emoji: {
    fontSize: 28,
    marginRight: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: theme.typography.md,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
  },
});
