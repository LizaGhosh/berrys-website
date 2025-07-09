// Global Analytics Initialization - ensures proper session tracking
// This should be loaded on every page to guarantee session creation

import { analytics } from "./analytics-enhanced"

export function initializeGlobalAnalytics() {
  // Ensure we're in browser environment
  if (typeof window === "undefined") return

  console.log("🔍 Initializing global analytics session...")
  
  // Force session creation by tracking a page view
  // This ensures every visitor gets a proper session
  analytics.trackEvent("session_started", {
    page: window.location.pathname,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  })
  
  console.log("✅ Global analytics session initialized")
}

// Export analytics for consistent usage across the app
export { analytics }
export default initializeGlobalAnalytics 