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
 * Send a follow-up with user audio and get AI response
 * @param threadId - The conversation/decision thread ID
 * @param userAudioUri - URI to user's recorded audio file
 */
export async function postFollowUp(
  threadId: string, 
  userAudioUri: string
): Promise<ConversationMessage> {
  if (shouldUseMock()) {
    return postMockFollowUp(threadId, userAudioUri);
  }
  
  // Read audio file as base64
  const base64Audio = await FileSystem.readAsStringAsync(userAudioUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  // Build request payload
  const payload: FollowUpRequest = {
    id: threadId,
    audio: base64Audio,
    audioFormat: 'm4a',
  };
  
  const response = await fetch(`${getBaseUrl()}/agent/followup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to post follow-up: ${response.status}`);
  }
  
  const data: FollowUpResponse = await response.json();
  
  // Convert response to ConversationMessage format
  // Save base64 audio to cache and get local URI
  const audioPath = `${FileSystem.cacheDirectory}response_${Date.now()}.${data.audioFormat}`;
  await FileSystem.writeAsStringAsync(audioPath, data.audio, {
    encoding: FileSystem.EncodingType.Base64,
  });
  
  return {
    id: data.id,
    role: data.role,
    text: data.text,
    audioUrl: audioPath, // Local file URI for playback
    created_at: data.created_at,
  };
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
