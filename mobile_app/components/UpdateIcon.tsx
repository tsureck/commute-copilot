import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { UpdateType } from '../types';

interface UpdateIconProps {
  type: UpdateType;
  size?: number;
}

const iconConfig: Record<UpdateType, { emoji: string; color: string }> = {
  weather: { emoji: '🌤️', color: theme.colors.iconWeather },
  train: { emoji: '🚆', color: theme.colors.iconTrain },
  calendar: { emoji: '📅', color: theme.colors.iconCalendar },
  traffic: { emoji: '🚗', color: theme.colors.iconTraffic },
};

export function UpdateIcon({ type, size = 24 }: UpdateIconProps) {
  const config = iconConfig[type];
  
  return (
    <View style={[styles.container, { width: size + 12, height: size + 12 }]}>
      <Text style={{ fontSize: size * 0.7 }}>{config.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
  },
});
