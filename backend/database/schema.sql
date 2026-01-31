-- Commute Copilot Database Schema
-- For Supabase (PostgreSQL)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Decisions table: stores all generated commute decisions
CREATE TABLE decisions (
  id TEXT PRIMARY KEY DEFAULT ('dec_' || substr(md5(random()::text), 1, 8)),
  user_id TEXT DEFAULT 'demo_user', -- For multi-user support later
  
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
  
  -- Metadata
  route_from TEXT DEFAULT 'Hamburg Hbf',
  route_to TEXT DEFAULT 'Bremen Hbf',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Optional: store raw agent_info for debugging/replay
  agent_info_snapshot JSONB
);

-- Index for fetching latest decision by user
CREATE INDEX idx_decisions_user_created ON decisions(user_id, created_at DESC);

-- Index for fetching by route
CREATE INDEX idx_decisions_route ON decisions(route_from, route_to, created_at DESC);

-- User preferences table (optional, for future)
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

-- View for latest decision per user
CREATE OR REPLACE VIEW latest_decisions AS
SELECT DISTINCT ON (user_id, route_from, route_to)
  *
FROM decisions
ORDER BY user_id, route_from, route_to, created_at DESC;

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
    'uiHints', ui_hints
  )
  INTO result
  FROM decisions
  WHERE id = decision_id;
  
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

-- Comments for documentation
COMMENT ON TABLE decisions IS 'Stores all generated commute decisions from the Gemini agent';
COMMENT ON COLUMN decisions.current_updates IS 'Array of CurrentUpdate objects (weather, transport status)';
COMMENT ON COLUMN decisions.recommendation IS 'Recommendation object with action, primaryInstruction, recommendedDepartureTime, etc.';
COMMENT ON COLUMN decisions.agent_info_snapshot IS 'Optional: raw AgentInfo that was used to generate this decision (for debugging)';
