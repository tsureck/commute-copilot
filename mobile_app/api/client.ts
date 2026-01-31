import { AgentDecision, ConversationMessage, Settings, FollowUpRequest, FollowUpResponse } from '../types';
import { getMockDecision, getMockAudioUrl, postMockFollowUp, getLatestDecisionId as getMockLatestId, resetFollowUpCount as resetMockFollowUpCount } from './mock';
import * as FileSystem from 'expo-file-system';

let currentSettings: Settings | null = null;

export function setApiSettings(settings: Settings) {
  currentSettings = settings;
}

function getBaseUrl(): string {
  return currentSettings?.baseUrl || 'https://api.commute-copilot.example.com';
}

function shouldUseMock(): boolean {
  return currentSettings?.useMockBackend ?? true;
}

/**
 * Get the current agent decision
 * NOTE: Always returns mock data - the recommendation screen should always be mocked
 * Only the chat flow uses real backends (ElevenLabs STT → n8n → ElevenLabs TTS)
 */
export async function getDecision(): Promise<AgentDecision> {
  // #region agent log
  console.log('[DEBUG] getDecision called - ALWAYS using mock for recommendation');
  // #endregion
  // Always use mock data for the recommendation/decision screen
  return getMockDecision();
}

/**
 * Get audio URL for decision explanation
 */
export async function getAudioUrl(decisionId: string): Promise<string> {
  if (shouldUseMock()) {
    return getMockAudioUrl(decisionId);
  }
  
  const response = await fetch(`${getBaseUrl()}/agent/audio/${decisionId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch audio: ${response.status}`);
  }
  
  const data = await response.json();
  return data.audioUrl;
}

/**
 * Send a follow-up with user audio and get AI response
 * NOTE: Always returns mock data - the HomeScreen follow-up should always be mocked
 * The real backend flow (ElevenLabs STT → n8n → ElevenLabs TTS) is only in Chat screen
 * @param threadId - The conversation/decision thread ID
 * @param userAudioUri - URI to user's recorded audio file
 */
export async function postFollowUp(
  threadId: string, 
  userAudioUri: string
): Promise<ConversationMessage> {
  // #region agent log
  console.log('[DEBUG] postFollowUp called - ALWAYS using mock for HomeScreen');
  // #endregion
  // Always use mock data for the HomeScreen follow-up conversation
  return postMockFollowUp(threadId, userAudioUri);
}

export function getLatestDecisionId(): string {
  if (shouldUseMock()) {
    return getMockLatestId();
  }
  return 'latest';
}

/**
 * Reset the follow-up counter (call when starting fresh)
 */
export function resetFollowUpCount(): void {
  if (shouldUseMock()) {
    resetMockFollowUpCount();
  }
  // For real backend, no action needed as server tracks state
}

export { getMockDecision, getMockAudioUrl, postMockFollowUp };
