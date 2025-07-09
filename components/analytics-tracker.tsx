"use client"

import { useEffect } from "react"
import { initializeGlobalAnalytics } from "@/lib/analytics-init"

export function AnalyticsTracker() {
  useEffect(() => {
    // Initialize analytics on every page load
    initializeGlobalAnalytics()
  }, [])

  // This component doesn't render anything
  return null
}

export default AnalyticsTracker 