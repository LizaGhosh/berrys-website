"use client"

import { useEffect } from "react"
import { analytics } from "@/lib/analytics-enhanced"

export function AnalyticsTracker() {
  useEffect(() => {
    // Initialize analytics on every page load
    console.log('🔍 AnalyticsTracker component initialized')
    
    // Track page view with enhanced analytics
    analytics.trackEvent('page_view', {
      page: window.location.pathname,
      title: document.title,
      url: window.location.href
    })
    
    console.log('✅ AnalyticsTracker: Page view tracked')
  }, [])

  // This component doesn't render anything
  return null
}

export default AnalyticsTracker 