import { AgentDecision, ConversationMessage, Settings } from '../types';
import { getMockDecision, getMockAudioUrl, postMockFollowUp, getLatestDecisionId as getMockLatestId } from './mock';

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
 */
export async function postFollowUp(userText: string): Promise<ConversationMessage> {
  if (shouldUseMock()) {
    return postMockFollowUp(userText);
  }
  
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

export { getMockDecision, getMockAudioUrl, postMockFollowUp };
