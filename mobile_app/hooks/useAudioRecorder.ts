import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  isProcessing: boolean;
  recordingDuration: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // Request permissions
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        setError('Microphone permission not granted');
        return;
      }

      // Set audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and start recording
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Track duration
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 100);
      }, 100);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start recording');
      setIsRecording(false);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      setIsProcessing(true);
      
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // In mock mode, we simulate STT by returning a placeholder text
      // The structure allows for real STT integration later
      // For now, return a mock transcription after a brief delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock transcription - in real implementation, send `uri` to STT service
      const mockTranscriptions = [
        "What about the weather later?",
        "Should I drive instead?",
        "When does the next train leave?",
        "Tell me more about the traffic",
        "What time should I leave?",
      ];
      
      const randomIndex = Math.floor(Math.random() * mockTranscriptions.length);
      
      setIsProcessing(false);
      return mockTranscriptions[randomIndex];

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to stop recording');
      setIsRecording(false);
      setIsProcessing(false);
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) return;

    try {
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel recording');
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
