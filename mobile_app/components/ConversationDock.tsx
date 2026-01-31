import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';
import { AnimatedWaveform } from './AnimatedWaveform';

interface ConversationDockProps {
  onSendMessage: (text: string) => void;
  onStartRecording: () => void;
  onStopRecording: () => Promise<void>;
  isRecording: boolean;
  isProcessing: boolean;
  isSending: boolean;
  reduceMotion?: boolean;
}

export function ConversationDock({
  onSendMessage,
  onStartRecording,
  onStopRecording,
  isRecording,
  isProcessing,
  isSending,
  reduceMotion = false,
}: ConversationDockProps) {
  const [inputText, setInputText] = useState('');

  const handleSend = () => {
    if (inputText.trim() && !isSending) {
      onSendMessage(inputText.trim());
      setInputText('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleMicPress = async () => {
    if (isRecording) {
      await onStopRecording();
    } else {
      onStartRecording();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        <View style={styles.inputRow}>
          {/* Mic Button */}
          <TouchableOpacity
            style={[
              styles.micButton,
              isRecording && styles.micButtonRecording,
            ]}
            onPress={handleMicPress}
            disabled={isProcessing || isSending}
            activeOpacity={0.7}
          >
            {isProcessing ? (
              <ActivityIndicator color={theme.colors.textPrimary} size="small" />
            ) : isRecording ? (
              <View style={styles.recordingIndicator}>
                <AnimatedWaveform 
                  isPlaying={true} 
                  size="small" 
                  color={theme.colors.textPrimary}
                  reduceMotion={reduceMotion}
                />
              </View>
            ) : (
              <Text style={styles.micIcon}>🎤</Text>
            )}
          </TouchableOpacity>

          {/* Text Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Ask a follow-up…"
              placeholderTextColor={theme.colors.textTertiary}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isRecording && !isProcessing && !isSending}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
            activeOpacity={0.7}
          >
            {isSending ? (
              <ActivityIndicator color={theme.colors.textPrimary} size="small" />
            ) : (
              <Text style={styles.sendIcon}>➤</Text>
            )}
          </TouchableOpacity>
        </View>

        {isRecording && (
          <Text style={styles.recordingHint}>
            Tap mic to stop recording
          </Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.glassBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  micButtonRecording: {
    backgroundColor: theme.colors.error,
  },
  micIcon: {
    fontSize: 20,
  },
  recordingIndicator: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.glassBorder,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.md,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.surface,
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  recordingHint: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
  },
});
