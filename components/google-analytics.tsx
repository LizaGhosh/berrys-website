"use client"

import { useEffect } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { initGA, trackPageView } from "@/lib/google-analytics"

export function GoogleAnalytics() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Initialize GA on first load
    initGA()
  }, [])

  useEffect(() => {
    // Track page views on route changes
    if (pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "")
      trackPageView(url)
    }
  }, [pathname, searchParams])

  return null
}
