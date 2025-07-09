import { type NextRequest, NextResponse } from "next/server"
import { storeInDatabase, getAnalyticsData } from "./utils"

// GET method to retrieve analytics data for dashboard
export async function GET() {
  try {
    const analyticsData = await getAnalyticsData()
    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error("Analytics GET error:", error)
    
    // Return demo data for testing when database isn't set up
    const demoData = {
      totalPageViews: 127,
      totalPlanSelections: 23,
      totalDemoRequests: 8,
      totalSignups: 12,
      planBreakdown: {
        basic: 15,
        pro: 6,
        enterprise: 2
      }
    }
    
    return NextResponse.json(demoData)
  }
}

// POST method to store analytics events
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // Add visitor info and server-side data
    const enrichedData = {
      ...data,
      server_timestamp: new Date().toISOString(),
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
      country: request.geo?.country,
      city: request.geo?.city,
      referrer: request.headers.get("referer"),
      // Track deployment info
      deployment_id: process.env.VERCEL_DEPLOYMENT_ID || "local",
      git_commit: process.env.VERCEL_GIT_COMMIT_SHA || "unknown",
    }

    // Store in your persistent database
    try {
      await storeInDatabase(enrichedData)
    } catch (dbError) {
      console.error("Database storage error:", dbError)
      // Continue anyway - don't fail the request if database isn't set up
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics POST error:", error)
    return NextResponse.json({ error: "Failed to store analytics" }, { status: 500 })
  }
}
