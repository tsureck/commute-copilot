/**
 * Mock Data Service
 * Provides mock decisions and responses for demo mode
 */

import { ParsedIntent } from './intentParser';

// Sample audio URL for AI voice
const AI_AUDIO_URL = 'https://www2.cs.uic.edu/~i101/SoundFiles/BaachOrganConcworksound.mp3';

// Generate unique IDs
function generateId(): string {
  return `decision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * AgentDecision type (mirrors contracts.ts)
 */
export interface AgentDecision {
  id: string;
  decision: string;
  confidence: number;
  currentUpdates: Array<{
    type: string;
    icon: string;
    title: string;
    message: string;
    severity: string;
    line?: string;
  }>;
  recommendation: {
    action: string;
    primaryInstruction: string;
    recommendedDepartureTime: string;
    icon: string;
    reasonShort: string;
    reasonLong: string;
  };
  explanationShort: string;
  explanationLong: string;
  uiHints: {
    highlightAction: boolean;
    playVoiceSummary: boolean;
    confidenceIndicator: string;
  };
  audioUrl: string;
  created_at: string;
}

export interface ConversationMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  audioUrl?: string;
  created_at: string;
}

/**
 * Get mock decision for Use Case 1 (initial state)
 */
export function getMockDecision(): AgentDecision {
  return {
    id: generateId(),
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
    audioUrl: AI_AUDIO_URL,
    created_at: new Date().toISOString(),
  };
}

/**
 * Get mock decision for "2 hours later" variant
 */
export function getMockDecisionLater(): AgentDecision {
  return {
    id: generateId(),
    decision: 'WORK_FROM_HOME_TEMPORARILY',
    confidence: 0.92,
    currentUpdates: [
      {
        type: 'weather',
        icon: 'sun',
        title: 'Weather update',
        message: 'Rain clearing up, sunny by 10:00',
        severity: 'low',
      },
      {
        type: 'transport',
        icon: 'train',
        title: 'RE4 status',
        message: 'RE4 at 10:34 running on time',
        severity: 'low',
        line: 'RE4',
      },
    ],
    recommendation: {
      action: 'Continue working from home',
      primaryInstruction: 'Take the RE4 at 10:34',
      recommendedDepartureTime: '10:34',
      icon: 'train',
      reasonShort: 'You requested 2 more hours at home.',
      reasonLong: "I've adjusted your departure to give you 2 more hours at home. The RE4 at 10:34 is running on time. You'll arrive at Bremen Hbf by 11:49, giving you time before lunch.",
    },
    explanationShort: 'Updated: Take RE4 at 10:34 for 2 more hours at home.',
    explanationLong: "Got it! I've updated your recommendation. You can now work from home until 10:00 and take the RE4 at 10:34. This gives you 2 more hours at home while still arriving comfortably before lunch. The weather will also be nicer by then.",
    uiHints: {
      highlightAction: true,
      playVoiceSummary: true,
      confidenceIndicator: 'high',
    },
    audioUrl: AI_AUDIO_URL,
    created_at: new Date().toISOString(),
  };
}

/**
 * Generate conversation response based on parsed intent
 */
export function generateConversationResponse(
  intent: ParsedIntent,
  userRequestedLaterDeparture: boolean
): ConversationMessage {
  let text: string;

  switch (intent.type) {
    case 'modify':
      if (intent.wantsLaterDeparture) {
        text = "Got it! I've updated your recommendation. You can now work from home until 10:00 and take the RE4 at 10:34. This gives you 2 more hours at home while still arriving comfortably before lunch. The weather will also be nicer by then.";
      } else if (intent.wantsEarlierDeparture) {
        text = "Understood. If you want to leave now, the S-Bahn is running normally and would get you to Bremen in about an hour. Otherwise, the RE4 at 08:34 remains the recommended option.";
      } else {
        text = "I'll adjust your commute plan based on your preferences. Let me find the best options for you.";
      }
      break;

    case 'accept':
      if (userRequestedLaterDeparture) {
        text = "Perfect! I'll keep monitoring the trains and notify you if anything changes. Have a productive morning at home!";
      } else {
        text = "Great! I'll send you a reminder 15 minutes before you need to leave for the 08:34 RE4. Have a good day!";
      }
      break;

    case 'reject':
      text = "I understand this doesn't work for you. Could you tell me what you'd prefer instead? For example, 'I want to leave earlier' or 'I need to stay home longer'.";
      break;

    case 'question':
      // For questions, provide contextual info based on keywords
      const lowerText = intent.userMessage.toLowerCase();
      if (lowerText.includes('rain') || lowerText.includes('weather')) {
        text = "The rain is expected to clear up around 08:15. If you leave at 08:20, you should have dry conditions for your walk to the station. I'd still recommend an umbrella just in case.";
      } else if (lowerText.includes('alternative') || lowerText.includes('other') || lowerText.includes('drive')) {
        text = "Looking at the alternative routes: The S-Bahn is running normally but would add 15 minutes to your journey. Driving is possible but there's moderate traffic on the A1. The RE4 at 08:34 remains your best option.";
      } else if (lowerText.includes('meeting') || lowerText.includes('calendar')) {
        text = "Your 10:30 meeting is with the product team. Based on your calendar, you have no conflicts until 12:00. Even with a slight delay, you should be comfortable for the meeting.";
      } else {
        text = "The RE4 at 08:34 is currently showing as stable with no delays. Based on the current train data, you should arrive at Bremen Hauptbahnhof by 09:45, giving you plenty of time before your 10:30 meeting.";
      }
      break;

    default:
      text = "I'm not sure I understood that. Could you rephrase? For example, you can ask about alternatives, request to leave later, or accept the current recommendation.";
  }

  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    text,
    audioUrl: AI_AUDIO_URL,
    created_at: new Date().toISOString(),
  };
}
