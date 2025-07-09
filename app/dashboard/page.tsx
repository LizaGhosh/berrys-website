"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { database } from "@/lib/supabase"

interface AnalyticsData {
  totalUsers: number
  uniqueVisitors: number
  funnelData: any[]
  planData: any[]
  recentUsers: any[]
}

interface DailyAnalytics {
  date: string
  total_sessions: number
  unique_visitors: number
  conversions: number
  conversion_rate: number
}

interface SessionDetail {
  session_id: string
  first_seen: string
  last_seen: string
  ip_address: string
  country: string
  city: string
  user_agent: string
  converted: boolean
  conversion_plan: string
  users: any
  events: any[]
  device_info: {
    browser: string
    os: string
    device: string
  }
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [cities, setCities] = useState<string[]>([])
  const [selectedDay, setSelectedDay] = useState<SessionDetail[] | null>(null)
  const [selectedDayDate, setSelectedDayDate] = useState<string>("")
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedCity, setSelectedCity] = useState("all")

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        console.log("🔍 Fetching analytics data...")
        const [analyticsData, dailyData, citiesData] = await Promise.all([
          database.getAnalytics(),
          database.getDailyAnalytics(),
          database.getCities()
        ])
        
        console.log("📊 Analytics data:", analyticsData)
        console.log("📅 Daily data:", dailyData)
        console.log("🏙️ Cities:", citiesData)
        
        // Debug the data inconsistency
        console.log("🔍 DEBUG - Users vs Sessions:", {
          totalUsers: analyticsData.totalUsers,
          uniqueVisitors: analyticsData.uniqueVisitors,
          recentUsersCount: analyticsData.recentUsers.length,
          dailyDataDays: dailyData.length
        })
        
        setAnalytics(analyticsData)
        setDailyAnalytics(dailyData)
        setCities(citiesData)
      } catch (error) {
        console.error("❌ Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  const handleFilterChange = async () => {
    try {
      const filteredData = await database.getDailyAnalytics({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        city: selectedCity === "all" ? undefined : selectedCity
      })
      setDailyAnalytics(filteredData)
    } catch (error) {
      console.error("Failed to apply filters:", error)
    }
  }

  useEffect(() => {
    if (startDate || endDate || (selectedCity && selectedCity !== "all")) {
      handleFilterChange()
    }
  }, [startDate, endDate, selectedCity])

  const handleDayClick = async (date: string) => {
    try {
      setSelectedDayDate(date)
      const dayDetails = await database.getDayDetails(date)
      console.log("🔍 Day details for", date, ":", dayDetails)
      setSelectedDay(dayDetails)
    } catch (error) {
      console.error("Failed to fetch day details:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">berrys.ai Analytics Dashboard</h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-400">Loading analytics...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-950 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">berrys.ai Analytics Dashboard</h1>
          <div className="flex items-center justify-center py-12">
            <div className="text-red-400">Failed to load analytics. Check your database connection.</div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate funnel metrics for overview
  const funnelCounts = analytics.funnelData.reduce(
    (acc, event) => {
      acc[event.event_name] = (acc[event.event_name] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pageViews = funnelCounts.page_loaded || 0
  const demoRequests = funnelCounts.demo_requested || 0
  const planSelections = funnelCounts.plan_selected || 0
  const signups = funnelCounts.signup_completed || 0

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">berrys.ai Analytics Dashboard</h1>
          <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Website
          </a>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-400">{analytics.totalUsers}</div>
              <p className="text-gray-400 text-xs mt-1">Signed up users</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Unique Visitors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-400">{analytics.uniqueVisitors}</div>
              <p className="text-gray-400 text-xs mt-1">Unique sessions</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-400">
                {analytics.uniqueVisitors > 0
                  ? ((analytics.totalUsers / analytics.uniqueVisitors) * 100).toFixed(1)
                  : 0}
                %
              </div>
              <p className="text-gray-400 text-xs mt-1">Visitors to signups</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-white text-sm font-medium">Demo Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{demoRequests}</div>
              <p className="text-gray-400 text-xs mt-1">Calendly bookings</p>
            </CardContent>
          </Card>
        </div>



        {/* Daily Analytics Table with Filters */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Daily Analytics</CardTitle>
            <CardDescription className="text-gray-400">
              Click on any day to see detailed user logs. Use filters to narrow down data.
            </CardDescription>
            
            {/* Filters */}
            <div className="flex gap-4 mt-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-300">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-300">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="flex flex-col space-y-2">
                <label className="text-sm text-gray-300">City</label>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All cities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(startDate || endDate || (selectedCity && selectedCity !== "all")) && (
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => {
                      setStartDate("")
                      setEndDate("")
                      setSelectedCity("all")
                    }}
                    className="px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 rounded-md text-gray-300"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {dailyAnalytics.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No data available for the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Date</th>
                      <th className="text-left py-3 px-4 text-gray-300">Total Sessions</th>
                      <th className="text-left py-3 px-4 text-gray-300">Unique Visitors</th>
                      <th className="text-left py-3 px-4 text-gray-300">Conversions</th>
                      <th className="text-left py-3 px-4 text-gray-300">Conversion Rate</th>
                      <th className="text-left py-3 px-4 text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dailyAnalytics.map((day) => (
                      <tr key={day.date} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white font-medium">
                          {new Date(day.date).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 text-blue-400">{day.total_sessions}</td>
                        <td className="py-3 px-4 text-green-400">{day.unique_visitors}</td>
                        <td className="py-3 px-4 text-purple-400">{day.conversions}</td>
                        <td className="py-3 px-4 text-yellow-400">{day.conversion_rate}%</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDayClick(day.date)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm text-white transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Signups */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Recent Signups</CardTitle>
            <CardDescription className="text-gray-400">Latest user registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.recentUsers.length === 0 ? (
              <div className="text-gray-400 text-center py-8">
                No signups yet. Share your website to get your first users!
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.recentUsers.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                    <div>
                      <div className="text-white font-medium">{user.name}</div>
                      <div className="text-gray-400 text-sm">
                        {user.city} • {user.email}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-purple-400 font-medium capitalize">{user.selected_plan}</div>
                      <div className="text-gray-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Day Details Table */}
        {selectedDay && (
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-white">
                User Details for {new Date(selectedDayDate).toLocaleDateString()}
              </CardTitle>
              <CardDescription className="text-gray-400">
                All users and visitors for this day
              </CardDescription>
              <div className="flex justify-end">
                <button
                  onClick={() => setSelectedDay(null)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300"
                >
                  Close
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-300">Name</th>
                      <th className="text-left py-3 px-4 text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-gray-300">City</th>
                      <th className="text-left py-3 px-4 text-gray-300">Time</th>
                      <th className="text-left py-3 px-4 text-gray-300">IP Address</th>
                      <th className="text-left py-3 px-4 text-gray-300">User Agent</th>
                      <th className="text-left py-3 px-4 text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDay.map((session, index) => (
                      <tr key={session.session_id} className="border-b border-gray-800 hover:bg-gray-800/50">
                        <td className="py-3 px-4 text-white">
                          {session.users?.name || (session.converted ? "Converted User" : "Anonymous")}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {session.users?.email || "—"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {session.city || "Unknown"}
                        </td>
                        <td className="py-3 px-4 text-gray-300">
                          {new Date(session.first_seen).toLocaleTimeString()}
                        </td>
                        <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                          {session.ip_address || "127.0.0.1"}
                        </td>
                        <td className="py-3 px-4 text-gray-300 max-w-xs truncate" title={session.user_agent}>
                          {session.device_info.browser} ({session.device_info.os})
                        </td>
                        <td className="py-3 px-4">
                          {session.converted ? (
                            <span className="px-2 py-1 bg-green-600 text-green-100 rounded text-xs">
                              Converted
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-600 text-gray-300 rounded text-xs">
                              Visitor
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
