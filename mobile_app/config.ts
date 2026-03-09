/**
 * Configuration for external service base URLs.
 * 
 * In development, these point to local services.
 * In production, update these to your deployed service URLs.
 * 
 * NOTE for Android development:
 * - Android Emulator: Use 10.0.2.2 to reach host machine's localhost
 * - Physical Android device: Use your computer's actual IP (e.g., 192.168.x.x)
 * - iOS Simulator: localhost works fine
 */

// Eleven Bridge FastAPI service for speech-to-text and text-to-speech
// Using 10.0.2.2 for Android Emulator - change to your computer's IP for physical device
export const ELEVEN_BRIDGE_BASE_URL = 'http://34.32.87.172';

// API key for Eleven Bridge authentication (X-API-Key header)
// TODO: In production, store this securely (e.g., environment variable, secure storage)
export const ELEVEN_BRIDGE_API_KEY = 'IszZ8PT0gL9QfQUi5tvSG7oSjIIKOWN2';

// n8n workflow backend for assistant responses
export const N8N_BASE_URL = 'https://prothos.app.n8n.cloud/webhook-test';

// Default decision ID for the hackathon demo
export const DEFAULT_DECISION_ID = 'dec_u1_001';
