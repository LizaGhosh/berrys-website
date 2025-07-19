"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CheckCircle, Play, Star, ArrowRight, X, TrendingUp, Target, Brain } from "lucide-react"
import { trackEvent, trackConversion, trackPurchase } from "@/lib/google-analytics"
import { analytics } from "@/lib/analytics-enhanced"

// Calendly widget component
const CalendlyWidget = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [calendlyKey, setCalendlyKey] = useState(0)

  useEffect(() => {
    if (isOpen) {
      // Increment key to force remount
      setCalendlyKey(prev => prev + 1)
      
      // Track Calendly widget opened
      analytics.trackEvent("calendly_widget_opened", {
        event_category: "engagement",
        event_label: "demo_booking",
      })
      
      trackEvent("calendly_widget_opened", {
        event_category: "engagement",
        event_label: "demo_booking",
      })

      // Prevent background scrolling on mobile
      document.body.style.overflow = 'hidden'

      // Load Calendly script if not already loaded
      if (!document.querySelector('script[src*="calendly.com"]')) {
        const script = document.createElement("script")
        script.src = "https://assets.calendly.com/assets/external/widget.js"
        script.async = true
        document.body.appendChild(script)
      }

      // Force Calendly to re-initialize after a short delay
      setTimeout(() => {
        if (typeof window !== 'undefined' && (window as any).Calendly) {
          // Force Calendly to re-initialize all widgets
          (window as any).Calendly.initInlineWidget({
            url: 'https://calendly.com/recruiter-berrys-ai/30min?primary_color=7c3aed&text_color=000000&background_color=ffffff',
            parentElement: document.querySelector(`[key="${calendlyKey}"]`) || document.querySelector('.calendly-inline-widget')
          })
        }
      }, 100)

      // Add keyboard support for Escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          trackEvent("calendly_widget_closed", {
            event_category: "engagement",
            event_label: "demo_booking_abandoned",
          })
          onClose()
        }
      }

      document.addEventListener("keydown", handleKeyDown)

      return () => {
        document.removeEventListener("keydown", handleKeyDown)
        // Restore background scrolling
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 flex items-start md:items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          trackEvent("calendly_widget_closed", {
            event_category: "engagement",
            event_label: "demo_booking_abandoned",
          })
          onClose()
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl min-h-[95vh] md:h-[80vh] relative overflow-hidden my-2 md:my-auto flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex-1 pr-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Book Your Demo with berrys.ai</h3>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Choose a time that works for you</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              trackEvent("calendly_widget_closed", {
                event_category: "engagement",
                event_label: "demo_booking_abandoned",
              })
              onClose()
            }}
            className="rounded-full hover:bg-gray-100 border border-gray-300 bg-white shadow-sm min-w-[44px] min-h-[44px] flex-shrink-0"
          >
            <X className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
        <div className="flex-1 overflow-hidden p-2 sm:p-4">
          <div
            key={calendlyKey}
            className="calendly-inline-widget w-full h-full"
            data-url="https://calendly.com/recruiter-berrys-ai/30min?primary_color=7c3aed&text_color=000000&background_color=ffffff"
            style={{ minWidth: "280px", height: "70vh", minHeight: "500px" }}
          ></div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showSignup, setShowSignup] = useState(false)
  const [showWelcome, setShowWelcome] = useState(false)
  const [showCalendly, setShowCalendly] = useState(false)
  const [formData, setFormData] = useState({ name: "", city: "", email: "" })

  // Track initial page load
  useEffect(() => {
    console.log('🔍 HomePage: Initializing analytics tracking...')
    
    // Google Analytics tracking
    trackEvent("page_loaded", {
      event_category: "page_interaction",
      event_label: "home_page",
    })

    // Database tracking
    analytics.trackEvent("page_loaded", {
      page: "home",
      timestamp: new Date().toISOString(),
    })
    
    console.log('✅ HomePage: Analytics tracking initialized')
  }, [])

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan)
    setShowSignup(true)

    // Track plan button click
    analytics.trackButtonClick(`${plan}_plan_button`, {
      plan: plan,
      plan_type: plan,
    })

    // Track form start
    analytics.trackFormStart(`${plan}_signup_form`, {
      plan: plan,
      plan_type: plan,
    })

    // Track plan selection in Google Analytics
    trackEvent("plan_selected", {
      event_category: "conversion_funnel",
      event_label: plan,
      plan_type: plan,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Track form completion
      await analytics.trackFormComplete(`${selectedPlan}_signup_form`, {
        plan: selectedPlan,
        plan_type: selectedPlan,
      })

      // Store user in database using enhanced analytics
      await analytics.trackSignup({
        name: formData.name,
        city: formData.city,
        email: formData.email,
        selected_plan: selectedPlan!,
        signup_source: "pricing_section",
      })

      setShowSignup(false)
      setShowWelcome(true)

      // Track successful signup for Google Analytics
      trackConversion("signup_completed", {
        plan: selectedPlan,
        user_city: formData.city,
        conversion_value: selectedPlan === "annual" ? 30 : selectedPlan === "monthly" ? 5 : 0,
      })

      // Track as purchase if paid plan
      if (selectedPlan === "monthly" || selectedPlan === "annual") {
        const value = selectedPlan === "annual" ? 30 : 5
        trackPurchase(`signup_${Date.now()}`, selectedPlan, value)
      }
    } catch (error) {
      console.error("Signup error:", error)
      // Still show success to user even if tracking fails
      setShowSignup(false)
      setShowWelcome(true)
    }
  }

  const handleBookCall = (source: string) => {
    setShowCalendly(true)

    // Track demo button click
    analytics.trackButtonClick("demo_button", {
      source: source,
      button_location: source,
    })

    // Track demo request in Google Analytics
    trackConversion("demo_requested", {
      source: source,
      event_category: "lead_generation",
      event_label: `demo_from_${source}`,
    })
  }

  const handleSectionView = (section: string) => {
    trackEvent("section_viewed", {
      event_category: "page_interaction",
      event_label: section,
      section_name: section,
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white relative">
      {/* Header */}
      <header className="border-b border-slate-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center border border-slate-700/50">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-semibold text-slate-100">berrys.ai</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
                onClick={() => {
                  trackEvent("nav_click", {
                    event_category: "navigation",
                    event_label: "features",
                  })
                }}
              >
                Features
              </a>
              <a
                href="#testimonials"
                className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
                onClick={() => {
                  trackEvent("nav_click", {
                    event_category: "navigation",
                    event_label: "testimonials",
                  })
                }}
              >
                Testimonials
              </a>
              <a
                href="#pricing"
                className="text-slate-400 hover:text-slate-200 transition-colors duration-200"
                onClick={() => {
                  trackEvent("nav_click", {
                    event_category: "navigation",
                    event_label: "pricing",
                  })
                }}
              >
                Pricing
              </a>
              <Button
                onClick={() => handleBookCall("header")}
                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg border border-slate-700/50 transition-all duration-200 hover:shadow-lg hover:shadow-violet-900/20"
              >
                Book Demo
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-slate-950 to-slate-900/30"></div>
        
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Visual Status Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 text-sm text-slate-400 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800/50 backdrop-blur-sm">
              <div className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></div>
              <span>AI co-pilot for founders</span>
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold text-slate-100 mb-4 leading-tight tracking-tight">Perfect your pitch.</h1>
          
          {/* Visual Process Flow */}
          <div className="flex items-center justify-center space-x-4 mb-8 text-sm text-slate-400">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                <span className="text-slate-300 font-medium">1</span>
              </div>
              <span>Record or upload</span>
            </div>
            <div className="w-6 h-px bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                <Brain className="w-4 h-4 text-slate-300" />
              </div>
              <span>AI analyzes</span>
            </div>
            <div className="w-6 h-px bg-slate-700"></div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-slate-800/50 rounded-full flex items-center justify-center border border-slate-700/50">
                <TrendingUp className="w-4 h-4 text-slate-300" />
              </div>
              <span>Get feedback</span>
            </div>
          </div>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant feedback on your pitch content, delivery, and style. berrys.ai is the AI co-pilot for
            founders.
          </p>

          {/* Enhanced CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              onClick={() => handleBookCall("hero")}
              className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-8 py-4 text-lg rounded-lg inline-flex items-center space-x-2 w-full sm:w-auto shadow-lg shadow-violet-900/25 border border-slate-700/50 transition-all duration-200 hover:shadow-xl hover:shadow-violet-900/30"
            >
              <span>Schedule a demo</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
            
            <Button
              onClick={() => handlePlanSelect("free")}
              variant="outline"
              className="border-2 border-violet-800/60 hover:border-violet-700/80 text-slate-200 hover:text-violet-300 px-8 py-4 text-lg rounded-lg inline-flex items-center space-x-2 w-full sm:w-auto relative overflow-hidden group bg-slate-900/30 backdrop-blur-sm transition-all duration-200"
            >
              <div className="absolute inset-0 bg-violet-900/20 group-hover:bg-violet-900/30 transition-colors duration-200"></div>
              <div className="relative flex items-center space-x-2">
                <span>Start Free Trial</span>
                <div className="bg-violet-600 text-white px-2 py-1 rounded text-xs font-bold">
                  2 MONTHS FREE
                </div>
              </div>
            </Button>
          </div>


        </div>
      </section>

      {/* Features Section - Elevated for First Page View */}
      <section
        id="features"
        className="py-6 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50"
        onMouseEnter={() => handleSectionView("features")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
                <Brain className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Content Intelligence</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                AI analyzes your pitch structure, messaging clarity, and storytelling flow for maximum impact.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
                <TrendingUp className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Delivery Mastery</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Real-time feedback on pacing, tone, and confidence levels to perfect your pitch delivery.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center mx-auto mb-3 border border-slate-700/50">
                <Target className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-200 mb-2">Instant Optimization</h3>
              <p className="text-slate-400 leading-relaxed text-sm">
                Get actionable suggestions to immediately enhance your pitch and increase success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6 tracking-tight">How it works</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See how berrys.ai analyzes pitches and provides detailed feedback to help founders improve
            </p>
          </div>

          <div className="space-y-8">
            {/* Video Section */}
            <div className="bg-slate-900/30 rounded-lg p-8 border border-slate-800/50 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <div className="bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700/50">
                  <div className="aspect-video relative w-full">
                    <iframe 
                      className="absolute inset-0 w-full h-full"
                      src="https://www.youtube.com/embed/7a_lu7ilpnI?start=100" 
                      title="Best STARTUP PITCH ever. Silicon Valley." 
                      frameBorder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                      referrerPolicy="strict-origin-when-cross-origin" 
                      allowFullScreen
                      onLoad={() => {
                        analytics.trackEvent("video_loaded", {
                          video_source: "youtube",
                          video_title: "Best STARTUP PITCH ever. Silicon Valley."
                        })
                      }}
                    ></iframe>
                  </div>
                </div>


              </div>
            </div>

            {/* Analysis Section */}
            <div className="bg-slate-900/30 rounded-lg p-8 border border-slate-800/50 backdrop-blur-sm">
              <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-slate-100 mb-2">AI Analysis Results</h3>
                  <p className="text-slate-400">Detailed feedback on voice, content, and body language</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-200 text-lg">Voice Analysis</h4>
                      <div className="text-slate-400 text-sm">Overall: 8.0/10</div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm font-medium">Volume</span>
                          <span className="text-violet-400 font-semibold">7.5/10</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Good projection and clear articulation. Maintains consistent volume throughout.
                        </p>
                      </div>

                      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm font-medium">Pace</span>
                          <span className="text-violet-400 font-semibold">8.5/10</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Excellent pacing with strategic pauses. Good use of silence for emphasis.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-200 text-lg">Content Structure</h4>
                      <span className="text-violet-400 font-semibold">9.5/10</span>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                        <p className="text-slate-400 text-sm leading-relaxed mb-3">
                          Perfect problem → solution → market → traction → ask flow. Strong market size presentation. Excellent use of social proof and traction metrics. Clear ask with specific funding amount.
                        </p>
                        
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-amber-300 text-sm">💡</span>
                            <p className="text-amber-300 text-sm">
                              Could add more specific competitive advantages, e.g., "Our proprietary AI algorithm processes data 3x faster than competitors"
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-amber-300 text-sm">💡</span>
                            <p className="text-amber-300 text-sm">
                              Might benefit from a one-line vision statement, e.g., "We're building the future of AI-powered productivity"
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-200 text-lg">Body Language</h4>
                      <div className="text-slate-400 text-sm">Overall: 8.5/10</div>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm font-medium">Eye Contact</span>
                          <span className="text-violet-400 font-semibold">8.5/10</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Maintains strong, confident eye contact. Good engagement with audience.
                        </p>
                      </div>

                      <div className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-slate-300 text-sm font-medium">Gestures</span>
                          <span className="text-violet-400 font-semibold">8.0/10</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          Uses purposeful hand gestures to emphasize points. Good use of space and movement.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-200 text-lg">Summary</h4>
                      <div className="text-violet-400 text-sm">Strong Performance</div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h5 className="text-slate-300 text-sm font-medium mb-2">Key Strengths</h5>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-violet-400 text-sm">✓</span>
                            <p className="text-slate-400 text-sm">Perfect pitch structure & strong opening hook</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-violet-400 text-sm">✓</span>
                            <p className="text-slate-400 text-sm">Clear value proposition & excellent data usage</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-violet-400 text-sm">✓</span>
                            <p className="text-slate-400 text-sm">Confident delivery with strategic pauses</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h5 className="text-slate-300 text-sm font-medium mb-2">Areas for Improvement</h5>
                        <div className="space-y-2">
                          <div className="flex items-start space-x-2">
                            <span className="text-amber-400 text-sm">💡</span>
                            <p className="text-slate-400 text-sm">Add specific competitive advantages & vision statement</p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <span className="text-amber-400 text-sm">💡</span>
                            <p className="text-slate-400 text-sm">Include more use cases or customer testimonials</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-8">
                  <div className="flex items-center justify-center space-x-2 text-slate-500">
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-600 rounded-full"></div>
                    <span className="text-sm ml-2">8 more categories analyzed</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section
        id="testimonials"
        className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50"
        onMouseEnter={() => handleSectionView("testimonials")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6 tracking-tight">Loved by founders</h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              See how berrys.ai has helped founders close deals and secure partnerships
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-slate-300 mb-6 leading-relaxed">
                  "berrys.ai helped me restructure my entire pitch flow. I was jumping between problem and solution
                  randomly—now I follow a logical narrative that investors actually follow. My ask is 3x clearer."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3">
                    <span className="text-slate-200 font-semibold text-sm">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">S.M.</div>
                    <div className="text-slate-400 text-sm">Tech startup founder, San Francisco</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-slate-300 mb-6 leading-relaxed">
                  "I was focusing on technical features instead of business impact. berrys.ai taught me to lead with
                  outcomes investors care about—revenue potential, market size, competitive advantage."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3">
                    <span className="text-slate-200 font-semibold text-sm">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">M.R.</div>
                    <div className="text-slate-400 text-sm">B2B SaaS founder, Austin</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/30 border-slate-800/50 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-slate-300 mb-6 leading-relaxed">
                  "My delivery was too rushed and monotone. The AI caught vocal patterns I never noticed—now I use
                  strategic pauses and vary my tone to emphasize key points. Much more engaging."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center mr-3">
                    <span className="text-slate-200 font-semibold text-sm">AL</span>
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">A.L.</div>
                    <div className="text-slate-400 text-sm">Fintech co-founder, New York</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <div className="text-3xl font-bold text-slate-100 mb-2">100+</div>
              <div className="text-slate-400">Founders Helped</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-100 mb-2">$50M+</div>
              <div className="text-slate-400">Funding Raised</div>
            </div>

            <div>
              <div className="text-3xl font-bold text-slate-100 mb-2">4.9/5</div>
              <div className="text-slate-400">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-800/50"
        onMouseEnter={() => handleSectionView("pricing")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-6 tracking-tight">Simple pricing</h2>
            <p className="text-xl text-slate-400">Start free, then choose the plan that works for you</p>
          </div>

          {/* Pricing Table */}
          <div className="mt-8">
            
            <div className="bg-slate-900/30 rounded-lg border border-slate-800/50 backdrop-blur-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/50">
                    <tr>
                      <th className="text-left p-6 text-slate-200 font-semibold">Features</th>
                      <th className="text-center p-6">
                        <div className="text-slate-100 font-semibold text-lg">Free Trial</div>
                        <div className="text-slate-400 text-sm">Perfect for getting started</div>
                        <div className="mt-2 flex items-center justify-center space-x-2">
                          <span className="text-2xl font-bold text-slate-100">Free</span>
                          <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2 py-1 rounded text-xs font-bold">
                            2 MONTHS
                          </div>
                        </div>
                        <div className="text-violet-400 text-xs mt-1">No credit card required</div>
                      </th>
                      <th className="text-center p-6">
                        <div className="text-slate-100 font-semibold text-lg">Monthly</div>
                        <div className="text-slate-400 text-sm">For regular pitch practice</div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-slate-100">$5</span>
                          <span className="text-slate-400 text-sm">/month</span>
                        </div>
                      </th>
                      <th className="text-center p-6">
                        <div className="text-slate-100 font-semibold text-lg">Annual</div>
                        <div className="text-slate-400 text-sm">Best Value</div>
                        <div className="mt-2">
                          <span className="text-2xl font-bold text-slate-100">$30</span>
                          <span className="text-slate-400 text-sm">/year</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                <tbody className="divide-y divide-slate-800/50">
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Unlimited pitch analysis</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">AI feedback on content & delivery</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Live recording or file upload</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Basic improvement suggestions</td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Advanced analytics dashboard</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Progress tracking over time</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Exclusive pitch templates</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/20 transition-colors">
                    <td className="p-4 text-slate-300 font-medium">Early access to new features</td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-slate-500">—</span>
                    </td>
                    <td className="p-4 text-center">
                      <CheckCircle className="w-5 h-5 text-violet-400 mx-auto" />
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-slate-800/30">
                  <tr>
                    <td className="p-4"></td>
                    <td className="p-4 text-center">
                      <Button
                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-violet-500/25 transition-all duration-200"
                        onClick={() => handlePlanSelect("free")}
                      >
                        Start 2-Month Free Trial
                      </Button>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 transition-all duration-200 border border-slate-600/50"
                        onClick={() => handlePlanSelect("monthly")}
                      >
                        Choose Monthly
                      </Button>
                    </td>
                    <td className="p-4 text-center">
                      <Button
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700/50 transition-all duration-200"
                        onClick={() => handlePlanSelect("annual")}
                      >
                        Choose Annual
                      </Button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center border border-slate-700/50">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-semibold text-slate-100">berrys.ai</span>
          </div>
          <p className="text-slate-400 mb-4">© 2024 berrys.ai. All rights reserved.</p>
          <div className="flex justify-center">
            <a 
              href="https://www.linkedin.com/company/berrys-ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-violet-400 transition-colors duration-200"
              onClick={() => {
                trackEvent("social_link_click", {
                  event_category: "social",
                  event_label: "linkedin",
                })
              }}
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>

      {/* Calendly Widget */}
      <CalendlyWidget isOpen={showCalendly} onClose={() => setShowCalendly(false)} />

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-slate-100">Join berrys.ai</DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedPlan === "free" && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <span>Start your</span>
                    <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-2 py-1 text-xs font-bold">2-MONTH FREE TRIAL</Badge>
                  </div>
                  <p className="text-sm text-violet-400">No credit card required • Cancel anytime</p>
                </div>
              )}
              {selectedPlan === "monthly" && "Subscribe to Monthly Plan - $5/month"}
              {selectedPlan === "annual" && "Subscribe to Annual Plan - $30/year"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-300">
                Full Name
              </Label>
              <Input
                id="name"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-slate-300">
                City
              </Label>
              <Input
                id="city"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-1 bg-slate-800 border-slate-700 text-slate-100"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2">
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md bg-slate-900 border-slate-800 text-center">
          <DialogHeader>
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-violet-400" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-slate-100">Welcome to berrys.ai!</DialogTitle>
            <DialogDescription className="text-slate-400 leading-relaxed mt-4">
              Thank you for your interest! We're currently working on scaling our product and would be delighted to
              welcome you as one of our early users.
              <br />
              <br />
              We'll reach out to you soon with exclusive early access and special founder benefits.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowWelcome(false)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-100 py-2 mt-4"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
