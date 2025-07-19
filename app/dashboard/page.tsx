"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  MousePointer, 
  Scroll, 
  Clock, 
  TrendingUp, 
  Calendar,
  Play,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"

interface AnalyticsData {
  totalVisitors: number
  earlyExits: number
  scrollDepth: {
    hero: number
    features: number
    howItWorks: number
    testimonials: number
    pricing: number
  }
  buttonClicks: {
    demoButton: number
    freeTrial: number
    monthlyPlan: number
    annualPlan: number
  }
  formInteractions: {
    demoFormStarted: number
    demoFormCompleted: number
    freeTrialFormStarted: number
    freeTrialFormCompleted: number
    monthlyFormStarted: number
    monthlyFormCompleted: number
    annualFormStarted: number
    annualFormCompleted: number
  }
  videoInteractions: {
    videoLoaded: number
    videoClicked: number
  }
  sessionMetrics: {
    avgSessionDuration: number
    avgScrollDepth: number
    avgButtonsClicked: number
  }
  conversionRates: {
    demoToSchedule: number
    trialToComplete: number
    monthlyToComplete: number
    annualToComplete: number
  }
}

interface DailySummary {
  date: string
  uniqueVisitors: number
  uniqueDemoClicks: number
  uniqueTrialClicks: number
  uniqueMonthlyClicks: number
  uniqueAnnualClicks: number
  signups: number
  avgSessionDuration: number
}

interface DayDetail {
  time: string
  user: string
  action: string
  value: string
}

