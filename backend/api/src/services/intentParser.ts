/**
 * Intent Parser Service
 * Parses user messages to detect intent for commute decisions
 */

export interface ParsedIntent {
  type: 'modify' | 'accept' | 'reject' | 'question' | 'unknown';
  wantsLaterDeparture?: boolean;
  wantsEarlierDeparture?: boolean;
  delayMinutes?: number;
  userMessage: string;
  confidence: number;
}

/**
 * Parse user text to detect intent
 */
export function parseUserIntent(text: string): ParsedIntent {
  const lowerText = text.toLowerCase().trim();
  
  // Check for "stay home longer" / "2 hours" / "later" requests
  const wantsLaterDeparture = detectLaterDepartureIntent(lowerText);
  if (wantsLaterDeparture.detected) {
    return {
      type: 'modify',
      wantsLaterDeparture: true,
      delayMinutes: wantsLaterDeparture.delayMinutes,
      userMessage: text,
      confidence: wantsLaterDeparture.confidence,
    };
  }
  
  // Check for earlier departure request
  const wantsEarlierDeparture = detectEarlierDepartureIntent(lowerText);
  if (wantsEarlierDeparture.detected) {
    return {
      type: 'modify',
      wantsEarlierDeparture: true,
      userMessage: text,
      confidence: wantsEarlierDeparture.confidence,
    };
  }
  
  // Check for acceptance
  if (detectAcceptanceIntent(lowerText)) {
    return {
      type: 'accept',
      userMessage: text,
      confidence: 0.9,
    };
  }
  
  // Check for rejection
  if (detectRejectionIntent(lowerText)) {
    return {
      type: 'reject',
      userMessage: text,
      confidence: 0.8,
    };
  }
  
  // Check if it's a question
  if (detectQuestionIntent(lowerText)) {
    return {
      type: 'question',
      userMessage: text,
      confidence: 0.7,
    };
  }
  
  // Unknown intent - pass through as question
  return {
    type: 'unknown',
    userMessage: text,
    confidence: 0.5,
  };
}

/**
 * Detect if user wants to leave later
 */
function detectLaterDepartureIntent(text: string): { detected: boolean; delayMinutes?: number; confidence: number } {
  // Explicit time requests
  const hourMatch = text.match(/(\d+)\s*(hour|hr|h)/);
  if (hourMatch) {
    const hours = parseInt(hourMatch[1], 10);
    if (hours > 0 && hours <= 8) {
      return { detected: true, delayMinutes: hours * 60, confidence: 0.95 };
    }
  }
  
  const minuteMatch = text.match(/(\d+)\s*(minute|min|m)/);
  if (minuteMatch) {
    const minutes = parseInt(minuteMatch[1], 10);
    if (minutes >= 15 && minutes <= 480) {
      return { detected: true, delayMinutes: minutes, confidence: 0.95 };
    }
  }
  
  // Keyword-based detection
  const laterKeywords = [
    'stay home',
    'work from home',
    'leave later',
    'go later',
    'depart later',
    'more time',
    'not yet',
    'wait',
    'delay',
    'push back',
    'postpone',
    'later train',
    'next train',
  ];
  
  for (const keyword of laterKeywords) {
    if (text.includes(keyword)) {
      // Default to 2 hours if no specific time mentioned
      return { detected: true, delayMinutes: 120, confidence: 0.8 };
    }
  }
  
  // "two hours" spelled out
  if (text.includes('two hour') || text.includes('couple hour') || text.includes('few hour')) {
    return { detected: true, delayMinutes: 120, confidence: 0.9 };
  }
  
  return { detected: false, confidence: 0 };
}

/**
 * Detect if user wants to leave earlier
 */
function detectEarlierDepartureIntent(text: string): { detected: boolean; confidence: number } {
  const earlierKeywords = [
    'leave now',
    'go now',
    'leave earlier',
    'go earlier',
    'depart earlier',
    'sooner',
    'right now',
    'immediately',
    'asap',
  ];
  
  for (const keyword of earlierKeywords) {
    if (text.includes(keyword)) {
      return { detected: true, confidence: 0.85 };
    }
  }
  
  return { detected: false, confidence: 0 };
}

/**
 * Detect acceptance
 */
function detectAcceptanceIntent(text: string): boolean {
  const acceptKeywords = [
    'ok', 'okay', 'sure', 'yes', 'yeah', 'yep', 'yup',
    'sounds good', 'perfect', 'great', 'thanks', 'thank you',
    'got it', 'understood', 'will do', 'alright', 'fine',
    'that works', 'good plan', 'let\'s do', 'agreed',
  ];
  
  return acceptKeywords.some(keyword => text.includes(keyword));
}

/**
 * Detect rejection
 */
function detectRejectionIntent(text: string): boolean {
  const rejectKeywords = [
    'no', 'nope', 'nah', 'don\'t', 'won\'t', 'can\'t',
    'not going', 'cancel', 'forget it', 'never mind',
    'that doesn\'t work', 'bad idea',
  ];
  
  // Only detect rejection if it's clearly negative
  // (avoid false positives like "no problem")
  const positiveExceptions = ['no problem', 'no worries', 'no rush'];
  if (positiveExceptions.some(exc => text.includes(exc))) {
    return false;
  }
  
  return rejectKeywords.some(keyword => text.includes(keyword));
}

/**
 * Detect if it's a question
 */
function detectQuestionIntent(text: string): boolean {
  return text.includes('?') || 
    text.startsWith('what') ||
    text.startsWith('when') ||
    text.startsWith('where') ||
    text.startsWith('how') ||
    text.startsWith('why') ||
    text.startsWith('is ') ||
    text.startsWith('are ') ||
    text.startsWith('will ') ||
    text.startsWith('can ') ||
    text.startsWith('should ');
}
