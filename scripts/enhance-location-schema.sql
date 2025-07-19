-- Enhanced Location Data Migration for berrys.ai Analytics
-- Run this script in your Supabase SQL Editor to add enhanced location fields

-- =============================================================================
-- ADD ENHANCED LOCATION FIELDS TO SESSIONS TABLE
-- =============================================================================

-- Add new columns to sessions table
-- IP-based location detection (from IP geolocation)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS ip_country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS ip_region VARCHAR(100),
ADD COLUMN IF NOT EXISTS ip_region_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_organization VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_connection_type VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS ip_is_mobile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_is_proxy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_is_hosting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_location_source VARCHAR(20) DEFAULT 'vercel';

-- Note: existing 'city' and 'country' fields remain for user-provided location data

-- =============================================================================
-- ADD ENHANCED LOCATION FIELDS TO EVENTS TABLE
-- =============================================================================

-- Add new columns to events table
-- IP-based location detection (from IP geolocation)
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ip_country VARCHAR(100),
ADD COLUMN IF NOT EXISTS ip_country_code VARCHAR(5),
ADD COLUMN IF NOT EXISTS ip_region VARCHAR(100),
ADD COLUMN IF NOT EXISTS ip_region_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_city VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS ip_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS ip_longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS ip_timezone VARCHAR(50),
ADD COLUMN IF NOT EXISTS ip_isp VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_organization VARCHAR(255),
ADD COLUMN IF NOT EXISTS ip_connection_type VARCHAR(20) DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS ip_is_mobile BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_is_proxy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_is_hosting BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ip_location_source VARCHAR(20) DEFAULT 'vercel';

-- Note: existing 'city' and 'country' fields remain for user-provided location data

-- =============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================================================

-- Geographic indexes for IP-based location queries
CREATE INDEX IF NOT EXISTS idx_sessions_ip_country ON sessions(ip_country);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_region ON sessions(ip_region);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_connection_type ON sessions(ip_connection_type);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_location_source ON sessions(ip_location_source);
CREATE INDEX IF NOT EXISTS idx_sessions_ip_coordinates ON sessions(ip_latitude, ip_longitude);

CREATE INDEX IF NOT EXISTS idx_events_ip_country ON events(ip_country);
CREATE INDEX IF NOT EXISTS idx_events_ip_region ON events(ip_region);
CREATE INDEX IF NOT EXISTS idx_events_ip_connection_type ON events(ip_connection_type);
CREATE INDEX IF NOT EXISTS idx_events_ip_location_source ON events(ip_location_source);

-- Keep existing indexes for user-provided location data
CREATE INDEX IF NOT EXISTS idx_sessions_user_country ON sessions(country);
CREATE INDEX IF NOT EXISTS idx_sessions_user_city ON sessions(city);
CREATE INDEX IF NOT EXISTS idx_events_user_country ON events(country);
CREATE INDEX IF NOT EXISTS idx_events_user_city ON events(city);

-- =============================================================================
-- CREATE LOCATION SUMMARY VIEW
-- =============================================================================

-- Create a view for easy IP-based location analytics
CREATE OR REPLACE VIEW ip_location_analytics AS
SELECT 
    s.ip_country,
    s.ip_country_code,
    s.ip_region_name,
    s.ip_city,
    s.ip_timezone,
    s.ip_isp,
    s.ip_connection_type,
    s.ip_is_mobile,
    s.ip_is_proxy,
    s.ip_is_hosting,
    s.ip_location_source,
    COUNT(DISTINCT s.session_id) as unique_sessions,
    COUNT(DISTINCT CASE WHEN s.converted = true THEN s.session_id END) as conversions,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.converted = true THEN s.session_id END)::numeric / 
        COUNT(DISTINCT s.session_id) * 100, 
        2
    ) as conversion_rate,
    AVG(s.ip_latitude) as avg_latitude,
    AVG(s.ip_longitude) as avg_longitude
FROM sessions s
WHERE s.ip_country IS NOT NULL
GROUP BY s.ip_country, s.ip_country_code, s.ip_region_name, s.ip_city, s.ip_timezone, s.ip_isp, 
         s.ip_connection_type, s.ip_is_mobile, s.ip_is_proxy, s.ip_is_hosting, s.ip_location_source
ORDER BY unique_sessions DESC;

-- Create a view for user-provided location analytics
CREATE OR REPLACE VIEW user_location_analytics AS
SELECT 
    s.country as user_country,
    s.city as user_city,
    COUNT(DISTINCT s.session_id) as unique_sessions,
    COUNT(DISTINCT CASE WHEN s.converted = true THEN s.session_id END) as conversions,
    ROUND(
        COUNT(DISTINCT CASE WHEN s.converted = true THEN s.session_id END)::numeric / 
        COUNT(DISTINCT s.session_id) * 100, 
        2
    ) as conversion_rate
