-- Safe Analytics Setup (Drop + Create)
-- This script safely drops existing tables and creates fresh ones

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS daily_analytics CASCADE;
DROP VIEW IF EXISTS page_funnel_analytics CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_update_session_data ON analytics_events;
DROP FUNCTION IF EXISTS update_session_data() CASCADE;

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS video_analytics CASCADE;
DROP TABLE IF EXISTS page_interactions CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create new analytics tables (fresh start)
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

-- User Sessions Table (Aggregated session data)
CREATE TABLE user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  visitor_id TEXT NOT NULL,
  first_visit_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  total_page_views INTEGER DEFAULT 0,
  unique_sections_viewed INTEGER DEFAULT 0,
  session_duration INTEGER DEFAULT 0, -- in seconds
  is_returning_visitor BOOLEAN DEFAULT FALSE,
  device_type TEXT,
  browser TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Views Table (Section-specific tracking)
CREATE TABLE page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_section TEXT NOT NULL,
  section_position INTEGER, -- scroll depth percentage
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  time_spent INTEGER, -- in seconds
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT
);

-- Page Interactions Table (Detailed interaction tracking)
CREATE TABLE page_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'form_start', 'form_complete'
  element_id TEXT,
  page_section TEXT,
  interaction_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Video Analytics Table (YouTube video tracking)
CREATE TABLE video_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  video_id TEXT,
  play_duration INTEGER, -- seconds watched
  watch_percentage FLOAT, -- 0-100
  event_type TEXT, -- 'play', 'pause', 'end', 'seek'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Users Table (Primary user data storage)
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  selected_plan VARCHAR(50) NOT NULL, -- 'free', 'monthly', 'annual'
  signup_source VARCHAR(100), -- 'hero', 'pricing', etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Form Submissions Table (Conversion tracking)
CREATE TABLE form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  form_type TEXT NOT NULL, -- 'signup', 'contact', 'demo_request'
  form_data JSONB,
  submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
  conversion_value DECIMAL(10,2)
);

-- Create function to update session data
CREATE OR REPLACE FUNCTION update_session_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert session data
  INSERT INTO user_sessions (session_id, visitor_id, last_activity_at, total_page_views)
  VALUES (NEW.session_id, NEW.visitor_id, NEW.timestamp, 1)
  ON CONFLICT (session_id) 
  DO UPDATE SET 
    last_activity_at = NEW.timestamp,
    total_page_views = user_sessions.total_page_views + 1;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update session data
CREATE TRIGGER trigger_update_session_data
  AFTER INSERT ON analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION update_session_data();

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for read/write access (allow all operations for now)
CREATE POLICY "Enable all operations for analytics" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for user_sessions" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for page_views" ON page_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for page_interactions" ON page_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for video_analytics" ON video_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for form_submissions" ON form_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations for users" ON users FOR ALL USING (true) WITH CHECK (true);

-- Create views for dashboard
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  DATE(ae.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') as date,
  COUNT(DISTINCT ae.visitor_id) as unique_visitors,
  COUNT(DISTINCT ae.session_id) as total_sessions,
  COUNT(*) as total_events,
  AVG(us.session_duration) as avg_session_duration,
  COUNT(CASE WHEN ae.event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN ae.event_type = 'conversion' THEN 1 END) as conversions
FROM analytics_events ae
LEFT JOIN user_sessions us ON ae.session_id = us.session_id
GROUP BY DATE(ae.timestamp AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')
ORDER BY date DESC;

CREATE OR REPLACE VIEW page_funnel_analytics AS
SELECT 
  ae.event_data->>'section' as section_name,
  COUNT(DISTINCT ae.session_id) as unique_sessions,
  COUNT(*) as total_views,
  AVG(CAST(ae.event_data->>'time_spent' AS INTEGER)) as avg_time_spent,
  COUNT(CASE WHEN ae.event_type = 'section_exit' THEN 1 END) as exits,
  ROUND(
    (COUNT(CASE WHEN ae.event_type = 'section_exit' THEN 1 END)::NUMERIC / 
     COUNT(*)::NUMERIC) * 100, 2
  ) as exit_rate
FROM analytics_events ae
WHERE ae.event_type IN ('section_view', 'section_exit')
  AND ae.event_data->>'section' IS NOT NULL
GROUP BY ae.event_data->>'section'
ORDER BY total_views DESC;

COMMIT; 