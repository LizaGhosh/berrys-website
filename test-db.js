require('dotenv').config({ path: '.env.local' });

const { database } = require('./lib/supabase.ts');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic analytics
    const analytics = await database.getAnalytics();
    console.log('Analytics:', {
      totalUsers: analytics.totalUsers,
      uniqueVisitors: analytics.uniqueVisitors,
      funnelDataCount: analytics.funnelData.length,
      recentUsersCount: analytics.recentUsers.length
    });
    
    // Test daily analytics
    const dailyAnalytics = await database.getDailyAnalytics();
    console.log('Daily analytics count:', dailyAnalytics.length);
    console.log('Daily analytics sample:', dailyAnalytics.slice(0, 2));
    
    // Test cities
    const cities = await database.getCities();
    console.log('Cities:', cities);
    
    // Test day details for today
    const today = new Date().toISOString().split('T')[0];
    const dayDetails = await database.getDayDetails(today);
    console.log('Day details for today:', dayDetails.length, 'sessions');
    
    if (dayDetails.length > 0) {
      console.log('Sample session:', {
        session_id: dayDetails[0].session_id,
        ip_address: dayDetails[0].ip_address,
        ip_city: dayDetails[0].ip_city,
        ip_country: dayDetails[0].ip_country,
        ip_isp: dayDetails[0].ip_isp,
        ip_timezone: dayDetails[0].ip_timezone,
        location_summary: dayDetails[0].location_summary
      });
    }
    
  } catch (error) {
    console.error('Database test error:', error);
  }
}

testDatabase(); 