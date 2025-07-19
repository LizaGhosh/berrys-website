#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables must be set"
    echo "Please set them in your .env.local file"
    exit 1
fi

echo "=========================================="
echo "Analytics Tables Setup"
echo "=========================================="
echo ""
echo "Your Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo ""
echo "Please copy the SQL below and run it in your Supabase Dashboard:"
echo "1. Go to your Supabase project dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Paste the SQL below and run it"
echo ""
echo "=========================================="
echo "SQL TO EXECUTE:"
echo "=========================================="
cat scripts/reset-analytics-tables.sql
echo ""
echo "=========================================="
echo "After running the SQL, your analytics tables will be ready!"
echo "==========================================" 