export default function DashboardPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [dailySummaries, setDailySummaries] = useState<DailySummary[]>([])
  const [showDayDetails, setShowDayDetails] = useState<string | null>(null)
  const [dayDetails, setDayDetails] = useState<DayDetail[]>([])

  useEffect(() => {
    fetchAnalyticsData()
    // Mock daily summaries
    setDailySummaries([
      {
        date: "2024-07-13",
        uniqueVisitors: 1200,
        uniqueDemoClicks: 140,
        uniqueTrialClicks: 80,
        uniqueMonthlyClicks: 60,
        uniqueAnnualClicks: 30,
        signups: 40,
        avgSessionDuration: 4.1
      },
      {
        date: "2024-07-12",
        uniqueVisitors: 1100,
        uniqueDemoClicks: 120,
        uniqueTrialClicks: 70,
        uniqueMonthlyClicks: 50,
        uniqueAnnualClicks: 25,
        signups: 35,
        avgSessionDuration: 3.8
      },
      {
        date: "2024-07-11",
        uniqueVisitors: 900,
        uniqueDemoClicks: 100,
        uniqueTrialClicks: 60,
        uniqueMonthlyClicks: 40,
        uniqueAnnualClicks: 20,
        signups: 30,
        avgSessionDuration: 3.5
      }
    ])
  }, [selectedDate])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // This would be replaced with actual API calls to your database
      // For now, using mock data
      const mockData: AnalyticsData = {
        totalVisitors: 1247,
        earlyExits: 89,
        scrollDepth: {
          hero: 1247,
          features: 892,
          howItWorks: 654,
          testimonials: 456,
          pricing: 234
        },
        buttonClicks: {
          demoButton: 156,
          freeTrial: 89,
          monthlyPlan: 67,
          annualPlan: 45
        },
        formInteractions: {
          demoFormStarted: 156,
          demoFormCompleted: 23,
          freeTrialFormStarted: 89,
          freeTrialFormCompleted: 34,
          monthlyFormStarted: 67,
          monthlyFormCompleted: 12,
          annualFormStarted: 45,
          annualFormCompleted: 8
        },
        videoInteractions: {
          videoLoaded: 654,
          videoClicked: 123
        },
        sessionMetrics: {
          avgSessionDuration: 4.2,
          avgScrollDepth: 0.67,
          avgButtonsClicked: 1.2
        },
        conversionRates: {
          demoToSchedule: 14.7,
          trialToComplete: 38.2,
          monthlyToComplete: 17.9,
          annualToComplete: 17.8
        }
      }
      setAnalyticsData(mockData)
    } catch (error) {
      console.error("Failed to fetch analytics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (date: string) => {
    // Mock day details
    setDayDetails([
      { time: "09:01", user: "Alice", action: "Visited", value: "-" },
      { time: "09:02", user: "Alice", action: "Clicked Demo", value: "Header" },
      { time: "09:03", user: "Alice", action: "Filled Trial Form", value: "Free" },
      { time: "09:04", user: "Bob", action: "Visited", value: "-" },
      { time: "09:05", user: "Bob", action: "Clicked Monthly", value: "Pricing" },
      { time: "09:06", user: "Bob", action: "Filled Monthly Form", value: "Monthly" },
      { time: "09:07", user: "Charlie", action: "Visited", value: "-" },
      { time: "09:08", user: "Charlie", action: "Clicked Demo", value: "Hero" },
      { time: "09:09", user: "Charlie", action: "Scheduled Demo", value: "Calendly" }
    ])
    setShowDayDetails(date)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num)
  }

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`
  }

  const getConversionColor = (rate: number) => {
    if (rate >= 20) return "text-green-500"
    if (rate >= 10) return "text-yellow-500"
    return "text-red-500"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Analytics Dashboard</h1>
          <p className="text-slate-400">No data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-400 mt-2">Track your website performance and user behavior</p>
          </div>
          <div className="flex items-center space-x-4">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white"
            />
            <Button onClick={fetchAnalyticsData} className="bg-slate-700 hover:bg-slate-600">
              Refresh
            </Button>
          </div>
        </div>

        {/* Day-level summary table */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-2">Daily Summary</h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900">
                <tr>
                  <th className="px-4 py-2 text-left">Date</th>
                  <th className="px-4 py-2 text-left">Unique Visitors</th>
                  <th className="px-4 py-2 text-left">Unique Demo Clicks</th>
                  <th className="px-4 py-2 text-left">Unique Trial Clicks</th>
                  <th className="px-4 py-2 text-left">Unique Monthly Clicks</th>
                  <th className="px-4 py-2 text-left">Unique Annual Clicks</th>
                  <th className="px-4 py-2 text-left">Signups</th>
                  <th className="px-4 py-2 text-left">Avg Session (min)</th>
                  <th className="px-4 py-2 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {dailySummaries.map((day) => (
                  <tr key={day.date} className="border-b border-slate-800">
                    <td className="px-4 py-2">{day.date}</td>
                    <td className="px-4 py-2">{formatNumber(day.uniqueVisitors)}</td>
                    <td className="px-4 py-2">{formatNumber(day.uniqueDemoClicks)}</td>
                    <td className="px-4 py-2">{formatNumber(day.uniqueTrialClicks)}</td>
                    <td className="px-4 py-2">{formatNumber(day.uniqueMonthlyClicks)}</td>
                    <td className="px-4 py-2">{formatNumber(day.uniqueAnnualClicks)}</td>
                    <td className="px-4 py-2">{formatNumber(day.signups)}</td>
                    <td className="px-4 py-2">{day.avgSessionDuration}</td>
                    <td className="px-4 py-2">
                      <Button size="sm" variant="outline" onClick={() => handleViewDetails(day.date)}>
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Day details modal/table */}
        {showDayDetails && (
          <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Details for {showDayDetails}</h3>
              <Button size="sm" variant="ghost" onClick={() => setShowDayDetails(null)}>
                Close
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left">Time</th>
                    <th className="px-4 py-2 text-left">User</th>
                    <th className="px-4 py-2 text-left">Action</th>
                    <th className="px-4 py-2 text-left">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dayDetails.map((row, i) => (
                    <tr key={i} className="border-b border-slate-800">
                      <td className="px-4 py-2">{row.time}</td>
                      <td className="px-4 py-2">{row.user}</td>
                      <td className="px-4 py-2">{row.action}</td>
                      <td className="px-4 py-2">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analyticsData.totalVisitors)}</div>
              <p className="text-xs text-slate-400 mt-1">Today's unique visitors</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Early Exits</CardTitle>
              <XCircle className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(analyticsData.earlyExits)}</div>
              <p className="text-xs text-slate-400 mt-1">
                {formatPercentage((analyticsData.earlyExits / analyticsData.totalVisitors) * 100)} of visitors
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Session Duration</CardTitle>
              <Clock className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.sessionMetrics.avgSessionDuration}m</div>
              <p className="text-xs text-slate-400 mt-1">Average time on site</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">Avg Scroll Depth</CardTitle>
              <Scroll className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercentage(analyticsData.sessionMetrics.avgScrollDepth * 100)}</div>
              <p className="text-xs text-slate-400 mt-1">Average scroll depth</p>
            </CardContent>
          </Card>
        </div>

        {/* Scroll Depth Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Scroll className="h-5 w-5" />
                <span>Scroll Depth by Section</span>
              </CardTitle>
              <CardDescription>How far users scroll through your content</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analyticsData.scrollDepth).map(([section, count]) => (
                <div key={section} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-slate-600 rounded-full"></div>
                    <span className="text-sm capitalize">{section.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{formatNumber(count)}</span>
                    <span className="text-xs text-slate-400">
                      ({formatPercentage((count / analyticsData.totalVisitors) * 100)})
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Button Click Tracking */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MousePointer className="h-5 w-5" />
                <span>Button Click Tracking</span>
              </CardTitle>
              <CardDescription>User interactions with key CTAs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analyticsData.buttonClicks).map(([button, count]) => (
                <div key={button} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm capitalize">{button.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{formatNumber(count)}</span>
                    <span className="text-xs text-slate-400">
                      ({formatPercentage((count / analyticsData.totalVisitors) * 100)})
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Conversion Funnel */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Conversion Funnel</span>
              </CardTitle>
              <CardDescription>Form completion rates by plan type</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(analyticsData.conversionRates).map(([funnel, rate]) => (
                <div key={funnel} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm capitalize">{funnel.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getConversionColor(rate)}`}>
                      {formatPercentage(rate)}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Video Interactions */}
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Play className="h-5 w-5" />
                <span>Video Interactions</span>
              </CardTitle>
              <CardDescription>User engagement with demo video</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Video Loaded</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{formatNumber(analyticsData.videoInteractions.videoLoaded)}</span>
                  <span className="text-xs text-slate-400">
                    ({formatPercentage((analyticsData.videoInteractions.videoLoaded / analyticsData.totalVisitors) * 100)})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span className="text-sm">Video Clicked</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{formatNumber(analyticsData.videoInteractions.videoClicked)}</span>
                  <span className="text-xs text-slate-400">
                    ({formatPercentage((analyticsData.videoInteractions.videoClicked / analyticsData.videoInteractions.videoLoaded) * 100)})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Interaction Details */}
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span>Form Interaction Details</span>
            </CardTitle>
            <CardDescription>Detailed breakdown of form starts vs completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(analyticsData.formInteractions).map(([form, count]) => {
                const isStarted = form.includes('Started')
                const isCompleted = form.includes('Completed')
                const plan = form.replace('FormStarted', '').replace('FormCompleted', '')
                
                return (
                  <div key={form} className="text-center">
                    <div className={`text-2xl font-bold ${isCompleted ? 'text-green-500' : 'text-blue-500'}`}>
                      {formatNumber(count)}
                    </div>
                    <div className="text-sm text-slate-400 capitalize">
                      {plan.replace(/([A-Z])/g, ' $1').trim()} {isStarted ? 'Started' : 'Completed'}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
