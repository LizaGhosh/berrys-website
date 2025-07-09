import { type NextRequest, NextResponse } from "next/server"
import { storeInDatabase } from "./utils" // Assuming utils is a separate file for functions

// You can use any database - here's an example with a simple approach
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
    // This data will survive ALL website updates
    await storeInDatabase(enrichedData)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json({ error: "Failed to store analytics" }, { status: 500 })
  }
}
