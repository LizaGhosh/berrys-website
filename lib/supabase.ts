import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database functions
export const database = {
  // Track events
  async trackEvent(eventData: {
    session_id: string
    event_name: string
    event_properties?: any
    page_url?: string
    referrer?: string
    user_agent?: string
    ip_address?: string
    country?: string
    city?: string
  }) {
    const { error } = await supabase.from("analytics_events").insert([
      {
        session_id: eventData.session_id,
        event_type: eventData.event_name,
        event_data: eventData.event_properties,
        timestamp: new Date().toISOString(),
        user_agent: eventData.user_agent,
        url: eventData.page_url,
        referrer: eventData.referrer,
        visitor_id: eventData.session_id, // Use session_id as visitor_id for compatibility
      },
    ])

    if (error) console.error("Event tracking error:", error)
    return !error
  },

  // Create or update session
  async upsertSession(sessionData: {
    session_id: string
    ip_address?: string
    country?: string
    city?: string
    user_agent?: string
    referrer?: string
  }) {
    const { error } = await supabase.from("sessions").upsert(
      [
        {
          ...sessionData,
          last_seen: new Date().toISOString(),
        },
      ],
      {
        onConflict: "session_id",
      },
    )

    if (error) console.error("Session tracking error:", error)
    return !error
  },

  // Store user signup
  async createUser(userData: {
    name: string
    city: string
    email: string
    selected_plan: string
    signup_source?: string
    session_id: string
  }) {
    // Insert user
    const { data: user, error: userError } = await supabase
      .from("users")
      .insert([
        {
          name: userData.name,
          city: userData.city,
          email: userData.email,
          selected_plan: userData.selected_plan,
          signup_source: userData.signup_source,
        },
      ])
      .select()
      .single()

    if (userError) {
      console.error("User creation error:", userError)
      return null
    }

    // Update session with user_id, conversion, and user's city info
    await supabase
      .from("sessions")
      .update({
        user_id: user.id,
        converted: true,
        conversion_plan: userData.selected_plan,
        city: userData.city, // Copy city from user to session
      })
      .eq("session_id", userData.session_id)

    return user
  },

  // Analytics queries
  async getAnalytics() {
    // Total users
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    // Unique sessions (unique visitors)
    const { count: uniqueVisitors } = await supabase.from("sessions").select("*", { count: "exact", head: true })

    // Conversion funnel
    const { data: funnelData } = await supabase
      .from("events")
      .select("event_name")
      .in("event_name", ["page_loaded", "demo_requested", "plan_selected", "signup_completed"])

    // Plan distribution
    const { data: planData } = await supabase.from("users").select("selected_plan")

    // Recent signups
    const { data: recentUsers } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10)

    return {
      totalUsers: totalUsers || 0,
      uniqueVisitors: uniqueVisitors || 0,
      funnelData: funnelData || [],
      planData: planData || [],
      recentUsers: recentUsers || [],
    }
  },

  // Get daily analytics with optional filters
  async getDailyAnalytics(params?: {
    startDate?: string
    endDate?: string
    city?: string
  }) {
    const { startDate, endDate, city } = params || {}
    
    // Get all sessions and users to combine the data properly
    let sessionsQuery = supabase
      .from("sessions")
      .select("first_seen, converted, city, session_id, user_id")

    let usersQuery = supabase
      .from("users")
      .select("created_at, city, id")

    // Apply date filters to both queries with timezone awareness
    if (startDate) {
      // Convert local date to UTC range that covers the entire local day
      // For PDT (UTC-7), July 12th local = July 12th 07:00 UTC to July 13th 06:59 UTC
      const timezoneOffset = new Date().getTimezoneOffset() // minutes
      const startDateUTC = new Date(`${startDate}T00:00:00`)
      startDateUTC.setMinutes(startDateUTC.getMinutes() + timezoneOffset)
      
      console.log(`🔍 TIMEZONE DEBUG:`)
      console.log(`   - Input date: ${startDate}`)
      console.log(`   - Timezone offset: ${timezoneOffset} minutes (${timezoneOffset/60} hours)`)
      console.log(`   - Local start: ${startDate}T00:00:00`)
      console.log(`   - UTC start: ${startDateUTC.toISOString()}`)
      console.log(`   - Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
      
      sessionsQuery = sessionsQuery.gte("first_seen", startDateUTC.toISOString())
      usersQuery = usersQuery.gte("created_at", startDateUTC.toISOString())
    }
    if (endDate) {
      // End of day in local timezone
      const timezoneOffset = new Date().getTimezoneOffset() // minutes  
      const endDateUTC = new Date(`${endDate}T23:59:59.999`)
      endDateUTC.setMinutes(endDateUTC.getMinutes() + timezoneOffset)
      
      console.log(`🔍 Date filter - End: ${endDate} local → ${endDateUTC.toISOString()} UTC`)
      
      sessionsQuery = sessionsQuery.lte("first_seen", endDateUTC.toISOString())
      usersQuery = usersQuery.lte("created_at", endDateUTC.toISOString())
    }

    // Apply city filter (case insensitive)
    if (city && city !== "all") {
      sessionsQuery = sessionsQuery.ilike("city", city)
      usersQuery = usersQuery.ilike("city", city)
    }

    const [sessionsResult, usersResult] = await Promise.all([
      sessionsQuery,
      usersQuery
    ])

    if (sessionsResult.error || usersResult.error) {
      console.error("Daily analytics query error:", sessionsResult.error || usersResult.error)
      return []
    }

    const sessions = sessionsResult.data || []
    const users = usersResult.data || []

    // Combine sessions and user signup data by date
    const dailyStats: Record<string, any> = {}

    // Process sessions (visitors)
    sessions.forEach((session, index) => {
      // Use local timezone instead of UTC to prevent date shifting
      const sessionDate = new Date(session.first_seen)
      const date = sessionDate.getFullYear() + '-' + 
                   String(sessionDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(sessionDate.getDate()).padStart(2, '0')
      
      // Debug first few sessions
      if (index < 3) {
        console.log(`📊 Session ${index + 1}:`)
        console.log(`   - Raw DB timestamp: ${session.first_seen}`)
        console.log(`   - Parsed as Date: ${sessionDate.toISOString()}`)
        console.log(`   - Local time: ${sessionDate.toLocaleString()}`)
        console.log(`   - Generated date key: ${date}`)
        console.log(`   - Session ID: ${session.session_id}`)
      }
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total_sessions: 0,
          unique_visitors: new Set(),
          conversions: 0,
          signups: 0
        }
      }
      
      dailyStats[date].total_sessions++
      dailyStats[date].unique_visitors.add(session.session_id)
      if (session.converted) {
        dailyStats[date].conversions++
      }
    })

    // Process user signups (actual conversions by signup date)
    users.forEach(user => {
      // Use local timezone instead of UTC to prevent date shifting
      const signupDate = new Date(user.created_at)
      const date = signupDate.getFullYear() + '-' + 
                   String(signupDate.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(signupDate.getDate()).padStart(2, '0')
      
      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          total_sessions: 0,
          unique_visitors: new Set(),
          conversions: 0,
          signups: 0
        }
      }
      
      dailyStats[date].signups++
    })

    // Convert to array and add conversion rate
    const result = Object.values(dailyStats)
      .map((day: any) => ({
        date: day.date,
        total_sessions: day.total_sessions,
        unique_visitors: day.unique_visitors.size,
        conversions: Math.max(day.conversions, day.signups), // Use actual signups if higher
        conversion_rate: day.total_sessions > 0 
          ? Math.round((Math.max(day.conversions, day.signups) / day.total_sessions) * 100 * 10) / 10 
          : day.signups > 0 ? 100 : 0 // 100% if signups exist but no sessions tracked
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 30)

    console.log(`📈 FINAL RESULTS:`)
    console.log(`   - Total days: ${result.length}`)
    result.forEach((day, index) => {
      if (index < 5) {
        console.log(`   - Day ${index + 1}: ${day.date} (${day.total_sessions} sessions, ${day.unique_visitors} visitors)`)
      }
    })
    
    return result
  },

  // Get available cities for filter dropdown
  async getCities() {
    // Get cities from both sessions and users tables
    const [sessionsResult, usersResult] = await Promise.all([
      supabase
        .from("sessions")
        .select("city")
        .not("city", "is", null)
        .not("city", "eq", ""),
      supabase
        .from("users") 
        .select("city")
        .not("city", "is", null)
        .not("city", "eq", "")
    ])
    
    const sessionCities = sessionsResult.data?.map(s => s.city).filter(Boolean) || []
    const userCities = usersResult.data?.map(u => u.city).filter(Boolean) || []
    
    // Combine and deduplicate cities from both sources
    const allCities = [...sessionCities, ...userCities]
    const cities = [...new Set(allCities)].sort()
    
    console.log("🏙️ Found cities:", { sessionCities, userCities, combined: cities })
    
    return cities
  },

  // Get detailed logs for a specific day
  async getDayDetails(date: string) {
    // Convert local date to UTC range that covers the entire local day
    const timezoneOffset = new Date().getTimezoneOffset() // minutes
    const startDateUTC = new Date(`${date}T00:00:00`)
    startDateUTC.setMinutes(startDateUTC.getMinutes() + timezoneOffset)
    
    const endDateUTC = new Date(`${date}T23:59:59.999`)
    endDateUTC.setMinutes(endDateUTC.getMinutes() + timezoneOffset)
    
    // Get all sessions for that day AND users who signed up that day
    const [sessionsResult, usersResult] = await Promise.all([
      // Sessions created on this day
      supabase
        .from("sessions")
        .select(`
          *,
          users (
            name,
            email,
            selected_plan,
            created_at
          )
        `)
        .gte("first_seen", startDateUTC.toISOString())
        .lt("first_seen", endDateUTC.toISOString())
        .order("first_seen", { ascending: false }),
      
      // Users who signed up on this day (might have sessions from earlier)
      supabase
        .from("users")
        .select(`
          *,
          sessions!inner (
            session_id,
            first_seen,
            last_seen,
            ip_address,
            country,
            city,
            user_agent,
            converted,
            conversion_plan,
            ip_country,
            ip_country_code,
            ip_region,
            ip_region_name,
            ip_city,
            ip_postal_code,
            ip_latitude,
            ip_longitude,
            ip_timezone,
            ip_isp,
            ip_organization,
            ip_connection_type,
            ip_is_mobile,
            ip_is_proxy,
            ip_is_hosting,
            ip_location_source
          )
        `)
        .gte("created_at", startDateUTC.toISOString())
        .lt("created_at", endDateUTC.toISOString())
        .order("created_at", { ascending: false })
    ])

    const sessions = sessionsResult.data || []
    const signupUsers = usersResult.data || []

    // Convert user signups to session format for consistent display
    const userSessions = signupUsers.map(user => ({
      session_id: user.sessions.session_id,
      first_seen: user.created_at, // Use signup time instead of first session
      last_seen: user.sessions.last_seen,
      ip_address: user.sessions.ip_address,
      country: user.sessions.country,
      city: user.city, // Use user's city as primary
      user_agent: user.sessions.user_agent,
      converted: true, // User signups are always converted
      conversion_plan: user.selected_plan,
      // IP-based location fields
      ip_country: user.sessions.ip_country,
      ip_country_code: user.sessions.ip_country_code,
      ip_region: user.sessions.ip_region,
      ip_region_name: user.sessions.ip_region_name,
      ip_city: user.sessions.ip_city,
      ip_postal_code: user.sessions.ip_postal_code,
      ip_latitude: user.sessions.ip_latitude,
      ip_longitude: user.sessions.ip_longitude,
      ip_timezone: user.sessions.ip_timezone,
      ip_isp: user.sessions.ip_isp,
      ip_organization: user.sessions.ip_organization,
      ip_connection_type: user.sessions.ip_connection_type,
      ip_is_mobile: user.sessions.ip_is_mobile,
      ip_is_proxy: user.sessions.ip_is_proxy,
      ip_is_hosting: user.sessions.ip_is_hosting,
      ip_location_source: user.sessions.ip_location_source,
      users: {
        name: user.name,
        email: user.email,
        selected_plan: user.selected_plan,
        created_at: user.created_at
      },
      device_info: this.parseUserAgent(user.sessions.user_agent)
    }))

    // Combine sessions and user signups, removing duplicates
    const allSessions = [...sessions, ...userSessions]
    const uniqueSessions = allSessions.filter((session, index, self) => 
      index === self.findIndex(s => s.session_id === session.session_id)
    )

    // Add device info for regular sessions
    const detailedSessions = uniqueSessions.map(session => ({
      ...session,
      device_info: session.device_info || this.parseUserAgent(session.user_agent),
    }))

    console.log(`📊 Day details for ${date}:`, {
      sessionsFound: sessions.length,
      signupsFound: signupUsers.length,
      totalUnique: detailedSessions.length
    })

    return detailedSessions
  },

  // Helper function to parse user agent for device info
  parseUserAgent(userAgent: string) {
    if (!userAgent) return { 
      browser: "Browser Not Detected", 
      os: "Operating System Not Detected", 
      device: "Device Type Not Detected" 
    }
    
    // Simple user agent parsing (you could use a library like ua-parser-js for more accuracy)
    const browser = userAgent.includes("Chrome") ? "Chrome" :
                   userAgent.includes("Firefox") ? "Firefox" :
                   userAgent.includes("Safari") ? "Safari" :
                   userAgent.includes("Edge") ? "Edge" : "Browser Not Recognized"
    
    const os = userAgent.includes("Windows") ? "Windows" :
              userAgent.includes("Mac") ? "macOS" :
              userAgent.includes("Linux") ? "Linux" :
              userAgent.includes("Android") ? "Android" :
              userAgent.includes("iOS") ? "iOS" : "OS Not Recognized"
    
    const device = userAgent.includes("Mobile") ? "Mobile" :
                  userAgent.includes("Tablet") ? "Tablet" : "Desktop"
    
    return { browser, os, device }
  },
}
