-- Data Retention Policy for berrys.ai Analytics
-- Run this monthly to clean up old data and maintain privacy compliance

-- =============================================================================
-- RECOMMENDED RETENTION PERIODS
-- =============================================================================
-- Users: Keep forever (business records)
-- Sessions: Keep 1 year (for long-term trends)
-- Events: Keep 6 months (for detailed analysis)
-- IP Addresses: Keep 3 months (privacy compliance)

-- =============================================================================
-- 1. CLEAN UP OLD EVENTS (6 months)
-- =============================================================================
DELETE FROM events 
WHERE server_timestamp < NOW() - INTERVAL '6 months';

-- =============================================================================
-- 2. CLEAN UP OLD SESSIONS (1 year) 
-- =============================================================================
DELETE FROM sessions 
WHERE first_seen < NOW() - INTERVAL '1 year';

-- =============================================================================
-- 3. ANONYMIZE IP ADDRESSES (3 months)
-- =============================================================================
-- Remove IP addresses but keep other data for privacy compliance
UPDATE sessions 
SET ip_address = NULL 
WHERE first_seen < NOW() - INTERVAL '3 months' 
AND ip_address IS NOT NULL;

UPDATE events 
SET ip_address = NULL 
WHERE server_timestamp < NOW() - INTERVAL '3 months' 
AND ip_address IS NOT NULL;

-- =============================================================================
-- 4. ARCHIVE OLD USER DATA (Optional - 7 years for business records)
-- =============================================================================
-- Create archive table for old users (uncomment if needed)
-- CREATE TABLE users_archive AS SELECT * FROM users WHERE created_at < NOW() - INTERVAL '7 years';
-- DELETE FROM users WHERE created_at < NOW() - INTERVAL '7 years';

-- =============================================================================
-- 5. DATABASE MAINTENANCE
-- =============================================================================
-- Reclaim storage space after deletions
VACUUM;

-- Update table statistics for better query performance
ANALYZE;

-- =============================================================================
-- VIEW CURRENT DATA USAGE
-- =============================================================================
SELECT 
  'users' as table_name,
  COUNT(*) as total_records,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM users
UNION ALL
SELECT 
  'sessions' as table_name,
  COUNT(*) as total_records,
  MIN(first_seen) as oldest_record,
  MAX(first_seen) as newest_record
FROM sessions
UNION ALL
SELECT 
  'events' as table_name,
  COUNT(*) as total_records,
  MIN(server_timestamp) as oldest_record,
  MAX(server_timestamp) as newest_record
FROM events
ORDER BY table_name; 