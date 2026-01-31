/**
 * Configuration for external service base URLs.
 * 
 * In development, these point to local services.
 * In production, update these to your deployed service URLs.
 */

// Eleven Bridge FastAPI service for speech-to-text and text-to-speech
export const ELEVEN_BRIDGE_BASE_URL = 'http://localhost:8000';

// n8n workflow backend for assistant responses
export const N8N_BASE_URL = 'http://localhost:5678/webhook';

// Default decision ID for the hackathon demo
export const DEFAULT_DECISION_ID = 'dec_u1_001';
