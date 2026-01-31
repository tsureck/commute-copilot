export type UpdateType = 'weather' | 'transport' | 'calendar' | 'traffic';

export type Severity = 'high' | 'medium' | 'low';

export type ConfidenceIndicator = 'high' | 'medium' | 'low';

export interface CurrentUpdate {
  type: UpdateType;
  icon: string;
  title: string;
  message: string;
  severity: Severity;
  line?: string; // For transport updates
}

export interface Recommendation {
  action: string;
  primaryInstruction: string;
  recommendedDepartureTime?: string;
  icon: string;
  reasonShort: string;
  reasonLong: string;
}

export interface UIHints {
  highlightAction: boolean;
  playVoiceSummary: boolean;
  confidenceIndicator: ConfidenceIndicator;
}

export interface AgentDecision {
  id: string; // Thread/conversation ID - persists throughout conversation
  decision: string;
  confidence: number;
  currentUpdates: CurrentUpdate[];
  recommendation: Recommendation;
  explanationShort: string;
  explanationLong: string;
  uiHints: UIHints;
  // Audio can be URL (mock) or base64 (real backend)
  audioUrl?: string;
  audio?: string; // Base64 encoded audio bytes
  audioFormat?: string; // e.g., 'mp3', 'm4a'
  created_at?: string;
}

// Request payload for sending user audio to backend
export interface FollowUpRequest {
  id: string; // Thread/conversation ID
  audio: string; // Base64 encoded audio bytes
  audioFormat: string; // e.g., 'm4a'
}

// Response payload from backend
export interface FollowUpResponse {
  id: string; // Same thread/conversation ID
  role: 'assistant';
  text: string;
  audio: string; // Base64 encoded audio bytes
  audioFormat: string; // e.g., 'mp3'
  created_at: string;
}

export interface ConversationMessage {
  id: string; // Thread ID for context
  role: 'user' | 'assistant';
  text: string;
  // Audio can be URL (mock/local) or base64 (real backend)
  audioUrl?: string;
  audio?: string; // Base64 encoded audio bytes
  audioFormat?: string;
  isPlaying?: boolean;
  created_at: string;
}

export interface ChatThread {
  id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
}

// Result from postFollowUp - includes both user transcription and assistant response
export interface FollowUpResult {
  userTranscription: string; // The transcribed text from user's audio
  assistantMessage: ConversationMessage; // The assistant's response
}

export interface Settings {
  useMockBackend: boolean;
  autoplayVoice: boolean;
  reduceMotion: boolean;
  baseUrl: string;
}

export const DEFAULT_SETTINGS: Settings = {
  useMockBackend: true,
  autoplayVoice: true,
  reduceMotion: false,
  baseUrl: 'https://api.commute-copilot.example.com',
};
