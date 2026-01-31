import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';

interface UseAudioPlayerReturn {
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  currentTime: number;
  error: string | null;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  seek: (position: number) => Promise<void>;
  load: (url: string, autoplay?: boolean) => Promise<void>;
  unload: () => Promise<void>;
}

export function useAudioPlayer(): UseAudioPlayerReturn {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const soundRef = useRef<Audio.Sound | null>(null);
  const currentUrlRef = useRef<string | null>(null);

  useEffect(() => {
    // Configure audio mode on mount
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });

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
    setDuration(status.durationMillis || 0);
    setCurrentTime(status.positionMillis || 0);
    
    if (status.durationMillis) {
      setProgress(status.positionMillis / status.durationMillis);
    }

    if (status.didJustFinish) {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    }
  }, []);

  const load = useCallback(async (url: string, autoplay = false) => {
    if (currentUrlRef.current === url && soundRef.current) {
      // Already loaded, just play if autoplay
      if (autoplay) {
        // Check if at the end, seek to beginning first
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.positionMillis >= (status.durationMillis || 0) - 100) {
          await soundRef.current.setPositionAsync(0);
        }
        await soundRef.current.playAsync();
      }
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Unload previous sound
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: autoplay },
        onPlaybackStatusUpdate
      );

      soundRef.current = sound;
      currentUrlRef.current = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audio');
    } finally {
      setIsLoading(false);
    }
  }, [onPlaybackStatusUpdate]);

  const play = useCallback(async () => {
    if (soundRef.current) {
      // If at the end, seek to beginning first
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.positionMillis >= (status.durationMillis || 0) - 100) {
        await soundRef.current.setPositionAsync(0);
      }
      await soundRef.current.playAsync();
    }
  }, []);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
    }
  }, []);

  const toggle = useCallback(async () => {
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback(async (position: number) => {
    if (soundRef.current) {
      await soundRef.current.setPositionAsync(position * duration);
    }
  }, [duration]);

  const unload = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      currentUrlRef.current = null;
    }
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  return {
    isPlaying,
    isLoading,
    progress,
    duration,
    currentTime,
    error,
    play,
    pause,
    toggle,
    seek,
    load,
    unload,
  };
}
