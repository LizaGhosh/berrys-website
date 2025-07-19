// Simple test to verify analytics are working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalytics() {
  console.log('🧪 Testing analytics data flow...');
  
  try {
    // 1. Check if analytics events are being created
    console.log('📊 Checking analytics_events table...');
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10);
    
    if (eventsError) {
      console.error('❌ Error fetching events:', eventsError);
      return;
    }
    
    console.log(`✅ Found ${events.length} analytics events`);
    
    if (events.length > 0) {
      console.log('📋 Recent events:');
      events.slice(0, 5).forEach((event, index) => {
        console.log(`  ${index + 1}. ${event.event_type} - ${event.timestamp}`);
      });
    }
    
    // 2. Check daily analytics view
    console.log('\n📈 Checking daily_analytics view...');
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(7);
    
    if (dailyError) {
      console.error('❌ Error fetching daily analytics:', dailyError);
      return;
    }
    
    console.log(`✅ Found ${dailyData.length} daily analytics records`);
    
    if (dailyData.length > 0) {
      console.log('📊 Recent daily metrics:');
      dailyData.forEach((day, index) => {
        console.log(`  ${index + 1}. ${day.date}: ${day.unique_visitors} visitors, ${day.total_events} events`);
      });
    }
    
    // 3. Check if there's recent data (last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { data: recentEvents, error: recentError } = await supabase
      .from('analytics_events')
      .select('*')
      .gte('timestamp', oneDayAgo.toISOString());
    
    if (recentError) {
      console.error('❌ Error fetching recent events:', recentError);
      return;
    }
    
    console.log(`\n🕐 Events in last 24 hours: ${recentEvents.length}`);
    
    if (recentEvents.length === 0) {
      console.log('⚠️  No recent analytics events found.');
      console.log('💡 To generate analytics data:');
      console.log('   1. Open http://localhost:3001 in your browser');
      console.log('   2. Scroll down the page');
      console.log('   3. Click on buttons and links');
      console.log('   4. Wait a few seconds');
      console.log('   5. Check http://localhost:3001/dashboard');
    } else {
      console.log('✅ Analytics are working! Recent data found.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnalytics(); 