const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testAnalyticsEvents() {
  console.log('🧪 Testing analytics_events table...');
  
  try {
    // Test 1: Check if table exists
    console.log('\n1️⃣ Testing table existence...');
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Table does not exist or error:', error.message);
      console.log('💡 You need to run the create-analytics-events-only.sql script first');
      return;
    }
    
    console.log('✅ analytics_events table exists');
    console.log('📊 Sample data:', data);
    
    // Test 2: Insert a test event
    console.log('\n2️⃣ Testing event insertion...');
    const testEvent = {
      session_id: 'test_session_' + Date.now(),
      visitor_id: 'test_visitor_' + Date.now(),
      event_type: 'test_event',
      event_data: { test: true, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      user_agent: 'Test User Agent',
      url: 'http://localhost:3001/test',
      referrer: null
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(testEvent)
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      return;
    }
    
    console.log('✅ Test event inserted successfully');
    console.log('📝 Inserted data:', insertData);
    
    console.log('\n🎉 analytics_events table is working correctly!');
    console.log('✅ You can now proceed to create the views and other tables.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testAnalyticsEvents(); 