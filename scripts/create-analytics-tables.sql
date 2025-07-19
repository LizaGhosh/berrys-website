-- Analytics Events Table (Main tracking table)
CREATE TABLE IF NOT EXISTS analytics_events (
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
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);

-- User Sessions Table (Aggregated session data)
CREATE TABLE IF NOT EXISTS user_sessions (
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
CREATE TABLE IF NOT EXISTS page_views (
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
CREATE TABLE IF NOT EXISTS page_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'click', 'hover', 'scroll', 'form_start', 'form_complete'
  element_id TEXT,
  page_section TEXT,
  interaction_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Video Analytics Table (YouTube video tracking)
CREATE TABLE IF NOT EXISTS video_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  video_id TEXT,
  play_duration INTEGER, -- seconds watched
  watch_percentage FLOAT, -- 0-100
  event_type TEXT, -- 'play', 'pause', 'end', 'seek'
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Form Submissions Table (Conversion tracking)
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  form_type TEXT NOT NULL, -- 'signup', 'contact', 'demo_request'
  form_data JSONB,
  submission_timestamp TIMESTAMPTZ DEFAULT NOW(),
  conversion_value DECIMAL(10,2)
);

-- Daily Analytics View (Aggregated daily metrics)
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  DATE(timestamp) as date,
  COUNT(DISTINCT visitor_id) as unique_visitors,
  COUNT(DISTINCT session_id) as total_sessions,
  COUNT(*) as total_events,
  AVG(session_duration) as avg_session_duration,
  COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN event_type = 'conversion' THEN 1 END) as conversions
FROM analytics_events
LEFT JOIN user_sessions ON analytics_events.session_id = user_sessions.session_id
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Page Funnel Analytics View (Section performance)
CREATE OR REPLACE VIEW page_funnel_analytics AS
SELECT 
  event_data->>'section' as section_name,
  COUNT(DISTINCT session_id) as unique_sessions,
  COUNT(*) as total_views,
  AVG(CAST(event_data->>'time_spent' AS INTEGER)) as avg_time_spent,
  COUNT(CASE WHEN event_type = 'section_exit' THEN 1 END) as exits,
  ROUND(
    (COUNT(CASE WHEN event_type = 'section_exit' THEN 1 END)::FLOAT / 
     COUNT(*)::FLOAT) * 100, 2
  ) as exit_rate
FROM analytics_events
WHERE event_type IN ('section_view', 'section_exit')
  AND event_data->>'section' IS NOT NULL
GROUP BY event_data->>'section'
ORDER BY total_views DESC;

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

-- Create policies for read/write access
CREATE POLICY "Enable insert for all users" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON user_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON user_sessions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON page_views FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON page_views FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON page_interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON page_interactions FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON video_analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON video_analytics FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON form_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON form_submissions FOR SELECT USING (auth.role() = 'authenticated'); 