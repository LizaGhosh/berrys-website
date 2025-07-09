// Google Analytics 4 tracking setup
declare global {
  interface Window {
    gtag: (...args: any[]) => void
    dataLayer: any[]
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_TRACKING_ID

// Initialize Google Analytics
export const initGA = () => {
  if (!GA_TRACKING_ID) return

  // Load gtag script
  const script1 = document.createElement("script")
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`
  document.head.appendChild(script1)

  // Initialize gtag
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer.push(arguments)
  }
  window.gtag("js", new Date())
  window.gtag("config", GA_TRACKING_ID, {
    // Enhanced measurement (automatic tracking)
    enhanced_measurement: true,
    // Track page views automatically
    page_title: document.title,
    page_location: window.location.href,
  })
}

// Track custom events
export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (!GA_TRACKING_ID || !window.gtag) return

  window.gtag("event", eventName, {
    event_category: "engagement",
    event_label: parameters?.label,
    value: parameters?.value,
    ...parameters,
  })
}

// Track conversions (signups, demo requests)
export const trackConversion = (conversionName: string, parameters?: Record<string, any>) => {
  if (!GA_TRACKING_ID || !window.gtag) return

  window.gtag("event", "conversion", {
    send_to: GA_TRACKING_ID,
    event_category: "conversion",
    event_label: conversionName,
    ...parameters,
  })
}

// Track page views manually (if needed)
export const trackPageView = (url: string, title?: string) => {
  if (!GA_TRACKING_ID || !window.gtag) return

  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
    page_title: title,
  })
}

// E-commerce tracking (for subscription plans)
export const trackPurchase = (transactionId: string, plan: string, value: number) => {
  if (!GA_TRACKING_ID || !window.gtag) return

  window.gtag("event", "purchase", {
    transaction_id: transactionId,
    value: value,
    currency: "USD",
    items: [
      {
        item_id: plan,
        item_name: `berrys.ai ${plan} plan`,
        category: "subscription",
        quantity: 1,
        price: value,
      },
    ],
  })
}
