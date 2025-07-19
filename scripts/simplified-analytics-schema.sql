-- Simplified Analytics Schema
-- Only uses analytics_events and users tables
-- All other metrics are derived through views

-- Drop existing views and tables
DROP VIEW IF EXISTS daily_analytics CASCADE;
DROP VIEW IF EXISTS page_funnel_analytics CASCADE;
DROP VIEW IF EXISTS form_submissions_view CASCADE;
DROP VIEW IF EXISTS user_sessions_view CASCADE;
DROP VIEW IF EXISTS conversion_funnel_view CASCADE;

DROP TABLE IF EXISTS form_submissions CASCADE;
DROP TABLE IF EXISTS video_analytics CASCADE;
DROP TABLE IF EXISTS page_interactions CASCADE;
DROP TABLE IF EXISTS page_views CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_update_session_data ON analytics_events;
DROP FUNCTION IF EXISTS update_session_data() CASCADE;

-- Create simplified schema with only 2 tables

-- 1. Analytics Events Table (Main tracking table)
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

-- 2. Users Table (Primary user data storage)
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

-- Create indexes for better query performance
CREATE INDEX idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX idx_analytics_events_visitor_id ON analytics_events(visitor_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for read/write access
CREATE POLICY "Enable insert for all users" ON analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON analytics_events FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable select for authenticated users" ON users FOR SELECT USING (auth.role() = 'authenticated');

-- Create views to derive all other metrics

-- 1. Daily Analytics View
CREATE OR REPLACE VIEW daily_analytics AS
SELECT 
  DATE(ae.timestamp) as date,
  COUNT(DISTINCT ae.visitor_id) as unique_visitors,
  COUNT(DISTINCT ae.session_id) as total_sessions,
  COUNT(*) as total_events,
  COUNT(CASE WHEN ae.event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN ae.event_type IN ('signup_completed', 'form_completed') THEN 1 END) as conversions,
  COUNT(CASE WHEN ae.event_type = 'button_clicked' THEN 1 END) as button_clicks,
  COUNT(CASE WHEN ae.event_type = 'link_clicked' THEN 1 END) as link_clicks
FROM analytics_events ae
GROUP BY DATE(ae.timestamp)
ORDER BY date DESC;

-- 2. User Sessions View (derived from analytics_events)
CREATE OR REPLACE VIEW user_sessions_view AS
SELECT 
  session_id,
  visitor_id,
  MIN(timestamp) as first_visit_at,
  MAX(timestamp) as last_activity_at,
  COUNT(*) as total_events,
  COUNT(CASE WHEN event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN event_type IN ('signup_completed', 'form_completed') THEN 1 END) as conversions,
  COUNT(DISTINCT event_type) as unique_event_types,
  EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) as session_duration_seconds
FROM analytics_events
GROUP BY session_id, visitor_id
ORDER BY last_activity_at DESC;

-- 3. Form Submissions View (derived from analytics_events)
CREATE OR REPLACE VIEW form_submissions_view AS
SELECT 
  id,
  session_id,
  CASE 
    WHEN event_type = 'signup_completed' THEN 'signup'
    WHEN event_type = 'form_completed' THEN COALESCE(event_data->>'form_name', 'contact')
    WHEN event_type = 'form_submit' THEN COALESCE(event_data->>'form_id', 'contact')
    ELSE 'unknown'
  END as form_type,
  event_data as form_data,
  timestamp as submission_timestamp,
  CASE 
    WHEN event_data->>'plan' = 'annual' THEN 30.00
    WHEN event_data->>'plan' = 'monthly' THEN 5.00
    ELSE 0.00
  END as conversion_value
FROM analytics_events
WHERE event_type IN ('signup_completed', 'form_completed', 'form_submit')
ORDER BY timestamp DESC;

-- 4. Page Funnel Analytics View
CREATE OR REPLACE VIEW page_funnel_analytics AS
SELECT 
  COALESCE(ae.event_data->>'section', 'unknown') as section_name,
  COUNT(DISTINCT ae.session_id) as unique_sessions,
  COUNT(*) as total_views,
  AVG(CAST(ae.event_data->>'time_spent' AS INTEGER)) as avg_time_spent,
  COUNT(CASE WHEN ae.event_type = 'section_exit' THEN 1 END) as exits,
  ROUND(
    (COUNT(CASE WHEN ae.event_type = 'section_exit' THEN 1 END)::NUMERIC / 
     NULLIF(COUNT(*), 0)::NUMERIC) * 100, 2
  ) as exit_rate
FROM analytics_events ae
WHERE ae.event_type IN ('section_view', 'section_exit')
  AND ae.event_data->>'section' IS NOT NULL
GROUP BY ae.event_data->>'section'
ORDER BY total_views DESC;

-- 5. Conversion Funnel View
CREATE OR REPLACE VIEW conversion_funnel_view AS
SELECT * FROM (
  SELECT 
    'page_loaded' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'page_view'

  UNION ALL

  SELECT 
    'demo_requested' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'button_clicked' 
    AND event_data->>'button_name' = 'demo_button'

  UNION ALL

  SELECT 
    'plan_selected' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'button_clicked' 
    AND event_data->>'button_name' LIKE '%_plan_button'

  UNION ALL

  SELECT 
    'form_started' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'form_started'

  UNION ALL

  SELECT 
    'form_completed' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'form_completed'

  UNION ALL

  SELECT 
    'signup_completed' as step,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(*) as total_events
  FROM analytics_events
  WHERE event_type = 'signup_completed'
) funnel_data
ORDER BY 
  CASE step
    WHEN 'page_loaded' THEN 1
    WHEN 'demo_requested' THEN 2
    WHEN 'plan_selected' THEN 3
    WHEN 'form_started' THEN 4
    WHEN 'form_completed' THEN 5
    WHEN 'signup_completed' THEN 6
  END;

-- 6. Top Interactions View
CREATE OR REPLACE VIEW top_interactions_view AS
SELECT 
  COALESCE(
    event_data->>'button_name',
    event_data->>'link_text',
    event_data->>'element_type',
    'unknown'
  ) as element_name,
  event_type as interaction_type,
  COUNT(*) as interaction_count
FROM analytics_events
WHERE event_type IN ('button_clicked', 'link_clicked', 'element_hovered')
GROUP BY 
  COALESCE(
    event_data->>'button_name',
    event_data->>'link_text',
    event_data->>'element_type',
    'unknown'
  ),
  event_type
ORDER BY interaction_count DESC;

-- 7. User Analytics View (combines users and events)
CREATE OR REPLACE VIEW user_analytics_view AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.city,
  u.selected_plan,
  u.signup_source,
  u.created_at as signup_date,
  COUNT(DISTINCT ae.session_id) as total_sessions,
  COUNT(ae.id) as total_events,
  COUNT(CASE WHEN ae.event_type = 'page_view' THEN 1 END) as page_views,
  COUNT(CASE WHEN ae.event_type = 'button_clicked' THEN 1 END) as button_clicks,
  COUNT(CASE WHEN ae.event_type = 'link_clicked' THEN 1 END) as link_clicks
FROM users u
LEFT JOIN analytics_events ae ON u.email = ae.event_data->>'email' 
  OR u.id::text = ae.event_data->>'user_id'
GROUP BY u.id, u.name, u.email, u.city, u.selected_plan, u.signup_source, u.created_at
ORDER BY u.created_at DESC;

COMMIT; 