-- NUCLEAR RESET: Completely wipe and recreate all analytics tables
-- ⚠️ WARNING: This will permanently delete ALL data!
-- ⚠️ Only run this if you're absolutely sure!

-- =============================================================================
-- 1. DROP ALL EXISTING TABLES & POLICIES
-- =============================================================================

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE; 
DROP TABLE IF EXISTS users CASCADE;

-- Drop any existing policies (in case they persist)
DROP POLICY IF EXISTS "Allow all operations for service role" ON users;
DROP POLICY IF EXISTS "Allow all operations for service role" ON events;
DROP POLICY IF EXISTS "Allow all operations for service role" ON sessions;

-- =============================================================================
-- 2. RECREATE FRESH TABLES 
-- =============================================================================

-- Users table to store signup data
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

-- Events table for funnel tracking
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES users(id), -- NULL until user signs up
  event_name VARCHAR(100) NOT NULL,
  event_properties JSONB,
  
  -- Page/User Info
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  
  -- Geographic
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),
  
  -- Timestamps
  client_timestamp TIMESTAMPTZ,
  server_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Version tracking
  app_version VARCHAR(20),
  deployment_id VARCHAR(100)
);

-- Sessions table for unique user tracking
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  user_id UUID REFERENCES users(id), -- NULL for anonymous sessions
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  page_views INTEGER DEFAULT 1,
  events_count INTEGER DEFAULT 0,
  converted BOOLEAN DEFAULT FALSE,
  conversion_plan VARCHAR(50),
  
  -- Session info
  ip_address INET,
  country VARCHAR(2),
  city VARCHAR(100),
  user_agent TEXT,
  referrer TEXT
);

-- =============================================================================
-- 3. RECREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Basic indexes for performance
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_timestamp ON events(server_timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);

-- Enhanced indexes for better querying
CREATE INDEX IF NOT EXISTS idx_events_date ON events(DATE(server_timestamp));
CREATE INDEX IF NOT EXISTS idx_events_session_date ON events(session_id, server_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_name_date ON events(event_name, server_timestamp);
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);

CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(DATE(first_seen));
CREATE INDEX IF NOT EXISTS idx_sessions_city_date ON sessions(city, first_seen);
CREATE INDEX IF NOT EXISTS idx_sessions_converted ON sessions(converted, first_seen);

CREATE INDEX IF NOT EXISTS idx_users_date ON users(DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_users_plan_date ON users(selected_plan, created_at);
CREATE INDEX IF NOT EXISTS idx_users_city_date ON users(city, created_at);

-- =============================================================================
-- 4. RECREATE ROW LEVEL SECURITY
-- =============================================================================

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow your app to read/write
CREATE POLICY "Allow all operations for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON sessions FOR ALL USING (true);

-- =============================================================================
-- 5. VERIFICATION
-- =============================================================================

-- Verify tables were created successfully
SELECT 
  table_name,
  'Empty table created' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'sessions', 'events')
ORDER BY table_name;

-- Show table structures
\d users;
\d sessions;
\d events;

-- Final confirmation
SELECT 'Database reset complete! All tables recreated with 0 records.' as result; 