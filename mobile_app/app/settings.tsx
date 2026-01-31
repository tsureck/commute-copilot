import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { SettingsRow, GlassCard } from '../components';
import { useSettings } from '../hooks';

export default function SettingsScreen() {
  const { settings, updateSetting, resetSettings, resetDemoData } = useSettings();
  const [isResetting, setIsResetting] = useState(false);

  const handleResetDemoData = async () => {
    Alert.alert(
      'Reset Demo Data',
      'This will clear all chat messages and local data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetDemoData();
            setIsResetting(false);
            Alert.alert('Done', 'Demo data has been reset.');
          },
        },
      ]
    );
  };

  const handleResetSettings = async () => {
    Alert.alert(
      'Reset Settings',
      'This will restore all settings to their defaults. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            await resetSettings();
            Alert.alert('Done', 'Settings have been reset to defaults.');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Backend Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Backend</Text>
          
          <SettingsRow
            label="Use Mock Backend"
            description="Enable demo mode with simulated data"
            type="toggle"
            value={settings.useMockBackend}
            onValueChange={(value) => updateSetting('useMockBackend', value as boolean)}
          />
          
          <SettingsRow
            label="Base URL"
            description="API endpoint for live mode"
            type="input"
            value={settings.baseUrl}
            onValueChange={(value) => updateSetting('baseUrl', value as string)}
            placeholder="https://api.example.com"
          />
        </View>

        {/* Audio Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Audio</Text>
          
          <SettingsRow
            label="Autoplay Voice"
            description="Automatically play assistant audio"
            type="toggle"
            value={settings.autoplayVoice}
            onValueChange={(value) => updateSetting('autoplayVoice', value as boolean)}
          />
        </View>

        {/* Accessibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accessibility</Text>
          
          <SettingsRow
            label="Reduce Motion"
            description="Minimize animations throughout the app"
            type="toggle"
            value={settings.reduceMotion}
            onValueChange={(value) => updateSetting('reduceMotion', value as boolean)}
          />
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <SettingsRow
            label="Reset Demo Data"
            description="Clear all chat messages and local data"
            type="button"
            buttonTitle="Reset"
            onPress={handleResetDemoData}
          />
          
          <SettingsRow
            label="Reset All Settings"
            description="Restore settings to defaults"
            type="button"
            buttonTitle="Reset"
            onPress={handleResetSettings}
          />
        </View>

        {/* About */}
        <GlassCard style={styles.aboutCard}>
          <View style={styles.aboutContent}>
            <Text style={styles.aboutTitle}>Commute Copilot</Text>
            <Text style={styles.aboutVersion}>Version 1.0.0</Text>
            <Text style={styles.aboutDescription}>
              Your intelligent commute assistant powered by AI.
            </Text>
          </View>
        </GlassCard>

        {/* Mode Status */}
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusDot,
            { backgroundColor: settings.useMockBackend ? theme.colors.warning : theme.colors.success }
          ]} />
          <Text style={styles.statusText}>
            {settings.useMockBackend 
              ? 'Currently in Mock Mode - using simulated data'
              : 'Live Mode - connected to backend'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 100, // Account for header
    paddingBottom: theme.spacing.xxxl,
  },
  section: {
    marginBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    fontSize: theme.typography.sm,
    fontWeight: theme.typography.semibold,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.md,
    marginLeft: theme.spacing.sm,
  },
  aboutCard: {
    marginBottom: theme.spacing.xl,
  },
  aboutContent: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  aboutTitle: {
    fontSize: theme.typography.xl,
    fontWeight: theme.typography.bold,
    color: theme.colors.textPrimary,
  },
  aboutVersion: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  aboutDescription: {
    fontSize: theme.typography.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    lineHeight: 22,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  statusText: {
    fontSize: theme.typography.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    flex: 1,
  },
});
