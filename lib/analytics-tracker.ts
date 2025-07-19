import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Analytics tracking class
export class AnalyticsTracker {
  private sessionId: string
  private visitorId: string
  private startTime: number
  private sectionTimers: Map<string, number> = new Map()
  private currentSection: string = 'hero'
  private isTracking: boolean = false
  private version: string = '3.0.0' // Simplified version - only analytics_events and users tables

  constructor() {
    this.sessionId = this.generateSessionId()
    this.visitorId = this.getOrCreateVisitorId()
    this.startTime = Date.now()
    console.log('🚀 AnalyticsTracker v3.0.0 initialized - simplified schema (analytics_events + users only)')
    this.initTracking()
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }

  private getOrCreateVisitorId(): string {
    let visitorId = localStorage.getItem('berrys_visitor_id')
    if (!visitorId) {
      visitorId = 'visitor_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
      localStorage.setItem('berrys_visitor_id', visitorId)
    }
    return visitorId
  }

  private async sendEvent(eventType: string, data: any) {
    try {
      // Get current time in PDT
      const now = new Date()
      const pdtTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
      
      const event = {
        session_id: this.sessionId,
        visitor_id: this.visitorId,
        event_type: eventType,
        event_data: data,
        timestamp: pdtTime.toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
      }

      console.log('📊 Sending analytics event:', eventType, event)
      
      const { data: result, error } = await supabase.from('analytics_events').insert(event)
      
      if (error) {
        console.error('❌ Analytics error:', error)
      } else {
        console.log('✅ Analytics event sent successfully:', eventType)
      }

      // Form submissions are now derived from analytics_events via views
      if (eventType === 'form_submit' || eventType === 'form_completed' || eventType === 'signup_completed') {
        console.log('🎯 Form event detected - will be available in form_submissions_view')
      }
    } catch (error) {
      console.error('❌ Analytics error:', error)
    }
  }



  private initTracking() {
    if (this.isTracking) return
    this.isTracking = true

    // Track page load
    this.trackPageView()

    // Track scroll depth
    this.trackScrollDepth()

    // Track section visibility
    this.trackSectionVisibility()

    // Track interactions
    this.trackInteractions()

    // Track video analytics
    this.trackVideoAnalytics()

    // Track form interactions
    this.trackFormInteractions()

    // Track session end
    window.addEventListener('beforeunload', () => {
      this.trackSessionEnd()
    })
  }

  private trackPageView() {
    this.sendEvent('page_view', {
      page: 'homepage',
      title: document.title
    })
  }

  private trackScrollDepth() {
    let maxScroll = 0
    let lastScrollTime = Date.now()

    window.addEventListener('scroll', () => {
      const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
      
      if (scrollPercent > maxScroll) {
        maxScroll = scrollPercent
        this.sendEvent('scroll_depth', { depth: scrollPercent })
      }

      // Track scroll rate
      const now = Date.now()
      if (now - lastScrollTime > 1000) { // Debounce to 1 second
        this.sendEvent('scroll_rate', { 
          scrolls_per_minute: 60 / ((now - lastScrollTime) / 1000)
        })
        lastScrollTime = now
      }
    })
  }

