# Palomas Expiration System - Implementation Complete ✅

## Overview
The Palomas expiration system has been **fully implemented**. Palomas now expire 1 year after receipt, with FIFO (First In, First Out) tracking for transfers.

---

## What Was Implemented

### ✅ Phase 1: Database Schema
**Files Created:**
- [supabase/migrations/001_create_paloma_transactions.sql](supabase/migrations/001_create_paloma_transactions.sql)
- [supabase/migrations/002_backfill_existing_palomas.sql](supabase/migrations/002_backfill_existing_palomas.sql)

**What it does:**
- Creates `paloma_transactions` table to track individual Paloma transactions
- Adds indexes for fast expiration queries
- Adds new columns to `profiles`: `active_dov_balance`, `total_dov_ever_received`, `last_expiration_check`
- Sets up Row Level Security policies
- Backfills existing user balances into the transaction system

**Table Schema:**
```sql
paloma_transactions (
  id UUID PRIMARY KEY,
  user_id UUID (FK to profiles),
  amount INTEGER,
  transaction_type VARCHAR(50), -- 'purchase', 'received', 'sent', 'expired', 'migration'
  source VARCHAR(100),
  received_at TIMESTAMP,
  expires_at TIMESTAMP, -- received_at + 1 year
  is_expired BOOLEAN,
  metadata JSONB
)
```

---

