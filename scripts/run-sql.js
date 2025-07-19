const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables must be set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSQL() {
  try {
    console.log('Reading SQL file...');
    const sql = fs.readFileSync('scripts/reset-analytics-tables.sql', 'utf8');
    
    console.log('Executing SQL...');
    // Split SQL into individual statements
    const statements = sql.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error('SQL execution error:', error);
          // Continue with other statements
        }
      }
    }
    
    console.log('SQL execution completed!');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runSQL(); 