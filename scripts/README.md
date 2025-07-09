# Database Setup Scripts

This directory contains SQL scripts to set up your Supabase database for berrys.ai analytics.

## Quick Start

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project
2. **Run Setup Script**: Copy and paste `setup-supabase-database.sql` in your Supabase SQL Editor
3. **Get Environment Variables**: Copy your project URL and anon key to Vercel environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Files

- **setup-supabase-database.sql**: Creates all necessary tables (users, events, sessions)
- **analytics-queries.sql**: Pre-written queries for analyzing your data
- **README.md**: This file

## Tables Created

- **users**: Stores user signups with plan selection
- **events**: Tracks all user interactions (page views, clicks, etc.)
- **sessions**: Tracks unique visitors and conversion status

## Analytics Queries

After you have data, use the queries in `analytics-queries.sql` to analyze:
- Daily signup trends
- Conversion funnel performance  
- Traffic sources
- User journey analysis
- Geographic insights

## Environment Variables Needed

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GA_TRACKING_ID=your_google_analytics_id # Optional
``` 