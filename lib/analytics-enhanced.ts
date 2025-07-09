import { database } from "./supabase"

// Enhanced analytics that stores in database
export class EnhancedAnalytics {
  private sessionId: string

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.initializeSession()
  }

  private getOrCreateSessionId(): string {
    if (typeof window === "undefined") return "server"

    let sessionId = sessionStorage.getItem("analytics_session")
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem("analytics_session", sessionId)
    }
    return sessionId
  }

  private async initializeSession() {
    if (typeof window === "undefined") return

    await database.upsertSession({
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    })
  }

  async trackEvent(eventName: string, properties?: Record<string, any>) {
    // Store in database
    await database.trackEvent({
      session_id: this.sessionId,
      event_name: eventName,
      event_properties: properties,
      page_url: typeof window !== "undefined" ? window.location.href : "",
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    })

    // Also send to Google Analytics (backup)
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", eventName, properties)
    }
  }

  async trackSignup(userData: {
    name: string
    city: string
    email: string
    selected_plan: string
    signup_source?: string
  }) {
    // Store user in database
    const user = await database.createUser({
      ...userData,
      session_id: this.sessionId,
    })

    // Track signup event
    await this.trackEvent("signup_completed", {
      plan: userData.selected_plan,
      source: userData.signup_source,
    })

    return user
  }
}

// Export singleton instance
export const analytics = new EnhancedAnalytics() 