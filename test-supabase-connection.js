// Test Supabase connection and data insertion
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? 'Present' : 'Missing');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: Check if we can read from analytics_events
    console.log('\n1. Testing read access...');
    const { data: readData, error: readError } = await supabase
      .from('analytics_events')
      .select('*')
      .limit(1);
    
    if (readError) {
      console.error('❌ Read error:', readError);
    } else {
      console.log('✅ Read access working, found', readData?.length || 0, 'records');
    }
    
    // Test 2: Try to insert a test record
    console.log('\n2. Testing insert access...');
    const testRecord = {
      session_id: 'test_session_' + Date.now(),
      visitor_id: 'test_visitor_' + Date.now(),
      event_type: 'test_event',
      event_data: { test: true },
      timestamp: new Date().toISOString(),
      user_agent: 'Test Script',
      url: 'http://localhost:3001',
      referrer: 'test'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(testRecord)
      .select();
    
    if (insertError) {
      console.error('❌ Insert error:', insertError);
      console.log('💡 This means RLS policies are blocking writes');
    } else {
      console.log('✅ Insert working!');
    }
    
    // Test 3: Check if tables exist
    console.log('\n3. Checking table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('analytics_events')
      .select('session_id, visitor_id, event_type, timestamp')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Table structure error:', tableError);
    } else {
      console.log('✅ Table structure looks good');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

testConnection(); 