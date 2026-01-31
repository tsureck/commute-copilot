/**
 * Audio utilities for recording and playback.
 */

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

/**
 * Read an audio file and return its base64 content.
 * 
 * @param uri - Local file URI of the audio file
 * @returns Base64 encoded audio data (no prefix)
 */
export async function readAudioAsBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  return base64;
}

/**
 * Save base64 audio data to a local file and return the URI.
 * 
 * @param base64Audio - Base64 encoded audio data
 * @param format - Audio format (default: mp3)
 * @returns Local file URI for playback
 */
export async function saveBase64AudioToFile(
  base64Audio: string,
  format: string = 'mp3'
): Promise<string> {
  const filename = `response_${Date.now()}.${format}`;
  const uri = `${FileSystem.cacheDirectory}${filename}`;
  
  await FileSystem.writeAsStringAsync(uri, base64Audio, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return uri;
}

/**
 * Get the audio format from a file URI.
 * Defaults to 'm4a' which is what expo-av records on iOS.
 * 
 * @param uri - File URI
 * @returns Audio format string
 */
export function getAudioFormat(uri: string): 'm4a' | 'mp3' | 'wav' | 'webm' {
  const extension = uri.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'mp3':
      return 'mp3';
    case 'wav':
      return 'wav';
    case 'webm':
      return 'webm';
    case 'm4a':
    default:
      return 'm4a';
  }
}

/**
 * Request audio recording permissions.
 * 
 * @returns Whether permission was granted
 */
export async function requestAudioPermissions(): Promise<boolean> {
  const { granted } = await Audio.requestPermissionsAsync();
  return granted;
}

/**
 * Configure audio mode for recording.
 */
export async function setRecordingMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: true,
    playsInSilentModeIOS: true,
  });
}

/**
 * Configure audio mode for playback (after recording).
 */
export async function setPlaybackMode(): Promise<void> {
  await Audio.setAudioModeAsync({
    allowsRecordingIOS: false,
    playsInSilentModeIOS: true,
    staysActiveInBackground: false,
  });
}