### ✅ Phase 2: PayPal Webhook Integration
**File Modified:**
- [netlify/functions/paypal-webhook.js:224-251](netlify/functions/paypal-webhook.js#L224-L251)

**What it does:**
- When a PayPal payment is completed, creates a transaction record
- Sets `expires_at` to 1 year from purchase date
- Stores PayPal transaction metadata for auditing

---

### ✅ Phase 3: Transfer Function with FIFO
**File Modified:**
- [grail/src/main.jsx:511-648](grail/src/main.jsx#L511-L648)

**What it does:**
- Replaces simple balance transfer with FIFO transaction management
- When sending Palomas:
  1. Fetches sender's active transactions (oldest first)
  2. Deducts from oldest transactions first
  3. Deletes or reduces transaction amounts
  4. Creates new transaction for recipient with fresh 1-year expiration
- Recipient gets a brand new 1-year timer on received Palomas

---

### ✅ Phase 4: Expiration Cron Job
**Files Created/Modified:**
- [netlify/functions/expire-palomas.js](netlify/functions/expire-palomas.js) (new)
- [netlify.toml:4-6](netlify.toml#L4-L6) (scheduled function)

**What it does:**
- Runs **daily at midnight UTC** via Netlify scheduled functions
- Finds all transactions where `expires_at <= now` and `is_expired = false`
- Marks them as expired
- Deducts from user's `dov_balance`
- Logs detailed information about expirations

**Schedule:** `0 0 * * *` (every day at midnight)

---

### ✅ Phase 5: UI Warning Component
**Files Created/Modified:**
- [src/components/ExpirationWarning.jsx](src/components/ExpirationWarning.jsx) (new)
- [src/components/Dashboard.jsx:8,1905-1906](src/components/Dashboard.jsx#L1905-L1906) (integration)

**What it does:**
- Displays prominent warning if Palomas expiring in next 30 days
- Shows info banner if Palomas expiring in 31-90 days
- Refreshes every 5 minutes
- Shows countdown to next expiration
- Beautiful gradient design matching Casa de Copas aesthetic

**Warning Levels:**
- 🟡 **0-30 days:** Large yellow warning with countdown
- 🔵 **31-90 days:** Smaller blue info banner
- ✅ **90+ days:** No warning shown

---

### ✅ Phase 6: Utility Functions
**File Created:**
- [src/utils/palomaUtils.js](src/utils/palomaUtils.js)

**Functions Available:**
```javascript
getActivePalomasBalance(supabase, userId)
// Returns total active (non-expired) Palomas

getPalomasExpirationBreakdown(supabase, userId)
// Returns { expiring30Days, expiring90Days, active, total }

getActiveTransactions(supabase, userId)
// Returns array of all active transaction objects

daysUntilExpiration(expirationDate)
// Calculates days until a date expires

formatExpirationDate(expirationDate)
// Returns human-readable string like "Expires in 5 days"

syncDovBalance(supabase, userId)
// Syncs dov_balance with transaction total (maintenance)
```

---

### ✅ Phase 7: Virgil Knowledge Update
**File Modified:**
- [src/components/GPTChatWindow.jsx:116-127](src/components/GPTChatWindow.jsx#L116-L127)

**What it does:**
- Updates Virgil's fallback knowledge base with expiration info
- Tells users that Palomas expire 1 year after receipt
- Explains that transfers reset the expiration timer
- Encourages users to check dashboard for warnings

---

## Next Steps: Deployment

### Step 1: Run Database Migrations
You need to run the SQL migrations in Supabase:

1. **Go to Supabase Dashboard:** https://supabase.com/dashboard
2. **Select your project:** elkfhmyhiyyubtqzqlpq
3. **Go to SQL Editor**
4. **Run Migration 001:**
   - Copy contents of `supabase/migrations/001_create_paloma_transactions.sql`
   - Paste into SQL editor
   - Click "Run"
   - Verify success

5. **Run Migration 002:**
   - Copy contents of `supabase/migrations/002_backfill_existing_palomas.sql`
   - Paste into SQL editor
   - Click "Run"
   - Should see message: "Migration complete: X users migrated with Y total Palomas"

### Step 2: Verify Row Level Security
After migrations, verify RLS policies exist:

```sql
SELECT * FROM pg_policies WHERE tablename = 'paloma_transactions';
```

Should see 2 policies:
- "Users can view own transactions"
- "Service role has full access"

### Step 3: Add Service Role Key to Netlify
The expiration cron job needs the Supabase service role key:

1. **Go to Netlify Dashboard**
2. **Site settings → Environment variables**
3. **Add new variable:**
   - Key: `SUPABASE_SERVICE_ROLE_KEY`
   - Value: Get from Supabase → Settings → API → service_role key (secret)
4. **Redeploy site**

### Step 4: Deploy to Netlify
```bash
git add .
git commit -m "Implement Palomas expiration system with 1-year FIFO tracking"
git push
```

Netlify will automatically:
- Deploy the updated functions
- Schedule the `expire-palomas` function to run daily at midnight UTC

### Step 5: Test the Expiration Function Manually
Before waiting for midnight, test it manually:

1. **Go to Netlify Functions dashboard**
2. **Find `expire-palomas` function**
3. **Click "Trigger function"** or use curl:

```bash
curl -X POST https://YOUR-SITE.netlify.app/.netlify/functions/expire-palomas
```

Check the function logs to verify it runs successfully.

### Step 6: Test the Warning UI
1. **Create a test transaction with near expiration:**

```sql
-- Run this in Supabase SQL Editor to test
INSERT INTO paloma_transactions (user_id, amount, transaction_type, source, received_at, expires_at)
VALUES (
  'YOUR_USER_ID',
  10,
  'purchase',
  'test',
  NOW() - INTERVAL '11 months',
  NOW() + INTERVAL '1 month'
);
```

2. **Check Dashboard** - Should see yellow warning about 10 Palomas expiring soon

3. **Clean up test:**
```sql
DELETE FROM paloma_transactions WHERE source = 'test';
```

---

## Rollout Strategy (Recommended)

### Option A: Phased Rollout (Safer)
**Phase 1: Data Collection Only** (2 weeks)
- ✅ Migrations already set up for this
- Users' existing balances migrated with 1-year expiration from account creation
- New purchases/transfers tracked in transaction table
- **Don't run expiration cron yet** - just collect data
- Monitor for any issues

**Phase 2: Warnings Only** (2 weeks)
- Enable ExpirationWarning UI (already done)
- Show users what will expire
- Give 30-day advance warning
- Update Virgil to answer expiration questions

**Phase 3: Full Enforcement** (Go live)
- Enable `expire-palomas` cron job
- Palomas actually start expiring
- Announce via email/app notification

### Option B: Immediate Rollout
**If you want to go live immediately:**
1. Run migrations (creates table + backfills data)
2. Deploy to Netlify (enables warnings + cron job)
3. Announce to users that expiration is now active

⚠️ **Important:** Existing users will have Palomas that expire based on their account creation date. If someone created their account 11 months ago, their initial balance will expire in 1 month.

---

## Monitoring & Maintenance

### Check Expiration Logs
View cron job execution in Netlify Functions logs:
- Functions → expire-palomas → Logs
- Should run daily at midnight UTC
- Look for: "✅ Expiration complete! Total Palomas expired: X"

### Sync Balance Issues
If a user's `dov_balance` gets out of sync with transaction totals:

```javascript
import { syncDovBalance } from './utils/palomaUtils'

// In admin panel or console
await syncDovBalance(supabase, userId)
```

### View All Expiring Soon
```sql
SELECT
  p.username,
  SUM(pt.amount) as expiring_amount,
  MIN(pt.expires_at) as next_expiration
FROM paloma_transactions pt
JOIN profiles p ON pt.user_id = p.id
WHERE pt.is_expired = false
  AND pt.expires_at < NOW() + INTERVAL '30 days'
GROUP BY p.username
ORDER BY next_expiration;
```

---

## Testing Checklist

- [ ] Run database migrations successfully
- [ ] Verify paloma_transactions table exists
- [ ] Verify existing balances were backfilled
- [ ] Test PayPal purchase creates transaction record
- [ ] Test Palomas transfer uses FIFO logic
- [ ] Test recipient gets fresh 1-year expiration
- [ ] Test expiration cron job manually
- [ ] Test UI warning appears for soon-to-expire Palomas
- [ ] Test Virgil answers expiration questions correctly
- [ ] Verify scheduled function runs at midnight UTC

---

## User Communication Template

When you're ready to announce:

---

**🕊️ Important Update: Palomas Now Expire After 1 Year**

Casa de Copas is evolving! To keep our Paloma economy flowing and encourage active participation, **Palomas (DOV) now expire 1 year after you receive them.**

**What this means:**
- ✅ Palomas you purchase have a 1-year lifespan from purchase date
- ✅ When you gift Palomas, the recipient gets a fresh 1-year timer
- ✅ Your oldest Palomas are used first when sending (FIFO)
- ✅ Check your dashboard for expiration warnings

**Why this change?**
Palomas represent active love for Casa de Copas. By expiring after a year, we encourage you to use your Palomas—support events, book studio time, gift to friends—rather than hoarding. This keeps energy flowing through the community.

**What should you do?**
1. Check your dashboard for any expiration warnings
2. Use or gift Palomas before they expire
3. Remember: sending Palomas renews them for the recipient!

Questions? Ask Virgil in-app or email jp@casadecopas.com.

Con amor,
Casa de Copas

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PALOMAS EXPIRATION FLOW                  │
└─────────────────────────────────────────────────────────────┘

1. PURCHASE (PayPal)
   └─> paypal-webhook.js
       └─> Creates paloma_transaction (expires_at = now + 1 year)
       └─> Updates profile.dov_balance

2. TRANSFER (User to User)
   └─> main.jsx: handlePalomasTransfer()
       └─> Deducts from sender's oldest transactions (FIFO)
       └─> Creates new transaction for recipient (fresh 1-year timer)
       └─> Updates both users' dov_balance

3. EXPIRATION (Daily Cron)
   └─> expire-palomas.js (runs midnight UTC)
       └─> Finds expired transactions
       └─> Marks as expired
       └─> Deducts from profile.dov_balance

4. WARNING (UI)
   └─> Dashboard → ExpirationWarning
       └─> Queries transactions expiring in 30/90 days
       └─> Shows prominent warnings
```

---

## Files Changed Summary

### Created
- `supabase/migrations/001_create_paloma_transactions.sql`
- `supabase/migrations/002_backfill_existing_palomas.sql`
- `netlify/functions/expire-palomas.js`
- `src/components/ExpirationWarning.jsx`
- `src/utils/palomaUtils.js`
- `PALOMAS_EXPIRATION_IMPLEMENTATION.md` (this file)

### Modified
- `netlify/functions/paypal-webhook.js` (lines 224-251)
- `grail/src/main.jsx` (lines 511-648)
- `netlify.toml` (lines 4-6)
- `src/components/Dashboard.jsx` (lines 8, 1905-1906)
- `src/components/GPTChatWindow.jsx` (lines 116-127)

---

## Support & Troubleshooting

**"Migrations failed"**
- Check if table already exists: `SELECT * FROM paloma_transactions LIMIT 1;`
- Check for syntax errors in SQL
- Verify you have admin permissions in Supabase

**"Cron job not running"**
- Check Netlify Functions logs
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set in environment variables
- Verify schedule syntax: `0 0 * * *`
- Manual trigger to test: `/.netlify/functions/expire-palomas`

**"Balance out of sync"**
- Use `syncDovBalance(supabase, userId)` utility function
- Check for orphaned transactions
- Verify FIFO logic in transfers

**"Warning not showing"**
- Check console for errors
- Verify user has transactions expiring soon
- Check if `ExpirationWarning` component is imported in Dashboard

---

## Success! 🎉

The Palomas expiration system is now fully implemented and ready for deployment. Follow the "Next Steps" section above to go live.

This is the Era of CUPS. We drink deeply. We pour freely. We break only to be remade. 🕊️
