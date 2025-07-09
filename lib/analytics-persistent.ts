// Persistent analytics that survives all updates
export class PersistentAnalytics {
  private static instance: PersistentAnalytics
  private apiEndpoint: string

  constructor() {
    // Use environment variable so you can change endpoints without losing data
    this.apiEndpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT || "/api/analytics"
  }

  static getInstance() {
    if (!PersistentAnalytics.instance) {
      PersistentAnalytics.instance = new PersistentAnalytics()
    }
    return PersistentAnalytics.instance
  }

  async track(event: string, properties?: Record<string, any>) {
    const payload = {
      event,
      properties,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : "",
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      // Add version tracking to see which version generated the data
      version: process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0",
      // Add session ID for user journey tracking
      sessionId: this.getOrCreateSessionId(),
    }

    try {
      // Send to your persistent database
      await fetch(this.apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      // Also send to backup analytics (optional)
      this.sendToBackupAnalytics(payload)
    } catch (error) {
      // Queue failed requests for retry
      this.queueForRetry(payload)
    }
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

  private sendToBackupAnalytics(payload: any) {
    // Send to Google Analytics as backup
    if (typeof window !== "undefined" && (window as any).gtag) {
      ;(window as any).gtag("event", payload.event, {
        custom_parameter_1: JSON.stringify(payload.properties),
        app_version: payload.version,
      })
    }
  }

  private queueForRetry(payload: any) {
    // Store failed requests in localStorage for retry
    if (typeof window !== "undefined") {
      const queue = JSON.parse(localStorage.getItem("analytics_queue") || "[]")
      queue.push(payload)
      localStorage.setItem("analytics_queue", JSON.stringify(queue))
    }
  }
}

// Export singleton instance
export const analytics = PersistentAnalytics.getInstance()
