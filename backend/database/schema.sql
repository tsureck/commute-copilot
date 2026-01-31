-- Commute Copilot Database Schema
-- For Supabase (PostgreSQL)
-- 
-- Philosophy: Store fetched data once, reason many times
-- - context_snapshots: Raw API data (transport, weather, calendar)
-- - decisions: LLM-generated recommendations linked to snapshots
-- - conversation_messages: User replies with audio

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CONTEXT SNAPSHOTS: Store all fetched API data for LLM reasoning
-- ============================================================================
CREATE TABLE context_snapshots (
  id TEXT PRIMARY KEY,
  session_token TEXT UNIQUE NOT NULL,
  user_id TEXT DEFAULT 'demo_user',
  fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Route info
  route JSONB NOT NULL DEFAULT '{"from": "Hamburg Hbf", "to": "Bremen Hbf", "preferredLine": "RE4"}',
  
  -- Stored API responses (LLM reasons over these)
  transport JSONB NOT NULL, -- connections array with status, delays, remarks
  weather JSONB,            -- hourly forecast, rain prediction
  calendar JSONB,           -- upcoming events, next meeting
  
  -- User preferences at time of snapshot
  user_preferences JSONB DEFAULT '{"homeOfficeAllowed": true, "avoidWaitingOutdoors": true}',
  
  -- Pre-computed analysis
  analysis JSONB, -- hasDisruption, hasCancellation, hasRain, urgency
  
  -- TTL for cleanup
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Index for session token lookup (user reply flow)
CREATE INDEX idx_context_session ON context_snapshots(session_token);
CREATE INDEX idx_context_user_fetched ON context_snapshots(user_id, fetched_at DESC);

-- ============================================================================
-- DECISIONS: LLM-generated recommendations linked to context
-- ============================================================================
CREATE TABLE decisions (
  id TEXT PRIMARY KEY DEFAULT ('dec_' || substr(md5(random()::text), 1, 8)),
  user_id TEXT DEFAULT 'demo_user',
  
  -- Link to context snapshot (for reply reasoning)
  session_token TEXT REFERENCES context_snapshots(session_token),
  snapshot_id TEXT REFERENCES context_snapshots(id),
  
  -- Core decision fields
  decision TEXT NOT NULL CHECK (decision IN (
    'WORK_FROM_HOME_TEMPORARILY',
    'WAIT_AND_LEAVE_LATER',
    'LEAVE_NOW',
    'LEAVE_EARLIER_THAN_USUAL'
  )),
  confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
  
  -- JSON fields matching AgentDecision contract
  current_updates JSONB NOT NULL DEFAULT '[]',
  recommendation JSONB NOT NULL,
  explanation_short TEXT NOT NULL,
  explanation_long TEXT NOT NULL,
  ui_hints JSONB DEFAULT '{"highlightAction": true, "playVoiceSummary": true}',
  
  -- Audio (ElevenLabs generated)
  audio_url TEXT,
  audio_duration_seconds FLOAT,
  
  -- Metadata
  route_from TEXT DEFAULT 'Hamburg Hbf',
  route_to TEXT DEFAULT 'Bremen Hbf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- For debugging: which model/prompt was used
  model_used TEXT DEFAULT 'gemini-1.5-flash',
  prompt_version TEXT DEFAULT 'v1'
);

-- Index for fetching latest decision by user
CREATE INDEX idx_decisions_user_created ON decisions(user_id, created_at DESC);

-- Index for fetching by route
CREATE INDEX idx_decisions_route ON decisions(route_from, route_to, created_at DESC);

-- Index for session token lookup (user reply flow)
CREATE INDEX idx_decisions_session ON decisions(session_token);

-- ============================================================================
-- CONVERSATION MESSAGES: User replies and assistant responses with audio
-- ============================================================================
CREATE TABLE conversation_messages (
  id TEXT PRIMARY KEY DEFAULT ('msg_' || substr(md5(random()::text), 1, 8)),
  session_token TEXT NOT NULL REFERENCES context_snapshots(session_token),
  decision_id TEXT REFERENCES decisions(id),
  
  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  text TEXT NOT NULL,
  
  -- For user messages: parsed intent
  reply_type TEXT CHECK (reply_type IN ('question', 'modify', 'accept', 'reject')),
  modify_constraints JSONB, -- e.g., {"minDepartureDelayMinutes": 120}
  
  -- For assistant messages: audio response
  audio_url TEXT,
  audio_duration_seconds FLOAT,
  
  -- If reply resulted in updated recommendation
  updated_recommendation JSONB,
  new_departure_time TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for conversation retrieval
CREATE INDEX idx_messages_session ON conversation_messages(session_token, created_at);
CREATE INDEX idx_messages_decision ON conversation_messages(decision_id);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================
CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY,
  home_office_allowed BOOLEAN DEFAULT true,
  default_meeting_time TIME DEFAULT '10:30',
  avoid_waiting_outdoors BOOLEAN DEFAULT true,
  preferred_line TEXT DEFAULT 'RE4',
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert demo user preferences
INSERT INTO user_preferences (user_id) VALUES ('demo_user')
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for latest decision per user
CREATE OR REPLACE VIEW latest_decisions AS
SELECT DISTINCT ON (user_id, route_from, route_to)
  *
FROM decisions
ORDER BY user_id, route_from, route_to, created_at DESC;

-- View for active sessions (context + decision + messages)
CREATE OR REPLACE VIEW active_sessions AS
SELECT 
  cs.session_token,
  cs.fetched_at,
  cs.route,
  cs.transport,
  cs.weather,
  cs.calendar,
  cs.analysis,
  d.id as decision_id,
  d.decision,
  d.recommendation,
  d.explanation_short,
  d.audio_url as decision_audio_url,
  d.created_at as decision_created_at,
  (SELECT COUNT(*) FROM conversation_messages cm WHERE cm.session_token = cs.session_token) as message_count
FROM context_snapshots cs
LEFT JOIN decisions d ON d.session_token = cs.session_token
WHERE cs.expires_at > NOW()
ORDER BY cs.fetched_at DESC;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get decision by id (with proper JSON structure)
CREATE OR REPLACE FUNCTION get_decision_by_id(decision_id TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'id', id,
    'decision', decision,
    'confidence', confidence,
    'currentUpdates', current_updates,
    'recommendation', recommendation,
    'explanationShort', explanation_short,
    'explanationLong', explanation_long,
    'uiHints', ui_hints,
    'audioUrl', audio_url,
    'sessionToken', session_token
  )
  INTO result
  FROM decisions
  WHERE id = decision_id;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get full session context (for LLM reasoning)
CREATE OR REPLACE FUNCTION get_session_context(p_session_token TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'snapshot', json_build_object(
      'id', cs.id,
      'fetchedAt', cs.fetched_at,
      'route', cs.route,
      'transport', cs.transport,
      'weather', cs.weather,
      'calendar', cs.calendar,
      'analysis', cs.analysis
    ),
    'decision', CASE WHEN d.id IS NOT NULL THEN json_build_object(
      'id', d.id,
      'decision', d.decision,
      'recommendation', d.recommendation,
      'explanationLong', d.explanation_long,
      'audioUrl', d.audio_url
    ) ELSE NULL END,
    'messages', COALESCE((
      SELECT json_agg(json_build_object(
        'id', cm.id,
        'role', cm.role,
        'text', cm.text,
        'audioUrl', cm.audio_url,
        'createdAt', cm.created_at
      ) ORDER BY cm.created_at)
      FROM conversation_messages cm
      WHERE cm.session_token = p_session_token
    ), '[]'::json)
  )
  INTO result
  FROM context_snapshots cs
  LEFT JOIN decisions d ON d.session_token = cs.session_token
  WHERE cs.session_token = p_session_token;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to compare decisions (detect if decision type changed)
CREATE OR REPLACE FUNCTION has_decision_changed(
  p_user_id TEXT,
  p_route_from TEXT,
  p_route_to TEXT,
  p_new_decision TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  last_decision TEXT;
BEGIN
  SELECT decision INTO last_decision
  FROM decisions
  WHERE user_id = p_user_id
    AND route_from = p_route_from
    AND route_to = p_route_to
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Return true if decision changed or no previous decision exists
  RETURN (last_decision IS NULL OR last_decision != p_new_decision);
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired snapshots
CREATE OR REPLACE FUNCTION cleanup_expired_snapshots()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM context_snapshots
    WHERE expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE context_snapshots IS 'Stores fetched API data (transport, weather, calendar) for LLM reasoning without re-fetching';
COMMENT ON TABLE decisions IS 'LLM-generated commute decisions linked to context snapshots';
COMMENT ON TABLE conversation_messages IS 'User replies and assistant responses in a session, each with optional audio';
COMMENT ON COLUMN context_snapshots.transport IS 'Parsed connections array with status, delays, remarks - LLM reasons over this';
COMMENT ON COLUMN context_snapshots.weather IS 'Hourly weather forecast - LLM can answer "when does rain stop?"';
COMMENT ON COLUMN context_snapshots.calendar IS 'User events - LLM knows meeting constraints';
COMMENT ON COLUMN decisions.audio_url IS 'ElevenLabs-generated MP3 URL for voice explanation';
COMMENT ON COLUMN conversation_messages.audio_url IS 'ElevenLabs-generated MP3 URL for assistant reply';
