"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Eye, 
  MousePointer, 
  Clock, 
  TrendingUp, 
  BarChart3,
  Activity,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react"
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔍 Dashboard initialization:')
console.log('Supabase URL:', supabaseUrl ? 'Present' : 'Missing')
console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')

const supabase = createClient(supabaseUrl, supabaseKey)

interface DailyMetrics {
  date: string
  unique_visitors: number
  total_sessions: number
  total_events: number
  page_views: number
  conversions: number
  avg_session_duration: number
}

interface FunnelMetrics {
  section_name: string
  unique_sessions: number
  total_views: number
  avg_time_spent: number
  exits: number
  exit_rate: number
}

interface TopInteractions {
  element_name: string
  interaction_count: number
  interaction_type: string
}

interface User {
  id: string
  name: string
  email: string
  city: string
  selected_plan: string
  signup_source: string
  created_at: string
}

interface FormSubmission {
  id: string
  session_id: string
  visitor_id: string
  form_type: string
  form_data: any
  submission_timestamp: string
  name: string
  email: string
  city: string
  selected_plan: string
  signup_source: string
  conversion_value: number
}

export default function DashboardPage() {
  const [dailyMetrics, setDailyMetrics] = useState<DailyMetrics[]>([])
  const [funnelMetrics, setFunnelMetrics] = useState<FunnelMetrics[]>([])
  const [topInteractions, setTopInteractions] = useState<TopInteractions[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [formSubmissions, setFormSubmissions] = useState<FormSubmission[]>([])
  const [uniqueDemoClicks, setUniqueDemoClicks] = useState(0)
  const [uniqueFreeTrialClicks, setUniqueFreeTrialClicks] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedDateRange, setSelectedDateRange] = useState('7d')
  
  // Test Supabase connection
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🧪 Testing Supabase connection...')
        console.log('Environment variables check:')
        console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing')
        console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing')
        
        const { data, error } = await supabase
          .from('daily_analytics')
          .select('count')
          .limit(1)
        
        if (error) {
          console.error('❌ Supabase connection failed:', error)
        } else {
          console.log('✅ Supabase connection successful')
        }
      } catch (err) {
        console.error('❌ Supabase connection error:', err)
      }
    }
    
    testConnection()
  }, [])

  // Get current time in PDT
  const getCurrentPDTTime = () => {
    const now = new Date()
    return now.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const getDateRangeStart = useCallback(() => {
    const now = new Date()
    // Convert to PDT for date calculations
    const pdtNow = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
    
    switch (selectedDateRange) {
      case '1d':
        return new Date(pdtNow.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '7d':
        return new Date(pdtNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '30d':
        return new Date(pdtNow.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      default:
        return new Date(pdtNow.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }, [selectedDateRange])

  const fetchAnalyticsData = useCallback(async () => {
    console.log('🚀 fetchAnalyticsData called')
    setLoading(true)
    try {
      console.log('🔍 Fetching analytics data...')
      console.log('Date range start:', getDateRangeStart())
      
      // Fetch daily metrics
      const { data: dailyData, error: dailyError } = await supabase
        .from('daily_analytics')
        .select('*')
        .gte('date', getDateRangeStart())
        .order('date', { ascending: false })
        .limit(30)

      if (dailyError) {
        console.error('❌ Daily metrics error:', dailyError)
        throw dailyError
      }
      
      console.log('✅ Daily metrics:', dailyData)
      setDailyMetrics(dailyData || [])

      // Fetch funnel metrics
      const { data: funnelData, error: funnelError } = await supabase
        .from('page_funnel_analytics')
        .select('*')

      if (funnelError) {
        console.error('❌ Funnel metrics error:', funnelError)
        throw funnelError
      }
      console.log('✅ Funnel metrics:', funnelData)
      setFunnelMetrics(funnelData || [])

      // Fetch top interactions
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('analytics_events')
        .select('event_type, event_data')
        .in('event_type', ['button_clicked', 'link_clicked', 'element_hovered'])
        .gte('timestamp', getDateRangeStart() + 'T00:00:00.000Z')

      if (interactionsError) {
        console.error('❌ Interactions error:', interactionsError)
        throw interactionsError
      }
      
      console.log('✅ Interactions data:', interactionsData)
      
      // Process interactions data
      const interactionCounts: { [key: string]: number } = {}
      interactionsData?.forEach(event => {
        const elementName = event.event_data?.button_name || 
                          event.event_data?.link_text || 
                          event.event_data?.element_type || 'Unknown'
        const key = `${elementName}_${event.event_type}`
        interactionCounts[key] = (interactionCounts[key] || 0) + 1
      })

      const topInteractionsList = Object.entries(interactionCounts)
        .map(([key, count]) => {
          const [elementName, interactionType] = key.split('_')
          return {
            element_name: elementName,
            interaction_count: count,
            interaction_type: interactionType
          }
        })
        .sort((a, b) => b.interaction_count - a.interaction_count)
        .slice(0, 10)

      console.log('✅ Top interactions:', topInteractionsList)
      setTopInteractions(topInteractionsList)

      // Fetch unique demo clicks
      const { data: demoClicksData, error: demoClicksError } = await supabase
        .from('analytics_events')
        .select('visitor_id')
        .eq('event_type', 'button_clicked')
        .contains('event_data', { button_name: 'demo_button' })
        .gte('timestamp', getDateRangeStart() + 'T00:00:00.000Z')

      if (demoClicksError) {
        console.error('❌ Demo clicks error:', demoClicksError)
      } else {
        console.log('✅ Demo clicks data:', demoClicksData)
        if (demoClicksData) {
          const uniqueDemoVisitors = new Set(demoClicksData.map(event => event.visitor_id))
          setUniqueDemoClicks(uniqueDemoVisitors.size)
        }
      }

      // Fetch unique free trial clicks
      const { data: freeTrialClicksData, error: freeTrialClicksError } = await supabase
        .from('analytics_events')
        .select('visitor_id')
        .eq('event_type', 'button_clicked')
        .contains('event_data', { plan: 'free' })
        .gte('timestamp', getDateRangeStart() + 'T00:00:00.000Z')

      if (freeTrialClicksError) {
        console.error('❌ Free trial clicks error:', freeTrialClicksError)
      } else {
        console.log('✅ Free trial clicks data:', freeTrialClicksData)
        if (freeTrialClicksData) {
          const uniqueFreeTrialVisitors = new Set(freeTrialClicksData.map(event => event.visitor_id))
          setUniqueFreeTrialClicks(uniqueFreeTrialVisitors.size)
        }
      }

    } catch (error) {
      console.error('❌ Error fetching analytics data:', error)
    } finally {
      console.log('✅ Data fetching completed, setting loading to false')
      setLoading(false)
    }
  }, [supabase, getDateRangeStart])

  useEffect(() => {
    console.log('🔄 useEffect triggered, selectedDateRange:', selectedDateRange)
    fetchAnalyticsData()
  }, [selectedDateRange, fetchAnalyticsData])



  const formatDuration = (minutes: number) => {
    const mins = Math.floor(minutes)
    const secs = Math.round((minutes - mins) * 60)
    return `${mins}m ${secs}s`
  }

  const getSectionColor = (sectionName: string) => {
    const colors: { [key: string]: string } = {
      hero: 'bg-blue-500',
      features: 'bg-green-500',
      demo: 'bg-purple-500',
      pricing: 'bg-orange-500',
      footer: 'bg-gray-500'
    }
    return colors[sectionName] || 'bg-gray-500'
  }

  const getUniqueDemoClicks = () => {
    return uniqueDemoClicks
  }

  const getUniqueFreeTrialClicks = () => {
    return uniqueFreeTrialClicks
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-800 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-slate-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Analytics Dashboard</h1>
            <p className="text-slate-400 mt-2">Track user behavior and page performance</p>
            <p className="text-xs text-slate-500 mt-1">Timezone: PDT (Pacific Daylight Time) - {getCurrentPDTTime()}</p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedDateRange === '1d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDateRange('1d')}
            >
              1D
            </Button>
            <Button
              variant={selectedDateRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDateRange('7d')}
            >
              7D
            </Button>
            <Button
              variant={selectedDateRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDateRange('30d')}
            >
              30D
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Total Visitors</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {dailyMetrics.length > 0 
                  ? dailyMetrics.reduce((sum, day) => sum + day.total_sessions, 0).toLocaleString()
                  : '0'
                }
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {dailyMetrics.length > 0 ? 'All sessions tracked' : 'No sessions yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Unique Visitors</CardTitle>
              <Users className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {dailyMetrics.length > 0 
                  ? dailyMetrics.reduce((sum, day) => sum + day.unique_visitors, 0).toLocaleString()
                  : '0'
                }
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {dailyMetrics.length > 0 ? 'Unique users tracked' : 'No visitors yet'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Unique Demo Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {getUniqueDemoClicks().toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Demo button interactions
              </p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Unique Free Trial Clicks</CardTitle>
              <Target className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">
                {getUniqueFreeTrialClicks().toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Free trial button interactions
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Page Funnel Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Page Funnel Performance</CardTitle>
              <CardDescription className="text-slate-400">
                How users interact with different sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnelMetrics.length > 0 ? (
                  funnelMetrics.map((section) => (
                    <div key={section.section_name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getSectionColor(section.section_name)}`}></div>
                        <div>
                          <p className="text-sm font-medium text-slate-200 capitalize">
                            {section.section_name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {section.unique_sessions} sessions
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-200">
                          {section.total_views.toLocaleString()}
                        </p>
                        <p className="text-xs text-slate-400">
                          {section.exit_rate.toFixed(1)}% exit rate
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">No funnel data available yet</p>
                    <p className="text-slate-500 text-xs mt-1">Interact with your site to see analytics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">Top Interactions</CardTitle>
              <CardDescription className="text-slate-400">
                Most clicked and hovered elements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topInteractions.length > 0 ? (
                  topInteractions.map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                          <span className="text-xs text-slate-300">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-slate-200">
                            {interaction.element_name}
                          </p>
                          <p className="text-xs text-slate-400 capitalize">
                            {interaction.interaction_type}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                        {interaction.interaction_count}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-400 text-sm">No interactions tracked yet</p>
                    <p className="text-slate-500 text-xs mt-1">Click buttons and links to see analytics</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Trends Chart */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">Daily Trends</CardTitle>
            <CardDescription className="text-slate-400">
              Visitor and interaction trends over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyMetrics.length > 0 ? (
                dailyMetrics.slice(0, 7).map((day) => {
                  // Convert the date string to PDT
                  const dateInPDT = new Date(day.date + 'T00:00:00.000Z').toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    timeZone: 'America/Los_Angeles'
                  });
                  
                  return (
                    <div key={day.date} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-slate-200">
                          {dateInPDT}
                        </p>
                        <p className="text-xs text-slate-400">
                          {day.unique_visitors} visitors
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-200">
                            {day.page_views}
                          </p>
                          <p className="text-xs text-slate-400">views</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-200">
                            {day.conversions}
                          </p>
                          <p className="text-xs text-slate-400">conversions</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No daily trends available yet</p>
                  <p className="text-slate-500 text-xs mt-1">Visit your site to start collecting analytics</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
