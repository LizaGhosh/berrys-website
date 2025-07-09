# 📊 Analytics Database Scripts

Essential SQL scripts for managing your Berrys.ai analytics database.

## 🗂️ Available Scripts

| Script | Purpose | When to Use |
|--------|---------|-------------|
| **setup-supabase-database.sql** | Initial database setup | First-time setup |
| **analytics-queries.sql** | Basic analytics queries | Daily monitoring |
| **export-all-data.sql** | Export data to CSV/JSON | Data backup/analysis |
| **data-retention-policy.sql** | Cleanup old data | Monthly maintenance |
| **reset-database.sql** | Delete all data | Testing/cleanup |

## 🚀 Quick Usage

### 1. **Export Your Data**
```sql
-- In Supabase SQL Editor, run sections from:
scripts/export-all-data.sql
```

### 2. **Delete All Data** 
```sql
-- WARNING: This deletes everything!
DELETE FROM events;
DELETE FROM sessions; 
DELETE FROM users;
```

### 3. **Basic Analytics**
```sql
-- Run queries from:
scripts/analytics-queries.sql
```

## 🔄 API Export (Alternative)

Instead of SQL, you can also export data via API:

```bash
# Download all data as JSON
curl "http://localhost:3000/api/export" > analytics_export.json

# Download specific table as CSV
curl "http://localhost:3000/api/export?table=users&format=csv" > users.csv
```

## 📋 Available API Export Options

| Format | URL Example |
|--------|-------------|
| All data (JSON) | `/api/export` |
| Users only (CSV) | `/api/export?table=users&format=csv` |
| Sessions only (CSV) | `/api/export?table=sessions&format=csv` |
| Events only (CSV) | `/api/export?table=events&format=csv` |
| Summary (CSV) | `/api/export?table=summary&format=csv` |

---
**Need help?** All scripts include detailed comments and instructions. 