// Enhanced analytics that stores in database
export class EnhancedAnalytics {
  private sessionId: string
  private database: any = null
  private sessionStartTime: number
  private scrollDepth: { [key: string]: boolean } = {}
  private buttonClicks: { [key: string]: boolean } = {}

  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.sessionStartTime = Date.now()
    this.initializeSession()
    this.setupScrollTracking()
    this.setupVideoTracking()
  }

  private async getDatabase() {
    if (!this.database) {
      try {
        const { database } = await import("./supabase")
        this.database = database
      } catch (error) {
        console.warn("Failed to load database:", error)
        this.database = null
      }
    }
    return this.database
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

    // Get client IP and location data
    const sessionData = {
      session_id: this.sessionId,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      session_start: new Date().toISOString(),
    }

    console.log("🔍 Creating session with data:", sessionData)

    const db = await this.getDatabase()
    if (db) {
      await db.upsertSession(sessionData)
    }
  }

  private setupScrollTracking() {
    if (typeof window === "undefined") return

    // Track scroll depth
    let maxScrollDepth = 0
    const sections = {
      'hero': 0,
      'features': 0.3,
      'how_it_works': 0.5,
      'testimonials': 0.7,
      'pricing': 0.9
    }

    window.addEventListener('scroll', () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)
      maxScrollDepth = Math.max(maxScrollDepth, scrollPercent)

      // Track section visibility
      Object.entries(sections).forEach(([section, threshold]) => {
        if (scrollPercent >= threshold && !this.scrollDepth[section]) {
          this.scrollDepth[section] = true
          this.trackEvent('section_viewed', {
            section_name: section,
            scroll_percent: scrollPercent,
            time_on_page: Date.now() - this.sessionStartTime
          })
        }
      })

      // Track if user left after first section
      if (scrollPercent < 0.1 && !this.scrollDepth['left_early']) {
        setTimeout(() => {
          if (window.scrollY < 100) {
            this.scrollDepth['left_early'] = true
            this.trackEvent('user_left_early', {
              scroll_percent: scrollPercent,
              time_on_page: Date.now() - this.sessionStartTime
            })
          }
        }, 10000) // Check after 10 seconds
      }
    })
  }

  private setupVideoTracking() {
    if (typeof window === "undefined") return

    // Track video interactions
    const video = document.querySelector('iframe[src*="youtube"]')
    if (video) {
      // Track video play attempts
      video.addEventListener('click', () => {
        this.trackEvent('video_clicked', {
          video_source: 'youtube',
          time_on_page: Date.now() - this.sessionStartTime
        })
      })
    }
  }

  async trackEvent(eventName: string, properties?: Record<string, any>) {
    // Store in database
    const db = await this.getDatabase()
    if (db) {
      await db.trackEvent({
        session_id: this.sessionId,
        event_name: eventName,
        event_properties: properties,
        page_url: typeof window !== "undefined" ? window.location.href : "",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      })
    }

    // Also send to Google Analytics (backup)
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", eventName, properties)
    }
  }

  async trackButtonClick(buttonName: string, properties?: Record<string, any>) {
    if (this.buttonClicks[buttonName]) return // Prevent duplicate tracking
    
    this.buttonClicks[buttonName] = true
    await this.trackEvent('button_clicked', {
      button_name: buttonName,
      time_on_page: Date.now() - this.sessionStartTime,
      ...properties
    })
  }

  async trackFormStart(formName: string, properties?: Record<string, any>) {
    await this.trackEvent('form_started', {
      form_name: formName,
      time_on_page: Date.now() - this.sessionStartTime,
      ...properties
    })
  }

  async trackFormComplete(formName: string, properties?: Record<string, any>) {
    await this.trackEvent('form_completed', {
      form_name: formName,
      time_on_page: Date.now() - this.sessionStartTime,
      ...properties
    })
  }

  async trackSignup(userData: {
    name: string
    city: string
    email: string
    selected_plan: string
    signup_source?: string
  }) {
    // Store user in database
    const db = await this.getDatabase()
    if (!db) return null

    const user = await db.createUser({
      ...userData,
      session_id: this.sessionId,
    })

    // Track signup event
    await this.trackEvent("signup_completed", {
      plan: userData.selected_plan,
      source: userData.signup_source,
      time_on_page: Date.now() - this.sessionStartTime,
    })

    return user
  }

  async trackSessionEnd() {
    const sessionDuration = Date.now() - this.sessionStartTime
    await this.trackEvent('session_ended', {
      session_duration_ms: sessionDuration,
      session_duration_minutes: Math.round(sessionDuration / 60000 * 100) / 100,
      max_scroll_depth: Math.max(...Object.values(this.scrollDepth).map(v => v ? 1 : 0)),
      buttons_clicked: Object.keys(this.buttonClicks).length,
    })
  }
}

// Export singleton instance
export const analytics = new EnhancedAnalytics()

// Track session end when user leaves
if (typeof window !== "undefined") {
  window.addEventListener('beforeunload', () => {
    analytics.trackSessionEnd()
  })
} 