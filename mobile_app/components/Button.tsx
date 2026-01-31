import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const variantStyles = {
  primary: 'primary' as const,
  secondary: 'secondary' as const,
  ghost: 'ghost' as const,
};

const sizeStyles = {
  small: 'smallSize' as const,
  medium: 'mediumSize' as const,
  large: 'largeSize' as const,
};

const labelVariantStyles = {
  primary: 'primaryLabel' as const,
  secondary: 'secondaryLabel' as const,
  ghost: 'ghostLabel' as const,
};

const labelSizeStyles = {
  small: 'smallLabel' as const,
  medium: 'mediumLabel' as const,
  large: 'largeLabel' as const,
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}: ButtonProps) {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const buttonStyle = [
    styles.base,
    styles[variantStyles[variant]],
    styles[sizeStyles[size]],
    disabled && styles.disabled,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[labelVariantStyles[variant]],
    styles[labelSizeStyles[size]],
    disabled && styles.disabledLabel,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'primary' ? theme.colors.textPrimary : theme.colors.accent} 
          size="small" 
        />
      ) : (
        <>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={labelStyle}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.lg,
  },
  primary: {
    backgroundColor: theme.colors.accent,
  },
  secondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  smallSize: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  mediumSize: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
  },
  largeSize: {
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: theme.typography.semibold,
  },
  primaryLabel: {
    color: theme.colors.textPrimary,
  },
  secondaryLabel: {
    color: theme.colors.textPrimary,
  },
  ghostLabel: {
    color: theme.colors.accent,
  },
  smallLabel: {
    fontSize: theme.typography.sm,
  },
  mediumLabel: {
    fontSize: theme.typography.md,
  },
  largeLabel: {
    fontSize: theme.typography.lg,
  },
  disabledLabel: {
    opacity: 0.7,
  },
  icon: {
    marginRight: theme.spacing.sm,
    fontSize: 16,
  },
});
