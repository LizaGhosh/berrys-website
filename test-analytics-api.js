// Test script for Analytics API with enhanced geolocation
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAnalyticsAPI() {
  console.log('🧪 Testing Analytics API with Enhanced Geolocation...\n');
  
  // Test event to send
  const testEvent = {
    event: 'page_loaded',
    sessionId: 'test_session_' + Date.now(),
    url: 'http://localhost:3000/test',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    timestamp: new Date().toISOString(),
    properties: {
      test: true,
      source: 'api_test'
    }
  };
  
  try {
    console.log('📤 Sending test event to analytics API...');
    console.log('Event data:', JSON.stringify(testEvent, null, 2));
    
    const response = await fetch('http://localhost:3000/api/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': '8.8.8.8', // Mock IP for testing
        'User-Agent': testEvent.userAgent
      },
      body: JSON.stringify(testEvent)
    });
    
    console.log(`\n📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Analytics API Response:', result);
      
      if (result.success) {
        console.log('\n🎉 SUCCESS: Event with enhanced geolocation sent successfully!');
        console.log('📍 The event should now have enhanced location data including:');
        console.log('   • Country, region, city details');
        console.log('   • Latitude/longitude coordinates');
        console.log('   • Timezone information');
        console.log('   • ISP and organization data');
        console.log('   • Connection type analysis');
        console.log('   • Mobile/proxy/hosting detection');
      } else {
        console.log('❌ API returned success=false');
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ API Error: ${response.status} - ${errorText}`);
    }
    
  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
    console.log('🔍 Make sure the development server is running on port 3000');
    console.log('   Run: npm run dev');
  }
}

// Run the test
testAnalyticsAPI().catch(console.error); 