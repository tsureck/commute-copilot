import { AgentDecision, ConversationMessage } from '../types';
import { generateId } from '../utils';
import { Asset } from 'expo-asset';

// Local audio files for AI voice
const EXPLANATION_AUDIO = require('../assets/audio/explanation.mp3');
const FOLLOWUP_FIRST_AUDIO = require('../assets/audio/stay_the_f_inside.mp3');
const FOLLOWUP_SUBSEQUENT_AUDIO = require('../assets/audio/stay_inside_2.mp3');

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
    // First follow-up: use stay_the_f_inside.mp3
    return loadAudioAsset(FOLLOWUP_FIRST_AUDIO, 'followup_first');
  } else {
    // Subsequent follow-ups: use stay_inside_2.mp3
    return loadAudioAsset(FOLLOWUP_SUBSEQUENT_AUDIO, 'followup_subsequent');
  }
}

// Reset follow-up count (useful for testing)
export function resetFollowUpCount(): void {
  followUpCount = 0;
}

// Simulated delay helper
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock decision data matching the backend format
const mockDecision: AgentDecision = {
  id: 'decision-001',
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

// Mock AI responses for follow-up questions
const mockResponses = [
  {
    text: "The RE4 at 08:34 is currently showing as stable with no delays. Based on the current train data, you should arrive at Bremen Hauptbahnhof by 09:45, giving you plenty of time before your 10:30 meeting.",
  },
  {
    text: "The rain is expected to clear up around 08:15. If you leave at 08:20, you should have dry conditions for your walk to the station. I'd still recommend an umbrella just in case.",
  },
  {
    text: "Looking at the alternative routes: The S-Bahn is running normally but would add 15 minutes to your journey. Driving is possible but there's moderate traffic on the A1. The RE4 at 08:34 remains your best option.",
  },
  {
    text: "Your 10:30 meeting is with the product team. Based on your calendar, you have no conflicts until 12:00. Even with a slight delay, you should be comfortable for the meeting.",
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
    id: generateId(), 
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
 * Post a follow-up message and get AI response
 */
export async function postMockFollowUp(
  userText: string,
  userAudioUri?: string
): Promise<ConversationMessage> {
  await delay(1000);
  
  // Log user audio for backend integration (single log point)
  if (userAudioUri) {
    console.log('🎤 [API] User audio URI:', userAudioUri);
  }
  
  // Pick contextual response
  let responseText = mockResponses[0].text;
  const lowerText = userText.toLowerCase();
  
  if (lowerText.includes('rain') || lowerText.includes('weather')) {
    responseText = mockResponses[1].text;
  } else if (lowerText.includes('alternative') || lowerText.includes('other') || lowerText.includes('drive')) {
    responseText = mockResponses[2].text;
  } else if (lowerText.includes('meeting') || lowerText.includes('calendar')) {
    responseText = mockResponses[3].text;
  }
  
  const audioUrl = await getFollowupAudioUri();
  
  return {
    id: generateId(),
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
  return mockDecision.id || 'decision-001';
}
