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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:getDecision',message:'getDecision called - ALWAYS using mock (correct behavior)',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:entry',message:'postFollowUp called',data:{threadId,userAudioUri,useMock:shouldUseMock(),elevenBridgeUrl:ELEVEN_BRIDGE_BASE_URL,n8nUrl:N8N_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1-H2'})}).catch(()=>{});
  // #endregion
  
  // Check if we should use mock backend
  if (shouldUseMock()) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:mock',message:'Using MOCK backend (useMockBackend=true)',data:{threadId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
    // #endregion
    const mockResponse = await postMockFollowUp(threadId, userAudioUri);
    // In mock mode, return a mock transcription too
    return {
      userTranscription: '[Mock transcription]',
      assistantMessage: mockResponse,
    };
  }
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:real',message:'Using REAL backend flow',data:{threadId},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  try {
    // Step 1: Convert audio file to base64
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step1',message:'Reading audio file as base64',data:{userAudioUri},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    const audioBase64 = await FileSystem.readAsStringAsync(userAudioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // Determine audio format from URI
    const audioFormat = userAudioUri.toLowerCase().endsWith('.m4a') ? 'm4a' : 
                        userAudioUri.toLowerCase().endsWith('.mp3') ? 'mp3' :
                        userAudioUri.toLowerCase().endsWith('.wav') ? 'wav' : 'm4a';
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step1-done',message:'Audio file read successfully',data:{audioFormat,base64Length:audioBase64.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion
    
    // Step 2: Send to ElevenLabs for speech-to-text
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step2',message:'Calling ElevenLabs speechToText',data:{decisionId:threadId,audioFormat,elevenBridgeUrl:ELEVEN_BRIDGE_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-H5'})}).catch(()=>{});
    // #endregion
    const transcribedText = await speechToText(threadId, audioBase64, audioFormat);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step2-done',message:'ElevenLabs STT completed',data:{transcribedText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    // Step 3: Send transcribed text to n8n for assistant response
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step3',message:'Calling n8n sendUserAnswer',data:{decisionId:threadId,text:transcribedText,n8nUrl:N8N_BASE_URL},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-H5'})}).catch(()=>{});
    // #endregion
    const assistantResponse = await sendUserAnswer(threadId, transcribedText);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step3-done',message:'n8n response received',data:{responseId:assistantResponse.id,responseText:assistantResponse.text},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    // Step 4: Convert assistant text to speech
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step4',message:'Calling ElevenLabs textToSpeech',data:{decisionId:threadId,text:assistantResponse.text},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2-H5'})}).catch(()=>{});
    // #endregion
    const ttsResponse = await textToSpeech(threadId, assistantResponse.text);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:step4-done',message:'ElevenLabs TTS completed',data:{audioFormat:ttsResponse.audioFormat,audioLength:ttsResponse.audio.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    // Step 5: Save audio to file and return message
    const audioFileName = `assistant_${Date.now()}.mp3`;
    const audioFileUri = `${FileSystem.cacheDirectory}${audioFileName}`;
    await FileSystem.writeAsStringAsync(audioFileUri, ttsResponse.audio, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:complete',message:'Full flow completed successfully',data:{audioFileUri,responseText:assistantResponse.text,userTranscription:transcribedText},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    
    return {
      userTranscription: transcribedText,
      assistantMessage: {
        id: assistantResponse.id,
        role: 'assistant',
        text: assistantResponse.text,
        audioUrl: audioFileUri,
        created_at: assistantResponse.created_at,
      },
    };
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/59bd3cce-388d-48b5-b4f5-0d4b9a6b6bf4',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'client.ts:postFollowUp:error',message:'Error in real backend flow',data:{error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H5'})}).catch(()=>{});
    // #endregion
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
