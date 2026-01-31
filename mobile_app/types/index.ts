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
  id?: string;
  decision: string;
  confidence: number;
  currentUpdates: CurrentUpdate[];
  recommendation: Recommendation;
  explanationShort: string;
  explanationLong: string;
  uiHints: UIHints;
  audioUrl?: string; // Set after audio API call
  created_at?: string;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string;
  isPlaying?: boolean;
  created_at: string;
}

export interface ChatThread {
  id: string;
  messages: ConversationMessage[];
  created_at: string;
  updated_at: string;
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
