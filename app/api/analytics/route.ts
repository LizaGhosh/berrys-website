import { type NextRequest, NextResponse } from "next/server"
import { storeInDatabase, getAnalyticsData } from "./utils"
import { ipGeolocationService } from "@/lib/ip-geolocation"

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
    
    const ipAddress = request.ip || request.headers.get("x-forwarded-for") || ""
    
    // Get enhanced location data
    const enhancedLocation = await ipGeolocationService.getLocationData(
      ipAddress,
      { country: request.geo?.country, city: request.geo?.city }
    )

    // Add visitor info and server-side data with enhanced location
    const enrichedData = {
      ...data,
      server_timestamp: new Date().toISOString(),
      ip_address: ipAddress,
      // Basic location (for backward compatibility - will be used for user-provided location)
      country: enhancedLocation.country,
      city: enhancedLocation.city,
      // IP-based location data (separate from user-provided location)
      ip_country: enhancedLocation.country,
      ip_country_code: enhancedLocation.country_code,
      ip_region: enhancedLocation.region,
      ip_region_name: enhancedLocation.region_name,
      ip_city: enhancedLocation.city,
      ip_postal_code: enhancedLocation.postal_code,
      ip_latitude: enhancedLocation.latitude,
      ip_longitude: enhancedLocation.longitude,
      ip_timezone: enhancedLocation.timezone,
      ip_isp: enhancedLocation.isp,
      ip_organization: enhancedLocation.organization,
      ip_connection_type: enhancedLocation.connection_type,
      ip_is_mobile: enhancedLocation.is_mobile,
      ip_is_proxy: enhancedLocation.is_proxy,
      ip_is_hosting: enhancedLocation.is_hosting,
      ip_location_source: enhancedLocation.location_source,
      // Keep the enhanced_location object for dashboard processing
      enhanced_location: enhancedLocation,
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
