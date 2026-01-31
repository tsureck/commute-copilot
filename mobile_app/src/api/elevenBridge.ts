/**
 * Eleven Bridge API client for speech-to-text and text-to-speech.
 */

import { ELEVEN_BRIDGE_BASE_URL } from '../config';

// ============================================================================
// Types
// ============================================================================

export interface SpeechToTextRequest {
  decisionId: string;
  audio: string; // Base64 encoded audio (no data URL prefix)
  audioFormat: 'm4a' | 'mp3' | 'wav' | 'webm';
}

export interface SpeechToTextResponse {
  text: string;
}

export interface TextToSpeechRequest {
  decisionId: string;
  text: string;
}

export interface TextToSpeechResponse {
  audio: string; // Base64 encoded MP3
  audioFormat: 'mp3';
}

export interface HealthResponse {
  status: string;
  service: string;
}

export interface ErrorResponse {
  detail: string;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Convert audio to text using Eleven Bridge speech-to-text.
 * 
 * @param decisionId - Unique identifier for the decision context
 * @param audio - Base64-encoded audio data (no data URL prefix)
 * @param audioFormat - Audio format (m4a, mp3, wav, webm)
 * @returns Transcribed text
 * @throws Error if the API call fails
 */
export async function speechToText(
  decisionId: string,
  audio: string,
  audioFormat: 'm4a' | 'mp3' | 'wav' | 'webm'
): Promise<string> {
  const request: SpeechToTextRequest = {
    decisionId,
    audio,
    audioFormat,
  };

  const response = await fetch(`${ELEVEN_BRIDGE_BASE_URL}/speech_to_text/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as ErrorResponse;
    throw new Error(errorData.detail || `Speech-to-text failed: ${response.status}`);
  }

  const data = await response.json() as SpeechToTextResponse;
  return data.text;
}

/**
 * Convert text to speech using Eleven Bridge text-to-speech.
 * 
 * @param decisionId - Unique identifier for the decision context
 * @param text - Text to convert to speech (max 5000 characters)
 * @returns Object containing base64 audio and format
 * @throws Error if the API call fails
 */
export async function textToSpeech(
  decisionId: string,
  text: string
): Promise<TextToSpeechResponse> {
  const request: TextToSpeechRequest = {
    decisionId,
    text,
  };

  const response = await fetch(`${ELEVEN_BRIDGE_BASE_URL}/text_to_speech/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as ErrorResponse;
    throw new Error(errorData.detail || `Text-to-speech failed: ${response.status}`);
  }

  const data = await response.json() as TextToSpeechResponse;
  return data;
}

/**
 * Check the health status of the Eleven Bridge service.
 * 
 * @returns Health status response
 * @throws Error if the service is unavailable
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await fetch(`${ELEVEN_BRIDGE_BASE_URL}/health`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error(`Eleven Bridge health check failed: ${response.status}`);
  }

  return response.json() as Promise<HealthResponse>;
}
