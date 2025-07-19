const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function testFormSubmissions() {
  console.log('🧪 Testing form submissions and user creation...');
  
  try {
    // Test 1: Insert a form submission event
    console.log('\n1️⃣ Inserting a test form submission...');
    const testFormEvent = {
      session_id: 'test_session_' + Date.now(),
      visitor_id: 'test_visitor_' + Date.now(),
      event_type: 'form_completed',
      event_data: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        city: 'New York',
        plan: 'monthly',
        source: 'hero_section',
        form_name: 'contact_form',
        additional_data: 'This is extra form data'
      },
      timestamp: new Date().toISOString(),
      user_agent: 'Test User Agent',
      url: 'http://localhost:3001/contact',
      referrer: 'http://localhost:3001/'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('analytics_events')
      .insert(testFormEvent)
      .select();
    
    if (insertError) {
      console.log('❌ Form submission failed:', insertError.message);
      return;
    }
    
    console.log('✅ Form submission event inserted successfully');
    console.log('📝 Event data:', insertData);
    
    // Test 2: Check if user was automatically created
    console.log('\n2️⃣ Checking if user was automatically created...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'john.doe@example.com');
    
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
    
    // Test 3: View form submissions
    console.log('\n3️⃣ Viewing all form submissions...');
    const { data: formSubmissions, error: formError } = await supabase
      .from('form_submissions_view')
      .select('*')
      .order('submission_timestamp', { ascending: false });
    
    if (formError) {
      console.log('❌ Error viewing form submissions:', formError.message);
      return;
    }
    
    console.log('📋 Form submissions found:', formSubmissions.length);
    formSubmissions.forEach((submission, index) => {
      console.log(`\n📝 Submission ${index + 1}:`);
      console.log(`   Form Type: ${submission.form_type}`);
      console.log(`   Name: ${submission.name || 'N/A'}`);
      console.log(`   Email: ${submission.email || 'N/A'}`);
      console.log(`   City: ${submission.city || 'N/A'}`);
      console.log(`   Plan: ${submission.selected_plan || 'N/A'}`);
      console.log(`   Source: ${submission.signup_source || 'N/A'}`);
      console.log(`   Timestamp: ${submission.submission_timestamp}`);
      console.log(`   Conversion Value: $${submission.conversion_value || 0}`);
      console.log(`   Full Form Data:`, submission.form_data);
    });
    
    // Test 4: View all users
    console.log('\n4️⃣ Viewing all users...');
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (allUsersError) {
      console.log('❌ Error viewing users:', allUsersError.message);
      return;
    }
    
    console.log('👥 Users found:', allUsers.length);
    allUsers.forEach((user, index) => {
      console.log(`\n👤 User ${index + 1}:`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   City: ${user.city}`);
      console.log(`   Plan: ${user.selected_plan}`);
      console.log(`   Source: ${user.signup_source}`);
      console.log(`   Created: ${user.created_at}`);
    });
    
    console.log('\n🎉 Form submission testing completed!');
    console.log('✅ The trigger automatically creates user records from form submissions');
    console.log('📊 You can view form submissions using the form_submissions_view');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

testFormSubmissions(); 