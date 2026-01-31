import { AgentDecision, ConversationMessage, Settings } from '../types';
import { getMockDecision, getMockAudioUrl, postMockFollowUp, getLatestDecisionId as getMockLatestId, resetFollowUpCount as resetMockFollowUpCount } from './mock';

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
 */
export async function getDecision(): Promise<AgentDecision> {
  if (shouldUseMock()) {
    return getMockDecision();
  }
  
  const response = await fetch(`${getBaseUrl()}/agent/decision`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch decision: ${response.status}`);
  }
  
  return response.json();
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
 * Send a follow-up message and get AI response with audio
 * @param userText - Transcribed text from user
 * @param userAudioUri - Optional URI to user's recorded audio file
 */
export async function postFollowUp(
  userText: string, 
  userAudioUri?: string
): Promise<ConversationMessage> {
  if (shouldUseMock()) {
    return postMockFollowUp(userText, userAudioUri);
  }
  
  // For real backend: send audio as multipart form data
  if (userAudioUri) {
    const formData = new FormData();
    formData.append('text', userText);
    formData.append('audio', {
      uri: userAudioUri,
      type: 'audio/m4a',
      name: 'recording.m4a',
    } as any);
    
    const response = await fetch(`${getBaseUrl()}/agent/followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Failed to post follow-up: ${response.status}`);
    }
    
    return response.json();
  }
  
  // Text-only request
  const response = await fetch(`${getBaseUrl()}/agent/followup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: userText,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to post follow-up: ${response.status}`);
  }
  
  return response.json();
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
