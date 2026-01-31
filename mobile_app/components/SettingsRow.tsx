import React from 'react';
import { View, Text, StyleSheet, Switch, TextInput, TouchableOpacity } from 'react-native';
import { theme } from '../theme';

interface SettingsRowProps {
  label: string;
  description?: string;
  type: 'toggle' | 'input' | 'button';
  value?: boolean | string;
  onValueChange?: (value: boolean | string) => void;
  onPress?: () => void;
  buttonTitle?: string;
  placeholder?: string;
}

export function SettingsRow({
  label,
  description,
  type,
  value,
  onValueChange,
  onPress,
  buttonTitle,
  placeholder,
}: SettingsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      
      {type === 'toggle' && (
        <Switch
          value={value as boolean}
          onValueChange={(val) => onValueChange?.(val)}
          trackColor={{ 
            false: theme.colors.surface, 
            true: theme.colors.accent 
          }}
          thumbColor={theme.colors.textPrimary}
        />
      )}
      
      {type === 'input' && (
        <TextInput
          style={styles.input}
          value={value as string}
          onChangeText={(text) => onValueChange?.(text)}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
      )}
      
      {type === 'button' && (
        <TouchableOpacity 
          style={styles.button}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>{buttonTitle}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.glassBackground,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  labelContainer: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.md,
    fontWeight: theme.typography.medium,
    color: theme.colors.textPrimary,
  },
  description: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  input: {
    flex: 0.5,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.sm,
    textAlign: 'right',
  },
  button: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  buttonText: {
    color: theme.colors.accent,
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.medium,
  },
});
