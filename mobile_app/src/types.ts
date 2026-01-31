/**
 * Type definitions for the mobile app.
 */

// ============================================================================
// Loading States
// ============================================================================

export type LoadingState = 
  | 'idle'
  | 'recording'
  | 'transcribing'  // Sending to Eleven Bridge STT
  | 'thinking'      // Waiting for n8n response
  | 'generating'    // Getting TTS from Eleven Bridge
  | 'error';

// ============================================================================
// Chat Types
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  // For assistant messages: base64 audio that can be played
  audioBase64?: string;
  audioFormat?: 'mp3';
  created_at: string;
}

// ============================================================================
// Settings
// ============================================================================

export interface Settings {
  autoplayVoice: boolean;
  reduceMotion: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  autoplayVoice: true,
  reduceMotion: false,
};
