// Test script to verify analytics are working
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAnalytics() {
  try {
    console.log('🧪 Testing analytics connection...');
    
    // Test 1: Check if tables exist
    console.log('\n1. Checking tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('analytics_events')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Tables error:', tablesError);
    } else {
      console.log('✅ analytics_events table accessible');
    }
    
    // Test 2: Insert a test event
    console.log('\n2. Inserting test event...');
    const testEvent = {
      session_id: 'test_session_' + Date.now(),
      visitor_id: 'test_visitor_' + Date.now(),
      event_type: 'test_event',
      event_data: { test: true, timestamp: new Date().toISOString() },
      timestamp: new Date().toISOString(),
      user_agent: 'Test Script',
      url: 'http://localhost:3000',
      referrer: 'test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(testEvent)
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Test event inserted successfully');
    }
    
    // Test 3: Check views
    console.log('\n3. Checking views...');
    const { data: dailyData, error: dailyError } = await supabase
      .from('daily_analytics')
      .select('*')
      .limit(5);
    
    if (dailyError) {
      console.error('❌ Daily analytics error:', dailyError);
    } else {
      console.log('✅ Daily analytics view working, found', dailyData?.length || 0, 'records');
    }
    
    console.log('\n🎉 Analytics test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAnalytics(); 