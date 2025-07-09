// Analytics utility functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Google Analytics 4
  if (typeof window !== "undefined" && (window as any).gtag) {
    ;(window as any).gtag("event", eventName, properties)
  }

  // Get session ID from session storage (matches enhanced analytics)
  const sessionId = typeof window !== "undefined" 
    ? sessionStorage.getItem("analytics_session") 
    : null

  // Also send to your database
  fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: eventName,
      properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      sessionId: sessionId,
    }),
  }).catch(console.error)
}

export const trackPageView = (page: string) => {
  trackEvent("page_view", { page })
}

export const trackSignup = (plan: string, userData: any) => {
  trackEvent("signup", { plan, ...userData })
}

export const trackDemo = (source: string) => {
  trackEvent("demo_request", { source })
}
