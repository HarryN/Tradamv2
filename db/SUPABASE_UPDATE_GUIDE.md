# Supabase Update Instructions

## Quick Summary
Run the SQL file below in your Supabase SQL Editor to fix the dispute system and prepare it for the new AI account insights feature.

---

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor
- Go to your Supabase project dashboard
- Navigate to **SQL Editor**
- Click **New Query**

### 2. Copy & Paste the SQL
Copy the entire content from:
```
tradam/db/migrations/016_fix_dispute_system_for_ai.sql
```

### 3. Execute
Click **Run** (or press `Ctrl+Enter`)

---

## What This SQL Does

✅ **Creates/Verifies Tables**
- `disputes` — main dispute table
- `dispute_messages` — real-time chat for all parties
- `dispute_evidence` — uploaded proof files

✅ **Creates Indexes** for fast queries
- On dispute_id, initiator_id, status, created_at

✅ **Enables Row Level Security (RLS)**
- Only parties involved in a dispute can view/send messages
- Only admins can update dispute status/resolution

✅ **Enables Realtime**
- Supabase Realtime publication for live message updates

✅ **Fixes the Relationship Error**
- Removed foreign key join to `profiles` table (was causing "Could not find relationship" error)

---

## Verification Checklist

After running the SQL, verify:

- [ ] Tables exist in Supabase > Tables view
- [ ] RLS policies are showing in Supabase > RLS section
- [ ] `supabase_realtime` publication includes all 3 tables
- [ ] Try opening a dispute chat in your app — should no longer error

---

## If You Already Have Old Migrations

The SQL safely:
- Uses `CREATE TABLE IF NOT EXISTS` (won't overwrite)
- Drops and recreates policies (ensures consistency)
- Uses idempotent commands where possible

No data loss — existing disputes/messages are preserved.

---

## Alternative: Run Individual Migration Files

If you prefer to run migrations one by one:

```bash
# From tradam/db/migrations/
psql --db=your_db < 011_create_disputes.sql
psql --db=your_db < 012_create_dispute_messages.sql
psql --db=your_db < 014_enable_realtime.sql
psql --db=your_db < 016_fix_dispute_system_for_ai.sql
```

(Replace `your_db` with your actual connection string)

---

## Need Help?

- **Error: "relation does not exist"** → Make sure `order_items`, `orders`, and `profiles` tables exist first
- **Error: "syntax error"** → Copy the entire file without modifications
- **Realtime not working** → Ensure the publication was created and tables are added
