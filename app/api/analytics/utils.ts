import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function storeInDatabase(data: any) {
  console.log("🔍 Storing server-side analytics data:", data)

  try {
    // Store event data
    if (data.event) {
      // Don't create events without valid session IDs
      if (!data.sessionId || data.sessionId === 'server') {
        console.warn("⚠️ Skipping event - no valid session ID provided:", data.event)
        return false
      }

      const { error: eventError } = await supabase.from('events').insert([{
        session_id: data.sessionId,
        event_name: data.event,
        event_properties: data.properties,
        page_url: data.url,
        user_agent: data.userAgent,
        ip_address: data.ip_address,
        // Keep existing fields for backward compatibility
        country: data.country,
        city: data.city,
        // IP-based location fields (separate from user-provided location)
        ip_country: data.ip_country,
        ip_country_code: data.ip_country_code,
        ip_region: data.ip_region,
        ip_region_name: data.ip_region_name,
        ip_city: data.ip_city,
        ip_postal_code: data.ip_postal_code,
        ip_latitude: data.ip_latitude,
        ip_longitude: data.ip_longitude,
        ip_timezone: data.ip_timezone,
        ip_isp: data.ip_isp,
        ip_organization: data.ip_organization,
        ip_connection_type: data.ip_connection_type,
        ip_is_mobile: data.ip_is_mobile,
        ip_is_proxy: data.ip_is_proxy,
        ip_is_hosting: data.ip_is_hosting,
        ip_location_source: data.ip_location_source,
        referrer: data.referrer,
        server_timestamp: data.server_timestamp,
        client_timestamp: data.timestamp,
        app_version: data.version || "1.0.0",
        deployment_id: data.deployment_id
      }])
      
      if (eventError) {
        console.error("Event storage error:", eventError)
      } else {
        console.log("✅ Event stored successfully")
      }

      // Also update/create session with enhanced IP data
      const { error: sessionError } = await supabase.from('sessions').upsert([{
        session_id: data.sessionId,
        ip_address: data.ip_address,
        // Keep existing fields for backward compatibility (will be used for user-provided location)
        country: data.country,
        city: data.city,
        // IP-based location fields (separate from user-provided location)
        ip_country: data.ip_country,
        ip_country_code: data.ip_country_code,
        ip_region: data.ip_region,
        ip_region_name: data.ip_region_name,
        ip_city: data.ip_city,
        ip_postal_code: data.ip_postal_code,
        ip_latitude: data.ip_latitude,
        ip_longitude: data.ip_longitude,
        ip_timezone: data.ip_timezone,
        ip_isp: data.ip_isp,
        ip_organization: data.ip_organization,
        ip_connection_type: data.ip_connection_type,
        ip_is_mobile: data.ip_is_mobile,
        ip_is_proxy: data.ip_is_proxy,
        ip_is_hosting: data.ip_is_hosting,
        ip_location_source: data.ip_location_source,
        user_agent: data.userAgent,
        referrer: data.referrer,
        last_seen: data.server_timestamp || new Date().toISOString()
      }], {
        onConflict: 'session_id'
      })

      if (sessionError) {
        console.error("Session update error:", sessionError)
      } else {
        console.log("✅ Session updated with IP data")
      }
    }

    return true
  } catch (error) {
    console.error("Database storage error:", error)
    return false
  }
}

export async function getAnalyticsData() {
  // This function might be used elsewhere, keeping it as placeholder for now
  console.log("getAnalyticsData called - using database.getAnalytics() instead")
  return {}
}
