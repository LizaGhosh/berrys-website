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

-- Indexes for performance
CREATE INDEX idx_events_session_id ON events(session_id);
CREATE INDEX idx_events_event_name ON events(event_name);
CREATE INDEX idx_events_timestamp ON events(server_timestamp);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_sessions_session_id ON sessions(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow your app to read/write
CREATE POLICY "Allow all operations for service role" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON events FOR ALL USING (true);
CREATE POLICY "Allow all operations for service role" ON sessions FOR ALL USING (true); 