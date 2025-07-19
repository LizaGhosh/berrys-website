// Check if analytics data is being stored in Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAnalyticsData() {
  try {
    console.log('🔍 Checking analytics data in Supabase...');
    
    // Check analytics_events table
    console.log('\n1. Checking analytics_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (eventsError) {
      console.error('❌ Events error:', eventsError);
    } else {
      console.log('✅ Found', events?.length || 0, 'analytics events');
      if (events && events.length > 0) {
        console.log('📊 Recent events:');
        events.forEach((event, index) => {
          console.log(`  ${index + 1}. ${event.event_type} - ${event.timestamp}`);
        });
      }
    }
    
    // Check user_sessions table
    console.log('\n2. Checking user_sessions table...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (sessionsError) {
      console.error('❌ Sessions error:', sessionsError);
    } else {
      console.log('✅ Found', sessions?.length || 0, 'user sessions');
    }
    
    // Check daily_analytics view
    console.log('\n3. Checking daily_analytics view...');
    const { data: daily, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    if (dailyError) {
      console.error('❌ Daily analytics error:', dailyError);
    } else {
      console.log('✅ Found', daily?.length || 0, 'daily analytics records');
      if (daily && daily.length > 0) {
        console.log('📈 Recent daily metrics:');
        daily.forEach((day, index) => {
          console.log(`  ${index + 1}. ${day.date}: ${day.unique_visitors} visitors, ${day.total_events} events`);
        });
      }
    }
    
    // Summary
    console.log('\n📋 Summary:');
    console.log('- Analytics events:', events?.length || 0);
    console.log('- User sessions:', sessions?.length || 0);
    console.log('- Daily records:', daily?.length || 0);
    
    if ((events?.length || 0) === 0) {
      console.log('\n💡 No analytics data found. This could mean:');
      console.log('1. The SQL tables haven\'t been created in Supabase');
      console.log('2. RLS policies are blocking data insertion');
      console.log('3. The analytics tracker isn\'t working properly');
      console.log('4. No one has visited the site yet');
    } else {
      console.log('\n🎉 Analytics are working! Data is being stored.');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkAnalyticsData(); 