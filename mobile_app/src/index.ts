/**
 * Main exports for the src module.
 */

// Config
export { ELEVEN_BRIDGE_BASE_URL, N8N_BASE_URL, DEFAULT_DECISION_ID } from './config';

// Types
export { type ChatMessage, type LoadingState, type Settings, DEFAULT_SETTINGS } from './types';

// API
export { speechToText, textToSpeech, checkHealth } from './api';
export { sendUserAnswer } from './api';

// Hooks
export { useChatStore } from './chatStore';
export { useAudioRecorder } from './useAudioRecorder';
export { useAudioPlayer } from './useAudioPlayer';

// Audio utilities
export { 
  readAudioAsBase64, 
  saveBase64AudioToFile, 
  getAudioFormat,
  requestAudioPermissions,
  setRecordingMode,
  setPlaybackMode,
} from './audio';
