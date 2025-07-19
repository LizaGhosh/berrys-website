// Test PDT timezone functionality
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPDTTimezone() {
  try {
    console.log('🧪 Testing PDT timezone...');
    
    // Get current time in PDT
    const now = new Date()
    const pdtTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}))
    
    console.log('📅 Current UTC time:', now.toISOString())
    console.log('📅 Current PDT time:', pdtTime.toISOString())
    console.log('📅 PDT formatted:', pdtTime.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }))
    
    // Insert a test event with PDT timestamp
    console.log('\n📊 Inserting test event with PDT timestamp...');
    const testEvent = {
      session_id: 'pdt_test_session_' + Date.now(),
      visitor_id: 'pdt_test_visitor_' + Date.now(),
      event_type: 'pdt_timezone_test',
      event_data: { 
        test: true, 
        utc_time: now.toISOString(),
        pdt_time: pdtTime.toISOString(),
        pdt_formatted: pdtTime.toLocaleString("en-US", {timeZone: "America/Los_Angeles"})
      },
      timestamp: pdtTime.toISOString(),
      user_agent: 'PDT Timezone Test',
      url: 'http://localhost:3001',
      referrer: 'test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(testEvent)
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ PDT test event inserted successfully');
      console.log('📊 Event timestamp:', insertData[0].timestamp);
    }
    
    // Check recent events to see timezone
    console.log('\n📊 Checking recent events...');
    const { data: events, error: eventsError } = await supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(3);
    
    if (eventsError) {
      console.error('❌ Events error:', eventsError);
    } else {
      console.log('✅ Recent events with timestamps:');
      events.forEach((event, index) => {
        const eventDate = new Date(event.timestamp)
        console.log(`  ${index + 1}. ${event.event_type} - ${eventDate.toLocaleString("en-US", {timeZone: "America/Los_Angeles"})}`);
      });
    }
    
    console.log('\n🎉 PDT timezone test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPDTTimezone(); 