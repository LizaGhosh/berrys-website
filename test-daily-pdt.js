// Test daily analytics PDT timezone
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDailyPDT() {
  try {
    console.log('🧪 Testing daily analytics PDT timezone...');
    
    // Get current time in PDT
    const now = new Date()
    const pdtTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
    
    console.log('📅 Current UTC time:', now.toISOString())
    console.log('📅 Current PDT time:', pdtTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
    
    // Insert test events for today and yesterday in PDT
    console.log('\n📊 Inserting test events for PDT dates...');
    
    // Today's event
    const todayEvent = {
      session_id: 'pdt_today_' + Date.now(),
      visitor_id: 'pdt_visitor_today_' + Date.now(),
      event_type: 'pdt_daily_test_today',
      event_data: { test: 'today', pdt_date: pdtTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"}) },
      timestamp: pdtTime.toISOString(),
      user_agent: 'PDT Daily Test',
      url: 'http://localhost:3001',
      referrer: 'test'
    };
    
    // Yesterday's event (subtract 24 hours)
    const yesterdayTime = new Date(pdtTime.getTime() - 24 * 60 * 60 * 1000)
    const yesterdayEvent = {
      session_id: 'pdt_yesterday_' + Date.now(),
      visitor_id: 'pdt_visitor_yesterday_' + Date.now(),
      event_type: 'pdt_daily_test_yesterday',
      event_data: { test: 'yesterday', pdt_date: yesterdayTime.toLocaleDateString("en-US", {timeZone: "America/Los_Angeles"}) },
      timestamp: yesterdayTime.toISOString(),
      user_agent: 'PDT Daily Test',
      url: 'http://localhost:3001',
      referrer: 'test'
    };
    
    // Insert both events
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert([todayEvent, yesterdayEvent])
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ PDT test events inserted successfully');
    }
    
    // Check daily analytics view
    console.log('\n📊 Checking daily analytics view...');
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .order('date', { ascending: false })
      .limit(5);
    
    if (dailyError) {
      console.error('❌ Daily analytics error:', dailyError);
    } else {
      console.log('✅ Daily analytics with PDT dates:');
      dailyData.forEach((day, index) => {
        const pdtDate = new Date(day.date).toLocaleDateString("en-US", {
          timeZone: "America/Los_Angeles",
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        console.log(`  ${index + 1}. ${pdtDate}: ${day.unique_visitors} visitors, ${day.total_events} events`);
      });
    }
    
    console.log('\n🎉 Daily PDT timezone test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDailyPDT(); 