FROM sessions s
WHERE s.country IS NOT NULL OR s.city IS NOT NULL
GROUP BY s.country, s.city
ORDER BY unique_sessions DESC;

-- =============================================================================
-- CREATE GEOGRAPHIC CLUSTERS VIEW
-- =============================================================================

-- View for IP-based geographic clustering analysis
CREATE OR REPLACE VIEW ip_geographic_clusters AS
SELECT 
    ip_country,
    ip_region_name,
    ip_city,
    COUNT(DISTINCT session_id) as sessions,
    AVG(ip_latitude) as center_lat,
    AVG(ip_longitude) as center_lon,
    STRING_AGG(DISTINCT ip_timezone, ', ') as timezones,
    STRING_AGG(DISTINCT ip_isp, ', ') as isps,
    ROUND(AVG(CASE WHEN converted THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
FROM sessions
WHERE ip_latitude IS NOT NULL AND ip_longitude IS NOT NULL
GROUP BY ip_country, ip_region_name, ip_city
HAVING COUNT(DISTINCT session_id) > 1
ORDER BY sessions DESC;

-- =============================================================================
-- EXAMPLE QUERIES FOR ENHANCED LOCATION DATA
-- =============================================================================

-- Top IP-based regions by conversion rate
-- SELECT ip_region_name, ip_country, unique_sessions, conversion_rate 
-- FROM ip_location_analytics 
-- WHERE unique_sessions >= 5 
-- ORDER BY conversion_rate DESC 
-- LIMIT 10;

-- Mobile vs Desktop conversion rates (IP-based)
-- SELECT 
--     ip_connection_type,
--     COUNT(DISTINCT session_id) as sessions,
--     COUNT(DISTINCT CASE WHEN converted THEN session_id END) as conversions,
--     ROUND(AVG(CASE WHEN converted THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
-- FROM sessions
-- GROUP BY ip_connection_type
-- ORDER BY conversion_rate DESC;

-- ISP analysis (IP-based)
-- SELECT 
--     ip_isp,
--     COUNT(DISTINCT session_id) as sessions,
--     COUNT(DISTINCT ip_country) as countries,
--     ROUND(AVG(CASE WHEN converted THEN 1 ELSE 0 END) * 100, 2) as conversion_rate
-- FROM sessions
-- WHERE ip_isp IS NOT NULL
-- GROUP BY ip_isp
-- HAVING COUNT(DISTINCT session_id) >= 3
-- ORDER BY sessions DESC;

-- Compare IP-based vs User-provided locations
-- SELECT 
--     s.ip_city as detected_city,
--     s.ip_country as detected_country,
--     s.city as user_city,
--     s.country as user_country,
--     COUNT(*) as sessions
-- FROM sessions s
-- WHERE s.ip_city IS NOT NULL AND s.city IS NOT NULL
-- GROUP BY s.ip_city, s.ip_country, s.city, s.country
-- ORDER BY sessions DESC;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if new IP-based columns were added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions' 
AND column_name IN ('ip_country_code', 'ip_region', 'ip_timezone', 'ip_isp', 'ip_connection_type')
ORDER BY column_name;

-- Check current data distribution
SELECT 
    ip_location_source,
    COUNT(*) as count,
    COUNT(DISTINCT ip_country) as unique_countries
FROM sessions
WHERE ip_location_source IS NOT NULL
GROUP BY ip_location_source;

-- Check user-provided vs IP-based location data
SELECT 
    'user_provided' as data_type,
    COUNT(*) as sessions_with_data,
    COUNT(DISTINCT city) as unique_cities,
    COUNT(DISTINCT country) as unique_countries
FROM sessions
WHERE city IS NOT NULL OR country IS NOT NULL
UNION ALL
SELECT 
    'ip_based' as data_type,
    COUNT(*) as sessions_with_data,
    COUNT(DISTINCT ip_city) as unique_cities,
    COUNT(DISTINCT ip_country) as unique_countries
FROM sessions
WHERE ip_city IS NOT NULL OR ip_country IS NOT NULL;

COMMENT ON VIEW ip_location_analytics IS 'IP-based location analytics with geographic and ISP data';
COMMENT ON VIEW user_location_analytics IS 'User-provided location analytics for signup data';
COMMENT ON VIEW ip_geographic_clusters IS 'IP-based geographic clustering analysis for location insights'; 