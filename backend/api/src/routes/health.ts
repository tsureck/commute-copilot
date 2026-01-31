import { Router } from 'express';
import { supabase } from '../db';

const router = Router();

router.get('/', async (req, res) => {
  try {
    // Check database connection
    const { error } = await supabase.from('decisions').select('count').limit(1);
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: error ? 'error' : 'connected',
      n8nWebhook: process.env.N8N_WEBHOOK_BASE_URL ? 'configured' : 'not configured'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
