/**
 * API module exports.
 * 
 * This module provides the complete API interface for the new communication flow:
 * 1. speechToText - Send audio to Eleven Bridge for transcription
 * 2. sendUserAnswer - Send transcribed text to n8n backend
 * 3. textToSpeech - Get audio from Eleven Bridge for assistant response
 */

export {
  speechToText,
  textToSpeech,
  checkHealth,
  type SpeechToTextRequest,
  type SpeechToTextResponse,
  type TextToSpeechRequest,
  type TextToSpeechResponse,
  type HealthResponse,
} from './elevenBridge';

export {
  sendUserAnswer,
  type UserAnswerRequest,
  type AssistantResponse,
} from './n8n';
