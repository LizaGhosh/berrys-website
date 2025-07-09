// Automated Data Cleanup for Analytics
// Run this monthly to maintain database performance and privacy compliance

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface CleanupStats {
  eventsDeleted: number
  sessionsDeleted: number
  ipAddressesAnonymized: number
  storageReclaimed: string
  oldestData: {
    users: string
    sessions: string
    events: string
  }
}

export async function performDataCleanup(): Promise<CleanupStats> {
  console.log('🧹 Starting automated data cleanup...')
  
  // Warn if using limited functionality
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY not found - using anon key with limited permissions')
  }
  
  const stats: CleanupStats = {
    eventsDeleted: 0,
    sessionsDeleted: 0,
    ipAddressesAnonymized: 0,
    storageReclaimed: '0 MB',
    oldestData: { users: '', sessions: '', events: '' }
  }

  try {
    // 1. Clean up events older than 6 months
    console.log('📊 Cleaning up old events (6+ months)...')
    const { count: eventsDeleted, error: eventsError } = await supabase
      .from('events')
      .delete({ count: 'exact' })
      .lt('server_timestamp', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())

    if (eventsError) {
      console.error('Events cleanup error:', eventsError)
    } else {
      stats.eventsDeleted = eventsDeleted || 0
      console.log(`✅ Deleted ${stats.eventsDeleted} old events`)
    }

    // 2. Clean up sessions older than 1 year
    console.log('🔗 Cleaning up old sessions (1+ years)...')
    const { count: sessionsDeleted, error: sessionsError } = await supabase
      .from('sessions')
      .delete({ count: 'exact' })
      .lt('first_seen', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

    if (sessionsError) {
      console.error('Sessions cleanup error:', sessionsError)
    } else {
      stats.sessionsDeleted = sessionsDeleted || 0
      console.log(`✅ Deleted ${stats.sessionsDeleted} old sessions`)
    }

    // 3. Anonymize IP addresses older than 3 months
    console.log('🔒 Anonymizing old IP addresses (3+ months)...')
    const threeMonthsAgo = new Date(Date.now() - 3 * 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Anonymize session IPs
    const { count: sessionIpsUpdated, error: sessionIpError } = await supabase
      .from('sessions')
      .update({ ip_address: null }, { count: 'exact' })
      .lt('first_seen', threeMonthsAgo)
      .not('ip_address', 'is', null)

    // Anonymize event IPs
    const { count: eventIpsUpdated, error: eventIpError } = await supabase
      .from('events')
      .update({ ip_address: null }, { count: 'exact' })
      .lt('server_timestamp', threeMonthsAgo)
      .not('ip_address', 'is', null)

    if (sessionIpError || eventIpError) {
      console.error('IP anonymization error:', sessionIpError || eventIpError)
    } else {
      stats.ipAddressesAnonymized = (sessionIpsUpdated || 0) + (eventIpsUpdated || 0)
      console.log(`✅ Anonymized ${stats.ipAddressesAnonymized} IP addresses`)
    }

    // 4. Get current data statistics
    console.log('📈 Gathering database statistics...')
    const [usersData, sessionsData, eventsData] = await Promise.all([
      supabase
        .from('users')
        .select('created_at')
        .order('created_at', { ascending: true })
        .limit(1),
      supabase
        .from('sessions')
        .select('first_seen')
        .order('first_seen', { ascending: true })
        .limit(1),
      supabase
        .from('events')
        .select('server_timestamp')
        .order('server_timestamp', { ascending: true })
        .limit(1)
    ])

    stats.oldestData = {
      users: usersData.data?.[0]?.created_at || 'No data',
      sessions: sessionsData.data?.[0]?.first_seen || 'No data',
      events: eventsData.data?.[0]?.server_timestamp || 'No data'
    }

    console.log('✅ Data cleanup completed successfully!')
    return stats

  } catch (error) {
    console.error('❌ Data cleanup failed:', error)
    throw error
  }
}

// Manual cleanup function for immediate use
export async function runManualCleanup() {
  const stats = await performDataCleanup()
  
  console.log('\n📊 CLEANUP SUMMARY:')
  console.log(`Events deleted: ${stats.eventsDeleted}`)
  console.log(`Sessions deleted: ${stats.sessionsDeleted}`)
  console.log(`IP addresses anonymized: ${stats.ipAddressesAnonymized}`)
  console.log('\n📅 OLDEST REMAINING DATA:')
  console.log(`Users: ${stats.oldestData.users}`)
  console.log(`Sessions: ${stats.oldestData.sessions}`)
  console.log(`Events: ${stats.oldestData.events}`)
  
  return stats
}

// Export for API route usage
export { type CleanupStats } 