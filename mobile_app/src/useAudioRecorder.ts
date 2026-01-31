/**
 * Audio recorder hook for capturing user voice input.
 */

import { useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { 
  readAudioAsBase64, 
  getAudioFormat, 
  requestAudioPermissions,
  setRecordingMode,
  setPlaybackMode,
} from './audio';

interface RecordingResult {
  audioUri: string;
  audioBase64: string;
  audioFormat: 'm4a' | 'mp3' | 'wav' | 'webm';
}

interface UseAudioRecorderReturn {
  isRecording: boolean;
  recordingDuration: number;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<RecordingResult | null>;
  cancelRecording: () => Promise<void>;
}

/**
 * Hook for recording audio from the device microphone.
 * Returns the recorded audio as both a local URI and base64 data.
 */
export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      
      // Request permissions
      const granted = await requestAudioPermissions();
      if (!granted) {
        setError('Microphone permission not granted');
        return false;
      }

      // Set audio mode for recording
      await setRecordingMode();

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

      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      setIsRecording(false);
      return false;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingResult | null> => {
    if (!recordingRef.current) {
      return null;
    }

    try {
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // Stop recording
      await recordingRef.current.stopAndUnloadAsync();
      
      // Reset audio mode for playback
      await setPlaybackMode();

      const audioUri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (!audioUri) {
        setError('No audio recorded');
        return null;
      }

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Read audio as base64
      const audioBase64 = await readAudioAsBase64(audioUri);
      const audioFormat = getAudioFormat(audioUri);

      return {
        audioUri,
        audioBase64,
        audioFormat,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      setIsRecording(false);
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    if (!recordingRef.current) {
      return;
    }

    try {
      // Clear duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      await recordingRef.current.stopAndUnloadAsync();
      
      // Reset audio mode
      await setPlaybackMode();

      recordingRef.current = null;
      setIsRecording(false);
      setRecordingDuration(0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel recording';
      setError(message);
    }
  }, []);

  return {
    isRecording,
    recordingDuration,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}
