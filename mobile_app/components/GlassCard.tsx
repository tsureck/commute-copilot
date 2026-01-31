import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { theme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  reduceMotion?: boolean;
}

export function GlassCard({ 
  children, 
  style, 
  delay = 0,
  reduceMotion = false,
}: GlassCardProps) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 20)).current;

  useEffect(() => {
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: theme.animations.normal,
          delay: delay,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: theme.animations.normal,
          delay: delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [delay, reduceMotion]);

  return (
    <Animated.View 
      style={[
        styles.card, 
        { 
          opacity, 
          transform: [{ translateY }] 
        }, 
        style
      ]}
    >
      <View style={styles.innerContent}>
        {children}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    overflow: 'hidden',
  },
  innerContent: {
    padding: theme.spacing.lg,
  },
});
