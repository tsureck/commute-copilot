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
  "Can I stay longer in home office and take the 09:00 train instead?",
  "How long can I push it if delays calm down?",
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
      icon: 'rain',
      title: 'Weather update',
      message: 'Heavy rain for the next 30 minutes',
      severity: 'medium',
    },
    {
      type: 'transport',
      icon: 'train',
      title: 'RE4 status',
      message: 'The RE4 is cancelled at 07:34 and delayed by 12 minutes at 08:06',
      severity: 'high',
      line: 'RE4',
    },
  ],
  recommendation: {
    action: 'Start working from home',
    primaryInstruction: 'Take the RE4 at 08:34',
    recommendedDepartureTime: '08:34',
    icon: 'train',
    reasonShort: 'Earlier connections are cancelled or delayed.',
    reasonLong: 'Leaving now would cause waiting time with uncertain arrival. Starting in home office and taking the stable RE4 at 08:34 ensures a reliable commute and arrival before your 10:30 meeting.',
  },
  explanationShort: 'RE4 cancelled. Work from home and take the stable 08:34 connection.',
  explanationLong: 'Your usual RE4 at 07:34 is cancelled and the following RE4 is delayed. Weather conditions also make waiting unpleasant. Starting in home office and leaving at 08:34 avoids stress and still gets you to Bremen well before your first meeting.',
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
    // Response to: "Can I stay longer in home office and take the 09:00 train instead?"
    text: "You can, but it's a gamble. The safe move is to leave a bit early and take the RE4 at 08:34.",
  },
  {
    // Response to: "How long can I push it if delays calm down?"
    text: "It doesn't look like the delays are calming down. For now, stick with the RE4 at 8:34 to keep it reliable and stress-free for the 10:30 meeting.",
  },
  {
    // Fallback response for other questions
    text: "Based on current conditions, I recommend sticking with the RE4 at 08:34. It's the most reliable option to ensure you arrive stress-free before your 10:30 meeting.",
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
