-- Export All Analytics Data from Supabase
-- Copy results from each query and save to CSV files

-- =============================================================================
-- 1. EXPORT ALL USERS
-- =============================================================================
-- Copy this result and save as "users_export.csv"
COPY (
  SELECT 
    id,
    name,
    email,
    city,
    selected_plan,
    signup_source,
    created_at,
    updated_at
  FROM users 
  ORDER BY created_at DESC
) TO STDOUT WITH CSV HEADER;

-- Alternative: Regular SELECT for copy-paste
SELECT 
  id,
  name,
  email,
  city,
  selected_plan,
  signup_source,
  created_at,
  updated_at
FROM users 
ORDER BY created_at DESC;

-- =============================================================================
-- 2. EXPORT ALL SESSIONS
-- =============================================================================
-- Copy this result and save as "sessions_export.csv"
COPY (
  SELECT 
    id,
    session_id,
    user_id,
    first_seen,
    last_seen,
    page_views,
    events_count,
    converted,
    conversion_plan,
    ip_address,
    country,
    city,
    user_agent,
    referrer
  FROM sessions 
  ORDER BY first_seen DESC
) TO STDOUT WITH CSV HEADER;

-- Alternative: Regular SELECT for copy-paste
SELECT 
  id,
  session_id,
  user_id,
  first_seen,
  last_seen,
  page_views,
  events_count,
  converted,
  conversion_plan,
  ip_address,
  country,
  city,
  user_agent,
  referrer
FROM sessions 
ORDER BY first_seen DESC;

-- =============================================================================
-- 3. EXPORT ALL EVENTS
-- =============================================================================
-- Copy this result and save as "events_export.csv"
COPY (
  SELECT 
    id,
    session_id,
    user_id,
    event_name,
    event_properties,
    page_url,
    referrer,
    user_agent,
    ip_address,
    country,
    city,
    client_timestamp,
    server_timestamp,
    app_version,
    deployment_id
  FROM events 
  ORDER BY server_timestamp DESC
) TO STDOUT WITH CSV HEADER;

-- Alternative: Regular SELECT for copy-paste (LIMITED to prevent overload)
SELECT 
  id,
  session_id,
  user_id,
  event_name,
  event_properties,
  page_url,
  referrer,
  user_agent,
  ip_address,
  country,
  city,
  client_timestamp,
  server_timestamp,
  app_version,
  deployment_id
FROM events 
ORDER BY server_timestamp DESC
LIMIT 10000; -- Remove limit to get all events

-- =============================================================================
-- 4. EXPORT COMBINED USER JOURNEY DATA
-- =============================================================================
-- Complete user journeys with session and event data
COPY (
  SELECT 
    u.name as user_name,
    u.email,
    u.city as user_city,
    u.selected_plan,
    u.created_at as signup_date,
    s.session_id,
    s.first_seen as visit_start,
    s.last_seen as visit_end,
    s.page_views,
    s.events_count,
    s.ip_address,
    s.referrer,
    -- Calculate conversion time
    EXTRACT(EPOCH FROM (u.created_at - s.first_seen))/3600 as hours_to_convert,
    -- Get their events (limited to avoid huge text)
    (
      SELECT STRING_AGG(event_name, ', ' ORDER BY server_timestamp) 
      FROM events e 
      WHERE e.session_id = s.session_id
      LIMIT 50
    ) as user_events
  FROM users u
  LEFT JOIN sessions s ON u.id = s.user_id
  ORDER BY u.created_at DESC
) TO STDOUT WITH CSV HEADER;

-- =============================================================================
-- 5. EXPORT ANALYTICS SUMMARY
-- =============================================================================
-- High-level summary for reporting
COPY (
  SELECT 
    DATE(COALESCE(s.first_seen, u.created_at)) as date,
    COUNT(DISTINCT s.session_id) as unique_visitors,
    COUNT(s.session_id) as total_sessions,
    COUNT(u.id) as signups,
    COUNT(CASE WHEN s.converted = true THEN 1 END) as session_conversions,
    ROUND(
      CASE 
        WHEN COUNT(s.session_id) > 0 
        THEN (COUNT(u.id)::numeric / COUNT(s.session_id)) * 100 
        ELSE 0 
      END, 2
    ) as conversion_rate,
    STRING_AGG(DISTINCT s.city, ', ') as cities,
    STRING_AGG(DISTINCT u.selected_plan, ', ') as plans_selected
  FROM sessions s
  FULL OUTER JOIN users u ON DATE(s.first_seen) = DATE(u.created_at)
  GROUP BY DATE(COALESCE(s.first_seen, u.created_at))
  ORDER BY date DESC
) TO STDOUT WITH CSV HEADER;

-- =============================================================================
-- 6. EXPORT EVENT BREAKDOWN
-- =============================================================================
-- Event analytics
COPY (
  SELECT 
    event_name,
    COUNT(*) as event_count,
    COUNT(DISTINCT session_id) as unique_sessions,
    COUNT(DISTINCT user_id) as unique_users,
    DATE(MIN(server_timestamp)) as first_occurrence,
    DATE(MAX(server_timestamp)) as last_occurrence,
    STRING_AGG(DISTINCT city, ', ') as cities
  FROM events 
  GROUP BY event_name
  ORDER BY event_count DESC
) TO STDOUT WITH CSV HEADER; 