  private trackSectionVisibility() {
    const sections = [
      { id: 'hero', selector: '#hero' },
      { id: 'features', selector: '#features' },
      { id: 'demo', selector: '#demo' },
      { id: 'pricing', selector: '#pricing' },
      { id: 'footer', selector: 'footer' }
    ]

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const sectionId = entry.target.id || entry.target.tagName.toLowerCase()
        
        if (entry.isIntersecting) {
          this.sectionTimers.set(sectionId, Date.now())
          this.currentSection = sectionId
          this.sendEvent('section_view', { 
            section: sectionId,
            time_spent_previous: this.getTimeSpentInPreviousSection()
          })
        } else {
          const timeSpent = this.getTimeSpentInSection(sectionId)
          if (timeSpent > 0) {
            this.sendEvent('section_exit', { 
              section: sectionId,
              time_spent: timeSpent
            })
          }
        }
      })
    }, { threshold: 0.5 })

    sections.forEach(section => {
      const element = document.querySelector(section.selector)
      if (element) observer.observe(element)
    })
  }

  private getTimeSpentInSection(sectionId: string): number {
    const startTime = this.sectionTimers.get(sectionId)
    if (!startTime) return 0
    return Date.now() - startTime
  }

  private getTimeSpentInPreviousSection(): number {
    const sections = ['hero', 'features', 'demo', 'pricing', 'footer']
    const currentIndex = sections.indexOf(this.currentSection)
    if (currentIndex <= 0) return 0
    
    const previousSection = sections[currentIndex - 1]
    return this.getTimeSpentInSection(previousSection)
  }

  private trackInteractions() {
    // Track button clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button') as HTMLButtonElement
        this.sendEvent('button_click', {
          button_text: button.textContent?.trim(),
          button_id: button.id,
          button_class: button.className,
          section: this.currentSection
        })
      }
    })

    // Track link clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' || target.closest('a')) {
        const link = target.tagName === 'A' ? target : target.closest('a') as HTMLAnchorElement
        this.sendEvent('link_click', {
          link_text: link.textContent?.trim(),
          link_href: (link as HTMLAnchorElement).href,
          link_id: link.id,
          section: this.currentSection
        })
      }
    })

    // Track hover events on key elements
    const keyElements = document.querySelectorAll('button, a, .feature-card, .pricing-card')
    keyElements.forEach(element => {
      element.addEventListener('mouseenter', () => {
        this.sendEvent('element_hover', {
          element_type: element.tagName.toLowerCase(),
          element_id: element.id,
          element_class: element.className,
          section: this.currentSection
        })
      })
    })
  }

  private trackVideoAnalytics() {
    // YouTube iframe API integration
    const videoElement = document.querySelector('iframe[src*="youtube.com"]')
    if (videoElement) {
      // Track video load
      this.sendEvent('video_load', {
        video_id: this.extractVideoId(videoElement.getAttribute('src') || ''),
        section: 'demo'
      })

      // Track video interactions (requires YouTube API)
      this.initYouTubeTracking()
    }
  }

  private extractVideoId(url: string): string {
    const match = url.match(/[?&]v=([^&]+)/)
    return match ? match[1] : ''
  }

  private initYouTubeTracking() {
    // YouTube iframe API tracking
    // This would require YouTube API integration
    // For now, we'll track basic video presence
    this.sendEvent('video_present', {
      video_type: 'youtube',
      section: 'demo'
    })
  }

  private trackFormInteractions() {
    const forms = document.querySelectorAll('form')
    forms.forEach(form => {
      const formId = form.id || 'unknown_form'
      
      // Track form start
      form.addEventListener('submit', (e) => {
        // Don't prevent default - let the form submit normally
        // But track the submission
        const formData = this.getFormData(form as HTMLFormElement)
        this.sendEvent('form_submit', {
          form_id: formId,
          form_data: formData,
          section: this.currentSection,
          form_type: formId.includes('signup') ? 'signup' : 'contact'
        })
      })

      // Track form field interactions
      const inputs = form.querySelectorAll('input, textarea, select')
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          this.sendEvent('form_field_focus', {
            form_id: formId,
            field_name: (input as HTMLInputElement).name,
            field_type: (input as HTMLInputElement).type,
            section: this.currentSection
          })
        })

        input.addEventListener('blur', () => {
          this.sendEvent('form_field_blur', {
            form_id: formId,
            field_name: (input as HTMLInputElement).name,
            field_type: (input as HTMLInputElement).type,
            section: this.currentSection
          })
        })
      })
    })
  }

  private getFormData(form: HTMLFormElement): any {
    const formData = new FormData(form)
    const data: any = {}
    for (let [key, value] of formData.entries()) {
      data[key] = value
    }
    return data
  }

  private trackSessionEnd() {
    const sessionDuration = Date.now() - this.startTime
    this.sendEvent('session_end', {
      duration: sessionDuration,
      sections_visited: Array.from(this.sectionTimers.keys()),
      total_sections: this.sectionTimers.size
    })
  }

  // Public methods for manual tracking
  public trackCustomEvent(eventName: string, data: any) {
    this.sendEvent(eventName, data)
  }

  public trackConversion(conversionType: string, value?: number) {
    this.sendEvent('conversion', {
      type: conversionType,
      value: value,
      section: this.currentSection
    })
  }

  public trackError(error: Error, context?: string) {
    this.sendEvent('error', {
      message: error.message,
      stack: error.stack,
      context: context,
      section: this.currentSection
    })
  }
}

// Initialize analytics tracker
export const analytics = new AnalyticsTracker() 