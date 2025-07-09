import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to convert data to CSV
function arrayToCSV(data: any[]): string {
  if (data.length === 0) return ''
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header]
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(',')
    )
  ].join('\n')
  
  return csvContent
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json' // json or csv
    const table = searchParams.get('table') || 'all' // users, sessions, events, summary, or all
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    let data: any = {}

    // Build date filter for queries
    const dateFilter = (dateColumn: string) => {
      let filter = ''
      if (startDate) filter += ` AND ${dateColumn} >= '${startDate}'`
      if (endDate) filter += ` AND ${dateColumn} <= '${endDate}'`
      return filter
    }

    if (table === 'users' || table === 'all') {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (usersError) throw usersError
      data.users = users
    }

    if (table === 'sessions' || table === 'all') {
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .order('first_seen', { ascending: false })
      
      if (sessionsError) throw sessionsError
      data.sessions = sessions
    }

    if (table === 'events' || table === 'all') {
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('server_timestamp', { ascending: false })
        .limit(10000) // Limit to prevent timeout
      
      if (eventsError) throw eventsError
      data.events = events
    }

    if (table === 'summary' || table === 'all') {
      // Daily analytics summary
      const { data: summary, error: summaryError } = await supabase.rpc('get_daily_analytics', {
        start_date_param: startDate,
        end_date_param: endDate,
        city_param: null
      })
      
      if (summaryError) throw summaryError
      data.summary = summary
    }

    if (table === 'journey' || table === 'all') {
      // User journey data (combined users and sessions)
      const { data: journey, error: journeyError } = await supabase
        .from('users')
        .select(`
          *,
          sessions!left (*)
        `)
        .order('created_at', { ascending: false })
      
      if (journeyError) throw journeyError
      data.journey = journey
    }

    // Handle different export formats
    if (format === 'csv') {
      if (table !== 'all') {
        // Single table CSV
        const csvContent = arrayToCSV(data[table] || [])
        
        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="${table}_export_${new Date().toISOString().split('T')[0]}.csv"`
          }
        })
      } else {
        // Multiple CSV files in ZIP would require additional library
        // For now, return JSON with instruction
        return NextResponse.json({
          message: "For multi-table CSV export, please use individual table exports",
          available_tables: ["users", "sessions", "events", "summary", "journey"],
          example_urls: [
            "/api/export?table=users&format=csv",
            "/api/export?table=sessions&format=csv",
            "/api/export?table=events&format=csv"
          ]
        })
      }
    }

    // Return JSON by default
    const response = {
      exported_at: new Date().toISOString(),
      date_range: {
        start: startDate || 'all_time',
        end: endDate || 'all_time'
      },
      record_counts: {
        users: data.users?.length || 0,
        sessions: data.sessions?.length || 0,
        events: data.events?.length || 0,
        summary: data.summary?.length || 0,
        journey: data.journey?.length || 0
      },
      data
    }

    return NextResponse.json(response, {
      headers: {
        'Content-Disposition': `attachment; filename="analytics_export_${new Date().toISOString().split('T')[0]}.json"`
      }
    })

  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export data', details: error },
      { status: 500 }
    )
  }
}

// Optional: Add authentication middleware here if needed
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Use GET method for data export' },
    { status: 405 }
  )
} 