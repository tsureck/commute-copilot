import { AgentDecision, ConversationMessage, Settings, FollowUpRequest, FollowUpResponse, FollowUpResult } from '../types';
import { getMockDecision, getMockAudioUrl, postMockFollowUp, getLatestDecisionId as getMockLatestId, resetFollowUpCount as resetMockFollowUpCount } from './mock';
import * as FileSystem from 'expo-file-system';
import { speechToText, sendUserAnswer, textToSpeech } from '../src/api';
import { ELEVEN_BRIDGE_BASE_URL, N8N_BASE_URL } from '../src/config';

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
 * Uses the real backend flow: ElevenLabs STT → n8n → ElevenLabs TTS
 * Falls back to mock data only if useMockBackend setting is true
 * @param threadId - The conversation/decision thread ID (decisionId)
 * @param userAudioUri - URI to user's recorded audio file
 * @returns FollowUpResult containing user's transcription and assistant's response
 */
export async function postFollowUp(
  threadId: string, 
  userAudioUri: string
): Promise<FollowUpResult> {

  // Check if we should use mock backend
  if (shouldUseMock()) {

    const mockResponse = await postMockFollowUp(threadId, userAudioUri);
    // In mock mode, return a mock transcription too
    return {
      userTranscription: '[Mock transcription]',
      assistantMessage: mockResponse,
    };
  }

  try {
    const audioBase64 = await FileSystem.readAsStringAsync(userAudioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine audio format from URI
    const audioFormat = userAudioUri.toLowerCase().endsWith('.m4a') ? 'm4a' : 
                        userAudioUri.toLowerCase().endsWith('.mp3') ? 'mp3' :
                        userAudioUri.toLowerCase().endsWith('.wav') ? 'wav' : 'm4a';

    const transcribedText = await speechToText(threadId, audioBase64, audioFormat);

    const assistantResponse = await sendUserAnswer(threadId, transcribedText);

    const ttsResponse = await textToSpeech(threadId, assistantResponse.text);

    // Step 5: Save audio to file and return message
    const audioFileName = `assistant_${Date.now()}.mp3`;
    const audioFileUri = `${FileSystem.cacheDirectory}${audioFileName}`;
    await FileSystem.writeAsStringAsync(audioFileUri, ttsResponse.audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return {
      userTranscription: transcribedText,
      assistantMessage: {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        role: 'assistant',
        text: assistantResponse.text,
        audioUrl: audioFileUri,
        created_at: assistantResponse.created_at,
      },
    };
  } catch (error) {

    console.error('[postFollowUp] Error in real backend flow:', error);
    throw error;
  }
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
