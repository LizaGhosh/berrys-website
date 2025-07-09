"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { database } from "@/lib/supabase"

interface AnalyticsData {
  totalUsers: number
  uniqueVisitors: number
  funnelData: any[]
  planData: any[]
  recentUsers: any[]
}

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const data = await database.getAnalytics()
        setAnalytics(data)
      } catch (error) {
        console.error("Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

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

  // Calculate funnel metrics
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

  // Plan distribution
  const planCounts = analytics.planData.reduce(
    (acc, user) => {
      acc[user.selected_plan] = (acc[user.selected_plan] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">berrys.ai Analytics Dashboard</h1>
          <a href="/" className="text-purple-400 hover:text-purple-300 transition-colors">
            ← Back to Website
          </a>
        </div>

        {/* Key Metrics */}
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

        {/* Conversion Funnel */}
        <Card className="bg-gray-900 border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Conversion Funnel</CardTitle>
            <CardDescription className="text-gray-400">User journey from page view to signup</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Page Views</span>
                <div className="flex items-center space-x-4">
                  <div className="w-64 bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "100%" }}></div>
                  </div>
                  <span className="text-white font-semibold w-12 text-right">{pageViews}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Demo Requests</span>
                <div className="flex items-center space-x-4">
                  <div className="w-64 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: `${pageViews > 0 ? (demoRequests / pageViews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-12 text-right">{demoRequests}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Plan Selections</span>
                <div className="flex items-center space-x-4">
                  <div className="w-64 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{ width: `${pageViews > 0 ? (planSelections / pageViews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-12 text-right">{planSelections}</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-300">Signups</span>
                <div className="flex items-center space-x-4">
                  <div className="w-64 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${pageViews > 0 ? (signups / pageViews) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-white font-semibold w-12 text-right">{signups}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan Distribution & Revenue */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Free Trial</span>
                  <span className="text-white font-semibold">{planCounts.free || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Monthly ($5)</span>
                  <span className="text-white font-semibold">{planCounts.monthly || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Annual ($30)</span>
                  <span className="text-white font-semibold">{planCounts.annual || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Revenue Estimate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Monthly Revenue</span>
                  <span className="text-green-400 font-semibold">
                    ${((planCounts.monthly || 0) * 5 + (planCounts.annual || 0) * 2.5).toFixed(0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Annual Revenue</span>
                  <span className="text-green-400 font-semibold">
                    ${((planCounts.monthly || 0) * 60 + (planCounts.annual || 0) * 30).toFixed(0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Signups</CardTitle>
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
      </div>
    </div>
  )
}
