const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testNewFormSubmission() {
  console.log('🧪 Testing new form submission...');
  
  try {
    // Step 1: Insert a new form submission
    console.log('\n1️⃣ Inserting new form submission...');
    const newFormEvent = {
      session_id: 'test_session_' + Date.now(),
      visitor_id: 'test_visitor_' + Date.now(),
      event_type: 'form_completed',
      event_data: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        city: 'Los Angeles',
        plan: 'annual',
        source: 'pricing_section',
        form_name: 'contact_form',
        additional_data: 'New test submission'
      },
      timestamp: new Date().toISOString(),
      user_agent: 'Test User Agent',
      url: 'http://localhost:3001/contact',
      referrer: 'http://localhost:3001/'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(newFormEvent)
      .select();
    
    if (insertError) {
      console.log('❌ Form submission failed:', insertError.message);
      return;
    }
    
    console.log('✅ New form submission inserted successfully');
    console.log('📝 Event data:', insertData);
    
    // Step 2: Wait a moment for trigger to process
    console.log('\n2️⃣ Waiting for trigger to process...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Check if user was created
    console.log('\n3️⃣ Checking if user was created...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'jane.smith@example.com');
    
    if (usersError) {
      console.log('❌ Error checking users:', usersError.message);
      return;
    }
    
    if (users && users.length > 0) {
      console.log('✅ User automatically created!');
      console.log('👤 User data:', users[0]);
    } else {
      console.log('❌ User was not created automatically');
    }
    
    // Step 4: Check form_submissions_view
    console.log('\n4️⃣ Checking form_submissions_view...');
    const { data: formSubmissions, error: formError } = await supabase
      .from('form_submissions_view')
      .select('*')
      .eq('email', 'jane.smith@example.com');
    
    if (formError) {
      console.log('❌ Error checking form_submissions_view:', formError.message);
      return;
    }
    
    console.log('📋 Form submissions found:', formSubmissions.length);
    if (formSubmissions.length > 0) {
      console.log('✅ Form submission appears in view!');
      console.log('📝 Submission data:', formSubmissions[0]);
    } else {
      console.log('❌ Form submission not found in view');
    }
    
    // Step 5: Check all recent form submissions
    console.log('\n5️⃣ Checking all recent form submissions...');
    const { data: allSubmissions, error: allSubmissionsError } = await supabase
      .from('form_submissions_view')
      .select('*')
      .order('submission_timestamp', { ascending: false })
      .limit(5);
    
    if (allSubmissionsError) {
      console.log('❌ Error checking all submissions:', allSubmissionsError.message);
      return;
    }
    
    console.log('📋 All recent submissions:', allSubmissions.length);
    allSubmissions.forEach((submission, index) => {
      console.log(`\n📝 Submission ${index + 1}:`);
      console.log(`   Email: ${submission.email}`);
      console.log(`   Name: ${submission.name}`);
      console.log(`   Form Type: ${submission.form_type}`);
      console.log(`   Timestamp: ${submission.submission_timestamp}`);
    });
    
    console.log('\n🎉 Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testNewFormSubmission(); 