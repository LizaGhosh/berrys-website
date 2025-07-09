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
    const { error } = await supabase.from("events").insert([
      {
        ...eventData,
        client_timestamp: new Date().toISOString(),
        app_version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
        deployment_id: process.env.VERCEL_DEPLOYMENT_ID || "local",
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

    // Update session with user_id and conversion
    await supabase
      .from("sessions")
      .update({
        user_id: user.id,
        converted: true,
        conversion_plan: userData.selected_plan,
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
}
