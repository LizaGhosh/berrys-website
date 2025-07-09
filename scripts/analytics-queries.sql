-- Daily signups trend
SELECT 
  DATE(created_at) as signup_date,
  COUNT(*) as signups,
  COUNT(CASE WHEN selected_plan = 'monthly' THEN 1 END) as monthly_signups,
  COUNT(CASE WHEN selected_plan = 'annual' THEN 1 END) as annual_signups
FROM users 
GROUP BY DATE(created_at) 
ORDER BY signup_date DESC;

-- Conversion funnel by day
SELECT 
  DATE(server_timestamp) as date,
  COUNT(CASE WHEN event_name = 'page_loaded' THEN 1 END) as page_views,
  COUNT(CASE WHEN event_name = 'demo_requested' THEN 1 END) as demo_requests,
  COUNT(CASE WHEN event_name = 'plan_selected' THEN 1 END) as plan_selections,
  COUNT(CASE WHEN event_name = 'signup_completed' THEN 1 END) as signups
FROM events 
GROUP BY DATE(server_timestamp) 
ORDER BY date DESC;

-- Top traffic sources
SELECT 
  referrer,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(*) as total_sessions
FROM sessions 
WHERE referrer IS NOT NULL 
GROUP BY referrer 
ORDER BY unique_visitors DESC;

-- User journey analysis
SELECT 
  s.session_id,
  s.first_seen,
  s.converted,
  s.conversion_plan,
  COUNT(e.id) as total_events,
  STRING_AGG(e.event_name, ' → ' ORDER BY e.server_timestamp) as user_journey
FROM sessions s
LEFT JOIN events e ON s.session_id = e.session_id
GROUP BY s.session_id, s.first_seen, s.converted, s.conversion_plan
ORDER BY s.first_seen DESC
LIMIT 20;

-- Geographic analysis
SELECT 
  country,
  city,
  COUNT(DISTINCT session_id) as unique_visitors,
  COUNT(CASE WHEN converted = true THEN 1 END) as conversions,
  ROUND(COUNT(CASE WHEN converted = true THEN 1 END)::numeric / COUNT(DISTINCT session_id) * 100, 2) as conversion_rate
FROM sessions 
WHERE country IS NOT NULL
GROUP BY country, city
ORDER BY unique_visitors DESC; 