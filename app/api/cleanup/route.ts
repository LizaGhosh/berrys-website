import { NextRequest, NextResponse } from 'next/server'
import { performDataCleanup } from '@/lib/data-cleanup'

// POST /api/cleanup - Trigger data cleanup
export async function POST(request: NextRequest) {
  try {
    // Simple authentication check (replace with your preferred method)
    const authHeader = request.headers.get('Authorization')
    const expectedToken = process.env.CLEANUP_API_KEY || 'your-secret-cleanup-key'
    
    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid cleanup API key' },
        { status: 401 }
      )
    }

    console.log('🧹 Data cleanup triggered via API')
    const stats = await performDataCleanup()

    return NextResponse.json({
      success: true,
      message: 'Data cleanup completed successfully',
      stats: {
        eventsDeleted: stats.eventsDeleted,
        sessionsDeleted: stats.sessionsDeleted,
        ipAddressesAnonymized: stats.ipAddressesAnonymized,
        oldestRemainingData: stats.oldestData,
        cleanupDate: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('❌ Cleanup API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Data cleanup failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET /api/cleanup - Check cleanup status and data statistics
export async function GET() {
  try {
    // Return current data statistics without performing cleanup
    return NextResponse.json({
      message: 'Use POST method to trigger cleanup',
      retentionPolicy: {
        users: 'Kept forever (business records)',
        sessions: 'Deleted after 1 year',
        events: 'Deleted after 6 months', 
        ipAddresses: 'Anonymized after 3 months'
      },
      usage: 'Send POST request with Authorization: Bearer <CLEANUP_API_KEY>'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch cleanup info' },
      { status: 500 }
    )
  }
} 