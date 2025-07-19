-- Clean up all test data
-- Remove test analytics events and users

-- 1. Delete test analytics events
DELETE FROM analytics_events 
WHERE session_id LIKE 'test_session_%' 
   OR visitor_id LIKE 'test_visitor_%'
   OR event_data->>'email' IN ('john.doe@example.com', 'jane.smith@example.com')
   OR event_data->>'user_email' IN ('john.doe@example.com', 'jane.smith@example.com');

-- 2. Delete test users
DELETE FROM users 
WHERE email IN ('john.doe@example.com', 'jane.smith@example.com')
   OR name IN ('John Doe', 'Jane Smith');

-- 3. Show remaining real data
SELECT 'Real analytics_events count:' as info, COUNT(*) as count FROM analytics_events
UNION ALL
SELECT 'Real users count:', COUNT(*) FROM users
UNION ALL
SELECT 'Real form submissions:', COUNT(*) FROM form_submissions_view;

-- 4. Show your real form submissions
SELECT 
  id,
  form_type,
  name,
  email,
  city,
  selected_plan,
  signup_source,
  submission_timestamp,
  conversion_value
FROM form_submissions_view 
ORDER BY submission_timestamp DESC; 