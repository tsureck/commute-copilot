import { Router, Request, Response } from 'express';
import { parseUserIntent } from '../services/intentParser';
import { getMockDecision, getMockDecisionLater, generateConversationResponse } from '../services/mockData';

const router = Router();

// Track state for demo (in production, this would be per-user in DB)
let currentDecisionId: string | null = null;
let userRequestedLaterDeparture = false;

/**
 * GET /agent/decision
 * Fetch the current decision (for frontend)
 */
router.get('/decision', async (req: Request, res: Response) => {
  try {
    const isDemoMode = process.env.DEMO_MODE === 'true';
    
    if (isDemoMode) {
      // Return mock decision based on current state
      const decision = userRequestedLaterDeparture 
        ? getMockDecisionLater() 
        : getMockDecision();
      currentDecisionId = decision.id;
      return res.json(decision);
    }

    // In live mode, this would call n8n webhook
    // For now, return mock data
    const decision = getMockDecision();
    currentDecisionId = decision.id;
    res.json(decision);
  } catch (error) {
    console.error('Error fetching decision:', error);
    res.status(500).json({ 
      error: 'Failed to fetch decision',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /agent/audio/:id
 * Get audio URL for TTS (mock returns sample audio)
 */
router.get('/audio/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // In production, this would call ElevenLabs API
    // For demo, return a sample audio URL
    const audioUrl = 'https://www2.cs.uic.edu/~i101/SoundFiles/BaachOrganConcworksound.mp3';
    
    res.json({ 
      decisionId: id,
      audioUrl 
    });
  } catch (error) {
    console.error('Error fetching audio:', error);
    res.status(500).json({ 
      error: 'Failed to fetch audio',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /agent/followup
 * Handle user follow-up messages (text or voice transcription)
 * Returns ConversationMessage with AI response
 */
router.post('/followup', async (req: Request, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    // Parse user intent from text
    const intent = parseUserIntent(text);
    
    // Handle different intents
    if (intent.type === 'modify' && intent.wantsLaterDeparture) {
      userRequestedLaterDeparture = true;
    } else if (intent.type === 'accept') {
      // User accepted the recommendation
      console.log('User accepted recommendation');
    } else if (intent.type === 'reject') {
      // User rejected - would need more info in production
      console.log('User rejected recommendation');
    }

    // Generate response based on intent
    const response = generateConversationResponse(intent, userRequestedLaterDeparture);
    
    res.json(response);
  } catch (error) {
    console.error('Error processing follow-up:', error);
    res.status(500).json({ 
      error: 'Failed to process follow-up',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /agent/reset
 * Reset demo state (for testing)
 */
router.post('/reset', async (req: Request, res: Response) => {
  userRequestedLaterDeparture = false;
  currentDecisionId = null;
  res.json({ message: 'Demo state reset', userRequestedLaterDeparture, currentDecisionId });
});

export default router;
