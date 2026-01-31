import { Router, Request, Response } from 'express';
import { supabase } from '../db';
import { triggerN8nWebhook } from '../services/n8n';

const router = Router();

/**
 * POST /decision
 * On-demand decision generation
 * Triggers n8n Workflow B (on-demand webhook)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { route, userContext } = req.body;
    
    // Validate request
    if (!route || !userContext) {
      return res.status(400).json({ 
        error: 'Missing required fields: route, userContext' 
      });
    }

    // Call n8n webhook to generate decision
    const decision = await triggerN8nWebhook('decision', {
      route,
      userContext,
      timeNow: new Date().toISOString()
    });

    res.json(decision);
  } catch (error) {
    console.error('Error generating decision:', error);
    res.status(500).json({ 
      error: 'Failed to generate decision',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /decision/:id
 * Fetch stored decision by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('decisions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Decision not found' });
    }

    // Map database columns to AgentDecision contract
    const decision = {
      id: data.id,
      decision: data.decision,
      confidence: data.confidence,
      currentUpdates: data.current_updates,
      recommendation: data.recommendation,
      explanationShort: data.explanation_short,
      explanationLong: data.explanation_long,
      uiHints: data.ui_hints
    };

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
 * POST /decision/:id/reply
 * User reply with constraints (e.g. "I want to leave 2h later")
 * Triggers n8n Workflow C (user reply webhook)
 */
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userReply = req.body;

    // Validate UserReply structure
    if (!userReply.replyType || !['accept', 'reject', 'modify'].includes(userReply.replyType)) {
      return res.status(400).json({ 
        error: 'Invalid replyType. Must be: accept, reject, or modify' 
      });
    }

    // For accept/reject, just acknowledge
    if (userReply.replyType !== 'modify') {
      return res.status(204).send();
    }

    // For modify, call n8n to generate new decision
    const newDecision = await triggerN8nWebhook('reply', {
      decisionId: id,
      ...userReply
    });

    res.json(newDecision);
  } catch (error) {
    console.error('Error processing reply:', error);
    res.status(500).json({ 
      error: 'Failed to process reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
