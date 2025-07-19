-- Debug Form Submissions
-- Check if everything is working properly

-- 1. Check if the trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_create_user_from_form';

-- 2. Check if the function exists
SELECT 
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'create_user_from_form';

-- 3. Check recent analytics_events for form submissions
SELECT 
  id,
  event_type,
  timestamp,
  event_data
FROM analytics_events 
WHERE event_type IN ('form_completed', 'signup_completed', 'form_submit')
ORDER BY timestamp DESC
LIMIT 10;

-- 4. Check if users are being created
SELECT 
  id,
  name,
  email,
  city,
  selected_plan,
  signup_source,
  created_at
FROM users 
ORDER BY created_at DESC
LIMIT 10;

-- 5. Check the form_submissions_view directly
SELECT 
  id,
  form_type,
  name,
  email,
  city,
  selected_plan,
  signup_source,
  submission_timestamp,
  conversion_value
FROM form_submissions_view 
ORDER BY submission_timestamp DESC
LIMIT 10;

-- 6. Test the view logic manually
SELECT 
  ae.id,
  ae.session_id,
  ae.visitor_id,
  CASE 
    WHEN ae.event_type = 'signup_completed' THEN 'signup'
    WHEN ae.event_type = 'form_completed' THEN COALESCE(ae.event_data->>'form_name', 'contact')
    WHEN ae.event_type = 'form_submit' THEN COALESCE(ae.event_data->>'form_id', 'contact')
    ELSE 'unknown'
  END as form_type,
  ae.event_data as form_data,
  ae.timestamp as submission_timestamp,
  u.name,
  u.email,
  u.city,
  u.selected_plan,
  u.signup_source,
  CASE 
    WHEN ae.event_data->>'plan' = 'annual' THEN 30.00
    WHEN ae.event_data->>'plan' = 'monthly' THEN 5.00
    ELSE 0.00
  END as conversion_value
FROM analytics_events ae
LEFT JOIN users u ON u.email = COALESCE(ae.event_data->>'email', ae.event_data->>'user_email')
WHERE ae.event_type IN ('signup_completed', 'form_completed', 'form_submit')
ORDER BY ae.timestamp DESC
LIMIT 10; 