/**
 * Audio player hook for playing assistant voice responses.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { saveBase64AudioToFile, setPlaybackMode } from './audio';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  playFromBase64: (base64Audio: string, format?: string) => Promise<void>;
  playFromUri: (uri: string) => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Hook for playing audio from base64 data or file URIs.
 */
export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);

  // Configure audio mode on mount
  useEffect(() => {
    setPlaybackMode();

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const onPlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setError(status.error);
      }
      return;
    }

    setIsPlaying(status.isPlaying);

    if (status.didJustFinish) {
      setIsPlaying(false);
    }
  }, []);

  const stop = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playFromUri = useCallback(async (uri: string) => {
    setError(null);
    setIsLoading(true);

    try {
      // Stop any currently playing audio
      await stop();

      // Ensure playback mode
      await setPlaybackMode();

      // Load and play
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play audio';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [stop, onPlaybackStatusUpdate]);

  const playFromBase64 = useCallback(async (base64Audio: string, format: string = 'mp3') => {
    setError(null);
    setIsLoading(true);

    try {
      // Save base64 to file
      const uri = await saveBase64AudioToFile(base64Audio, format);
      
      // Play from the saved file
      await playFromUri(uri);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to play audio';
      setError(message);
      setIsLoading(false);
    }
  }, [playFromUri]);

  return {
    isPlaying,
    isLoading,
    error,
    playFromBase64,
    playFromUri,
    stop,
  };
}
