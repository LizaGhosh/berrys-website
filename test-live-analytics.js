// Test script to generate live analytics data
const puppeteer = require('puppeteer');

async function generateAnalyticsData() {
  console.log('🧪 Generating live analytics data...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Show browser for debugging
    args: ['--no-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to the site
    console.log('📱 Loading site...');
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle0' });
    
    // Wait for analytics to initialize
    await page.waitForTimeout(2000);
    
    // Simulate user interactions
    console.log('🖱️  Simulating user interactions...');
    
    // Scroll down to trigger scroll events
    await page.evaluate(() => {
      window.scrollTo(0, 500);
    });
    await page.waitForTimeout(1000);
    
    // Click on some buttons
    const buttons = await page.$$('button');
    if (buttons.length > 0) {
      console.log('🔘 Clicking buttons...');
      await buttons[0].click();
      await page.waitForTimeout(500);
    }
    
    // Scroll more
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    await page.waitForTimeout(1000);
    
    // Hover over elements
    const links = await page.$$('a');
    if (links.length > 0) {
      console.log('🔗 Hovering over links...');
      await links[0].hover();
      await page.waitForTimeout(500);
    }
    
    // Wait for analytics to be sent
    console.log('⏳ Waiting for analytics to be sent...');
    await page.waitForTimeout(3000);
    
    console.log('✅ Analytics data generated!');
    console.log('📊 Check your dashboard at: http://localhost:3001/dashboard');
    
  } catch (error) {
    console.error('❌ Error generating analytics:', error);
  } finally {
    await browser.close();
  }
}

// Check if puppeteer is available
try {
  require('puppeteer');
  generateAnalyticsData();
} catch (error) {
  console.log('📝 Manual test instructions:');
  console.log('1. Open http://localhost:3001 in your browser');
  console.log('2. Scroll down the page');
  console.log('3. Click on buttons and links');
  console.log('4. Wait a few seconds');
  console.log('5. Check http://localhost:3001/dashboard');
  console.log('');
  console.log('Or install puppeteer: npm install puppeteer');
} 