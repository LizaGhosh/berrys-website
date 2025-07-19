-- Create only the analytics_events table
-- This is step 1 of the simplified schema

-- Drop existing table if it exists
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Create analytics_events table
CREATE TABLE analytics_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_agent TEXT,
  url TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Create policies for read/write access
CREATE POLICY "Enable insert for all users" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');

COMMIT; 