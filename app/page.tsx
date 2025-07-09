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

// Calendly widget component
const CalendlyWidget = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (isOpen) {
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

      document.addEventListener('keydown', handleKeyDown)

      return () => {
        document.removeEventListener('keydown', handleKeyDown)
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
    trackEvent("page_loaded", {
      event_category: "page_interaction",
      event_label: "home_page",
    })
  }, [])

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan)
    setShowSignup(true)

    // Track plan selection
    trackEvent("plan_selected", {
      event_category: "conversion_funnel",
      event_label: plan,
      plan_type: plan,
    })
  }

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault()
    setShowSignup(false)
    setShowWelcome(true)

    // Track successful signup
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
  }

  const handleBookCall = (source: string) => {
    setShowCalendly(true)

    // Track demo request
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
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <span className="text-xl font-semibold text-white">berrys.ai</span>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#features"
                className="text-gray-300 hover:text-white transition-colors"
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
                className="text-gray-300 hover:text-white transition-colors"
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
                className="text-gray-300 hover:text-white transition-colors"
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
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Book Demo
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI co-pilot for founders</span>
            </div>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">Perfect your pitch.</h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Get instant feedback on your presentation content, delivery, and style. berrys.ai is the AI co-pilot for
            founders.
          </p>

          <Button
            onClick={() => handleBookCall("hero")}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg rounded-lg inline-flex items-center space-x-2"
          >
            <span>Schedule a demo</span>
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">Transform your pitch with AI</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            berrys.ai's real-time analysis and AI feedback helps founders identify weak points and transform their
            presentations into funding magnets.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800"
        onMouseEnter={() => handleSectionView("features")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Brain className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Content Intelligence</h3>
              <p className="text-gray-400 leading-relaxed">
                AI analyzes your pitch structure, messaging clarity, and storytelling flow for maximum investor impact.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Delivery Mastery</h3>
              <p className="text-gray-400 leading-relaxed">
                Real-time feedback on pacing, tone, and confidence levels to perfect your presentation style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Instant Optimization</h3>
              <p className="text-gray-400 leading-relaxed">
                Get actionable suggestions to immediately enhance your pitch and increase funding success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">How it works</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See how berrys.ai analyzes pitches and provides detailed feedback to help founders improve
            </p>
          </div>

          <div className="bg-gray-900 rounded-2xl p-8 md:p-12 border border-gray-800">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="bg-gray-800 rounded-xl overflow-hidden mb-6 border border-gray-700">
                  <div className="aspect-video bg-gray-700 flex items-center justify-center relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-blue-600/20"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                      <p className="text-white font-medium">Demo Pitch Analysis</p>
                      <p className="text-gray-300 text-sm">See how berrys.ai analyzes a real pitch</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h4 className="text-white font-semibold mb-3">Sample Pitch: BlipMate</h4>
                  <div className="text-gray-300 text-sm leading-relaxed space-y-2">
                    <p>"Hi, I'm Liza, co-founder of BlipMate.</p>
                    <p>Every week, teams waste hours rehashing meetings—who said what, who's doing what next.</p>
                    <p>
                      BlipMate solves that by using AI to join your meetings, summarize discussions in real time, and
                      send action items directly to Slack or email.
                    </p>
                    <p>
                      In just 4 weeks, 25 teams have joined our beta, with a 90% retention rate. One founder told us
                      it's like having a Chief of Staff on every call.
                    </p>
                    <p>
                      We're now raising a pre-seed round to expand our integrations and bring BlipMate to more remote
                      teams."
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Voice Analysis</h4>
                    <span className="text-purple-400 text-sm">3 categories</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-gray-300 text-sm font-medium">Volume</span>
                          <span className="ml-auto text-green-400 font-semibold">8.0</span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Audible and clear, comes across confident but not forceful.
                        </p>
                        <p className="text-purple-300 text-xs mt-1">
                          💡 Add slight projection on key phrases like 'real time' and 'AI'...
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-gray-300 text-sm font-medium">Pace</span>
                          <span className="ml-auto text-green-400 font-semibold">8.0</span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          Good pacing due to short sentences, but lacks strategic pauses.
                        </p>
                        <p className="text-purple-300 text-xs mt-1">
                          💡 Insert pauses after major phrases like 'Chief of Staff'...
                        </p>
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-gray-500 text-xs">...</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Content Structure</h4>
                    <span className="text-green-400 font-semibold">9.0</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-gray-400 text-xs">Logical flow: problem → solution → traction → quote → ask.</p>
                    <p className="text-purple-300 text-xs">
                      💡 Add a one-line vision to hint at scale, e.g., 'making meetings 10x more efficient.'
                    </p>

                    <div className="text-center mt-3">
                      <span className="text-gray-500 text-xs">...</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 h-full flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-white">Body Language</h4>
                    <span className="text-yellow-400 text-sm">3 categories</span>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-1">
                          <span className="text-gray-300 text-sm font-medium">Eye Contact</span>
                          <span className="ml-auto text-yellow-400 font-semibold">6.0</span>
                        </div>
                        <p className="text-gray-400 text-xs">
                          May break contact at transitions or rely on memory aids.
                        </p>
                        <p className="text-purple-300 text-xs mt-1">
                          💡 Practice keeping eye contact during transitions. Anchor gaze when delivering value
                          points...
                        </p>
                      </div>
                    </div>

                    <div className="text-center flex-1 flex items-end justify-center">
                      <span className="text-gray-500 text-xs">...</span>
                    </div>
                  </div>
                </div>

                <div className="text-center mt-4">
                  <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full"></div>
                    <span className="text-xs ml-2">8 more categories analyzed</span>
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
        className="py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800"
        onMouseEnter={() => handleSectionView("testimonials")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Loved by founders</h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              See how berrys.ai has helped founders secure millions in funding
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-300 mb-6 leading-relaxed">
                  "berrys.ai helped me restructure my entire pitch flow. I was jumping between problem and solution
                  randomly—now I follow a logical narrative that investors actually follow. My ask is 3x clearer."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">SM</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">S.M.</div>
                    <div className="text-gray-400 text-sm">Tech startup founder, San Francisco</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-300 mb-6 leading-relaxed">
                  "I was focusing on technical features instead of business impact. berrys.ai taught me to lead with
                  outcomes investors care about—revenue potential, market size, competitive advantage."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">MR</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">M.R.</div>
                    <div className="text-gray-400 text-sm">B2B SaaS founder, Austin</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="p-6">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                  ))}
                </div>
                <blockquote className="text-gray-300 mb-6 leading-relaxed">
                  "My delivery was too rushed and monotone. The AI caught vocal patterns I never noticed—now I use
                  strategic pauses and vary my tone to emphasize key points. Much more engaging."
                </blockquote>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-semibold text-sm">AL</span>
                  </div>
                  <div>
                    <div className="font-semibold text-white">A.L.</div>
                    <div className="text-gray-400 text-sm">Fintech co-founder, New York</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
            <div>
              <div className="text-3xl font-bold text-white mb-2">500+</div>
              <div className="text-gray-400">Founders Helped</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">$50M+</div>
              <div className="text-gray-400">Funding Raised</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-400">Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white mb-2">4.9/5</div>
              <div className="text-gray-400">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        className="py-24 px-4 sm:px-6 lg:px-8 border-t border-gray-800"
        onMouseEnter={() => handleSectionView("pricing")}
      >
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Simple pricing</h2>
            <p className="text-xl text-gray-400">Start free, then choose the plan that works for you</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Trial */}
            <Card className="bg-gray-900 border-gray-800 relative">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl font-semibold text-white">Free Trial</CardTitle>
                <CardDescription className="text-gray-400">Perfect for getting started</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">Free</span>
                  <span className="text-gray-400 ml-2">for 2 months</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Unlimited pitch analysis</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">AI feedback on content & delivery</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Basic improvement suggestions</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  onClick={() => handlePlanSelect("free")}
                >
                  Start Free Trial
                </Button>
              </CardFooter>
            </Card>

            {/* Monthly Plan */}
            <Card className="bg-gray-900 border-purple-600 relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-600 text-white px-3 py-1 text-xs">Most Popular</Badge>
              </div>
              <CardHeader className="text-center pb-6 pt-8">
                <CardTitle className="text-xl font-semibold text-white">Monthly</CardTitle>
                <CardDescription className="text-gray-400">For regular pitch practice</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$5</span>
                  <span className="text-gray-400 ml-2">/month</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Everything in Free Trial</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Advanced analytics dashboard</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Progress tracking over time</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Priority support</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handlePlanSelect("monthly")}
                >
                  Choose Monthly
                </Button>
              </CardFooter>
            </Card>

            {/* Annual Plan */}
            <Card className="bg-gray-900 border-gray-800 relative">
              <div className="absolute -top-3 right-4">
                <Badge className="bg-green-600 text-white px-2 py-1 text-xs">Save 50%</Badge>
              </div>
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-xl font-semibold text-white">Annual</CardTitle>
                <CardDescription className="text-gray-400">Best value for serious founders</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$30</span>
                  <span className="text-gray-400 ml-2">/year</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Everything in Monthly</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Exclusive pitch templates</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">1-on-1 coaching session</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-400 mr-3 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">Early access to new features</span>
                </div>
              </CardContent>
              <CardFooter className="pt-6">
                <Button
                  className="w-full bg-gray-800 hover:bg-gray-700 text-white"
                  onClick={() => handlePlanSelect("annual")}
                >
                  Choose Annual
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">B</span>
            </div>
            <span className="text-xl font-semibold text-white">berrys.ai</span>
          </div>
          <p className="text-gray-400">© 2024 berrys.ai. All rights reserved.</p>
        </div>
      </footer>

      {/* Calendly Widget */}
      <CalendlyWidget isOpen={showCalendly} onClose={() => setShowCalendly(false)} />

      {/* Signup Modal */}
      <Dialog open={showSignup} onOpenChange={setShowSignup}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Join berrys.ai</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedPlan === "free" && "Start your free 2-month trial"}
              {selectedPlan === "monthly" && "Subscribe to Monthly Plan - $5/month"}
              {selectedPlan === "annual" && "Subscribe to Annual Plan - $30/year"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-gray-300">
                Full Name
              </Label>
              <Input
                id="name"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-300">
                City
              </Label>
              <Input
                id="city"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-gray-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="mt-1 bg-gray-800 border-gray-700 text-white"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2">
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Welcome Modal */}
      <Dialog open={showWelcome} onOpenChange={setShowWelcome}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-800 text-center">
          <DialogHeader>
            <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-semibold text-white">Welcome to berrys.ai!</DialogTitle>
            <DialogDescription className="text-gray-400 leading-relaxed mt-4">
              Thank you for your interest! We're currently working on scaling our product and would be delighted to
              welcome you as one of our early users.
              <br />
              <br />
              We'll reach out to you soon with exclusive early access and special founder benefits.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => setShowWelcome(false)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 mt-4"
          >
            Got it!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
