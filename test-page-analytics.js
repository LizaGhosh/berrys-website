// Test page analytics by simulating user interactions
const puppeteer = require('puppeteer');

async function testPageAnalytics() {
  console.log('🧪 Testing page analytics...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Set to true for headless mode
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('Browser:', msg.text()));
    
    // Navigate to the page
    console.log('📱 Navigating to localhost:3001...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Wait a bit for analytics to initialize
    await page.waitForTimeout(2000);
    
    // Simulate some user interactions
    console.log('🖱️ Simulating user interactions...');
    
    // Click on a button
    await page.click('button:contains("Book Demo")');
    await page.waitForTimeout(1000);
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(1000);
    
    // Click on pricing section
    await page.click('button:contains("Monthly")');
    await page.waitForTimeout(1000);
    
    console.log('✅ Test completed! Check browser console for analytics logs.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  testPageAnalytics();
} catch (error) {
  console.log('📝 Manual test instructions:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Open browser developer tools (F12)');
  console.log('3. Go to Console tab');
  console.log('4. Look for analytics logs starting with 📊');
  console.log('5. Interact with the page (click buttons, scroll)');
  console.log('6. Check if analytics events are being logged');
} 