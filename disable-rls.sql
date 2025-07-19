-- Temporarily disable RLS for testing
ALTER TABLE analytics_events DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_views DISABLE ROW LEVEL SECURITY;
ALTER TABLE page_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE video_analytics DISABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Or create permissive policies
DROP POLICY IF EXISTS "Enable all operations for analytics" ON analytics_events;
DROP POLICY IF EXISTS "Enable all operations for user_sessions" ON user_sessions;
DROP POLICY IF EXISTS "Enable all operations for page_views" ON page_views;
DROP POLICY IF EXISTS "Enable all operations for page_interactions" ON page_interactions;
DROP POLICY IF EXISTS "Enable all operations for video_analytics" ON video_analytics;
DROP POLICY IF EXISTS "Enable all operations for form_submissions" ON form_submissions;
DROP POLICY IF EXISTS "Enable all operations for users" ON users;

CREATE POLICY "Allow all" ON analytics_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON user_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON page_views FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON page_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON video_analytics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON form_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true); 