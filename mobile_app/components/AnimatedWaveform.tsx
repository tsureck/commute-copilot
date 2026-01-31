import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, Easing } from 'react-native';
import { theme } from '../theme';

interface AnimatedWaveformProps {
  isPlaying?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  reduceMotion?: boolean;
}

const BAR_COUNT = 5;

export function AnimatedWaveform({
  isPlaying = true,
  size = 'medium',
  color = theme.colors.accent,
  style,
  reduceMotion = false,
}: AnimatedWaveformProps) {
  // Use React Native's Animated API (works reliably in Expo Go)
  const animatedValues = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.3))
  ).current;
  
  const sizeConfig = {
    small: { height: 24, width: 32, barWidth: 3, gap: 3 },
    medium: { height: 48, width: 64, barWidth: 6, gap: 5 },
    large: { height: 72, width: 96, barWidth: 8, gap: 6 },
  };
  
  const config = sizeConfig[size];

  useEffect(() => {
    if (reduceMotion) {
      // Static bars when motion is reduced
      animatedValues.forEach((anim) => {
        anim.setValue(0.5);
      });
      return;
    }

    if (isPlaying) {
      // Animate bars with different timing
      const animations = animatedValues.map((anim, index) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(index * 80),
            Animated.timing(anim, {
              toValue: 0.9,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: 0.2,
              duration: 400,
              easing: Easing.inOut(Easing.ease),
              useNativeDriver: false,
            }),
          ])
        );
      });
      
      Animated.parallel(animations).start();
      
      return () => {
        animations.forEach(anim => anim.stop());
      };
    } else {
      // Settle to idle state
      const animations = animatedValues.map((anim, index) => {
        return Animated.timing(anim, {
          toValue: 0.3 + (index % 2) * 0.2,
          duration: 300,
          useNativeDriver: false,
        });
      });
      
      Animated.parallel(animations).start();
    }
  }, [isPlaying, reduceMotion]);

  return (
    <View style={[styles.container, { width: config.width, height: config.height }, style]}>
      {animatedValues.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              width: config.barWidth,
              backgroundColor: color,
              marginHorizontal: config.gap / 2,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bar: {
    borderRadius: theme.borderRadius.full,
    minHeight: 4,
  },
});
