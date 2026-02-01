import { AgentDecision, ConversationMessage } from '../types';
import { Asset } from 'expo-asset';

// Local audio files for AI voice
const EXPLANATION_AUDIO = require('../assets/audio/explanation.mp3');
const FOLLOWUP_FIRST_AUDIO = require('../assets/audio/ai_answer_1.mp3');
const FOLLOWUP_SECOND_AUDIO = require('../assets/audio/ai_answer_2.mp3');

// Cache for audio URIs
const audioCache: Record<string, string> = {};

// Track follow-up count for audio selection
let followUpCount = 0;

async function loadAudioAsset(audioModule: any, key: string): Promise<string> {
  if (audioCache[key]) return audioCache[key];
  
  try {
    const asset = Asset.fromModule(audioModule);
    await asset.downloadAsync();
    audioCache[key] = asset.localUri || asset.uri;
    return audioCache[key];
  } catch (e) {
    console.error(`Failed to load audio ${key}:`, e);
    return 'https://www2.cs.uic.edu/~i101/SoundFiles/BaachOrganConcworksound.mp3';
  }
}

export async function getExplanationAudioUri(): Promise<string> {
  return loadAudioAsset(EXPLANATION_AUDIO, 'explanation');
}

export async function getFollowupAudioUri(): Promise<string> {
  followUpCount++;
  if (followUpCount === 1) {
    // First follow-up: use ai_answer_1.mp3
    return loadAudioAsset(FOLLOWUP_FIRST_AUDIO, 'followup_first');
  } else {
    // Second and subsequent follow-ups: use ai_answer_2.mp3
    return loadAudioAsset(FOLLOWUP_SECOND_AUDIO, 'followup_second');
  }
}

// Reset follow-up count (useful for testing)
export function resetFollowUpCount(): void {
  followUpCount = 0;
}

// Mock user transcriptions for the demo conversation flow
const mockUserTranscriptions = [
  "Can I also stay two hours at home and take a later train?",
  "What if the Client Presentation gets moved to the afternoon?",
];

// Get the next user transcription for the demo
export function getNextUserTranscription(): string {
  // Return based on current follow-up count (before increment)
  // First recording (count=0) -> first question
  // Second recording (count=1) -> second question
  // Third+ recording -> second question (fallback)
  const index = Math.min(followUpCount, mockUserTranscriptions.length - 1);
  return mockUserTranscriptions[index];
}

// Simulated delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock decision data matching the backend format
const mockDecision: AgentDecision = {
  id: 'dec_u1_001',
  decision: 'WORK_FROM_HOME_TEMPORARILY',
  confidence: 0.88,
  currentUpdates: [
    {
      type: 'weather',
      icon: 'snow',
      title: 'Weather warning',
      message: 'Freezing rain and black ice warning until 09:00',
      severity: 'high',
    },
    {
      type: 'transport',
      icon: 'train',
      title: 'RE4 status',
      message: 'The RE4 at 07:15 is cancelled due to operational disruption',
      severity: 'high',
      line: 'RE4',
    },
    {
      type: 'calendar',
      icon: 'default',
      title: 'Meeting conflict',
      message: 'Daily Sync at 08:00 (online) — Client Presentation at 10:30 (on-site, Bremen)',
      severity: 'high',
    },
  ],
  recommendation: {
    action: 'Start working from home',
    primaryInstruction: 'Take the RE4 at 08:15',
    recommendedDepartureTime: '08:15',
    icon: 'train',
    reasonShort: 'Your 07:15 is cancelled and you have an on-site meeting at 10:30.',
    reasonLong: 'Your usual RE4 at 07:15 is cancelled. Join the Daily Sync at 08:00 from home, then take the RE4 at 08:15. It arrives at 09:26 in Bremen — well before your Client Presentation at 10:30. Freezing rain and black ice make waiting at the station unsafe.',
  },
  explanationShort: 'RE4 at 07:15 cancelled. Join the 08:00 Daily from home, then take the 08:15 to make your 10:30 on-site meeting.',
  explanationLong: 'Your usual RE4 at 07:15 is cancelled due to operational disruption. Freezing rain and black ice make waiting at the station dangerous. Your Daily Sync at 08:00 is online — join from home. Then take the RE4 at 08:15 which arrives at 09:26, getting you to the Bremen office well before your Client Presentation at 10:30.',
  uiHints: {
    highlightAction: true,
    playVoiceSummary: true,
    confidenceIndicator: 'high',
  },
  audioUrl: '', // Will be populated dynamically by getMockDecision()
  created_at: new Date().toISOString(),
};

// Mock AI responses for the demo conversation flow
const mockResponses = [
  {
    // Response to: "Can I also stay two hours at home and take a later train?"
    text: "Unfortunately not. Your Daily Sync at 08:00 is online, so that's fine from home. But your Client Presentation at 10:30 is on-site in Bremen. The next RE4 after 08:15 is at 09:15, arriving at 10:26 — only 4 minutes before your meeting, way too risky. And the 10:15 arrives at 11:26, far too late. The 08:15 gets you there at 09:26 with plenty of buffer.",
  },
  {
    // Response to: "What if the Client Presentation gets moved to the afternoon?"
    text: "If the Client Presentation moves to the afternoon, you'd have much more flexibility. You could comfortably take the RE4 at 09:15 or even 10:15. But as of now it's still at 10:30 on-site, so I'd stick with the 08:15.",
  },
  {
    // Fallback response for other questions
    text: "Based on current conditions, I'd recommend the RE4 at 08:15. Your Daily Sync at 08:00 is online — join from home. But the Client Presentation at 10:30 is on-site in Bremen, so you need the 08:15 to arrive at 09:26 in time.",
  },
];

/**
 * Get the current decision from the agent
 */
export async function getMockDecision(): Promise<AgentDecision> {
  await delay(600);
  const audioUrl = await getExplanationAudioUri();
  return { 
    ...mockDecision, 
    // Keep stable ID for thread tracking (don't regenerate)
    audioUrl,
    created_at: new Date().toISOString() 
  };
}

/**
 * Get audio URL for a decision explanation
 */
export async function getMockAudioUrl(decisionId: string): Promise<string> {
  await delay(300);
  return getExplanationAudioUri();
}

/**
 * Post a follow-up with user audio and get AI response
 * @param threadId - The conversation/decision thread ID
 * @param userAudioUri - URI to user's recorded audio file
 */
export async function postMockFollowUp(
  threadId: string,
  userAudioUri: string
): Promise<ConversationMessage> {
  await delay(1000);
  
  // Log user audio for backend integration
  console.log('🎤 [Mock API] Thread ID:', threadId);
  console.log('🎤 [Mock API] User audio URI:', userAudioUri);
  
  // Get audio first (this increments followUpCount)
  const audioUrl = await getFollowupAudioUri();
  
  // Pick response based on follow-up count (for demo conversation flow)
  // followUpCount is now 1-indexed after getFollowupAudioUri() call
  // First follow-up (count=1) gets response[0], second (count=2) gets response[1], etc.
  const responseIndex = Math.min(followUpCount - 1, mockResponses.length - 1);
  const responseText = mockResponses[responseIndex].text;
  
  // Generate unique ID for React list rendering (threadId is kept for API context)
  const uniqueId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  
  return {
    id: uniqueId, // Unique ID for React rendering
    role: 'assistant',
    text: responseText,
    audioUrl,
    created_at: new Date().toISOString(),
  };
}

/**
 * Simulate receiving a new decision (for push notification trigger)
 */
export function getLatestDecisionId(): string {
  return mockDecision.id;
}
