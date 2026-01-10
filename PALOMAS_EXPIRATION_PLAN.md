# Palomas (DOV) Expiration Implementation Plan

## Overview
Palomas now expire **1 year after receipt**. This requires tracking individual transactions and expiring them automatically.

---

## Phase 1: Database Schema Updates

### Option A: Transaction-Based (Recommended)
Track each Paloma transaction with timestamp, then calculate active balance.

**New Table: `paloma_transactions`**
```sql
CREATE TABLE paloma_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount INTEGER NOT NULL,
  transaction_type VARCHAR(50) NOT NULL, -- 'purchase', 'received', 'sent', 'expired'
  source VARCHAR(100), -- 'paypal', 'transfer_from_user', 'admin_grant', etc.
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year'),
  is_expired BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast expiration checks
CREATE INDEX idx_paloma_expires_at ON paloma_transactions(expires_at, is_expired);
CREATE INDEX idx_paloma_user_id ON paloma_transactions(user_id);
```

**Add to `profiles` table:**
```sql
ALTER TABLE profiles
ADD COLUMN active_dov_balance INTEGER DEFAULT 0,
ADD COLUMN total_dov_ever_received INTEGER DEFAULT 0,
ADD COLUMN last_expiration_check TIMESTAMP WITH TIME ZONE;
```

### Option B: Simple Field (Easier but less accurate)
Just track "first received" date per user.

```sql
ALTER TABLE profiles
ADD COLUMN dov_first_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN dov_expires_at TIMESTAMP WITH TIME ZONE;
```

**Recommendation:** Use Option A (transaction-based) for accuracy.

---

## Phase 2: Migration of Existing Data

Backfill existing Paloma balances with created dates:

```sql
-- For existing users, assume they received their Palomas on account creation
INSERT INTO paloma_transactions (user_id, amount, transaction_type, source, received_at, expires_at)
SELECT
  id as user_id,
  dov_balance as amount,
  'migration' as transaction_type,
  'historical_balance' as source,
  created_at as received_at,
  (created_at + INTERVAL '1 year') as expires_at
FROM profiles
WHERE dov_balance > 0;
```

---

## Phase 3: Update PayPal Webhook

When Palomas are purchased, create transaction record:

**File: `netlify/functions/paypal-webhook.js`**

After updating `dov_balance`, add:
```javascript
// Insert transaction record for expiration tracking
await supabase
  .from('paloma_transactions')
  .insert([{
    user_id: userId,
    amount: palomasToAdd,
    transaction_type: 'purchase',
    source: 'paypal',
    received_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
  }])
```

---

## Phase 4: Update Transfer Functions

When users send/receive Palomas, track transactions:

**File: `src/main.jsx` - handlePalomasTransfer function**

```javascript
// When sending Palomas - deduct from oldest first (FIFO)
const { data: senderTransactions } = await supabase
  .from('paloma_transactions')
  .select('*')
  .eq('user_id', user.id)
  .eq('is_expired', false)
  .gte('expires_at', new Date().toISOString())
  .order('received_at', { ascending: true })

// Calculate how much to deduct from each transaction (FIFO)
let remaining = amount
for (const tx of senderTransactions) {
  if (remaining <= 0) break

  const deductAmount = Math.min(remaining, tx.amount)

  // Update or delete transaction
  if (tx.amount === deductAmount) {
    await supabase
      .from('paloma_transactions')
      .delete()
      .eq('id', tx.id)
  } else {
    await supabase
      .from('paloma_transactions')
      .update({ amount: tx.amount - deductAmount })
      .eq('id', tx.id)
  }

  remaining -= deductAmount
}

// Create new transaction for recipient
await supabase
  .from('paloma_transactions')
  .insert([{
    user_id: recipientProfile.id,
    amount: amount,
    transaction_type: 'received',
    source: `transfer_from_${profile.username}`,
    received_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }])
```

---

## Phase 5: Create Expiration Cron Job

**New File: `netlify/functions/expire-palomas.js`**

This runs daily (scheduled via Netlify):

```javascript
exports.handler = async (event, context) => {
  const { createClient } = require('@supabase/supabase-js')

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    console.log('Starting Paloma expiration check...')

    // Find all expired transactions
    const { data: expiredTransactions, error } = await supabase
      .from('paloma_transactions')
      .select('*')
      .lte('expires_at', new Date().toISOString())
      .eq('is_expired', false)

    if (error) throw error

    console.log(`Found ${expiredTransactions.length} expired transactions`)

    // Mark them as expired
    for (const tx of expiredTransactions) {
      await supabase
        .from('paloma_transactions')
        .update({ is_expired: true })
        .eq('id', tx.id)

      // Deduct from user's balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('dov_balance')
        .eq('id', tx.user_id)
        .single()

      if (profile) {
        const newBalance = Math.max(0, profile.dov_balance - tx.amount)

        await supabase
          .from('profiles')
          .update({
            dov_balance: newBalance,
            last_expiration_check: new Date().toISOString()
          })
          .eq('id', tx.user_id)

        console.log(`Expired ${tx.amount} Palomas for user ${tx.user_id}`)
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Expired ${expiredTransactions.length} transactions successfully`
      })
    }
  } catch (error) {
    console.error('Expiration error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    }
  }
}
```

**Schedule it in `netlify.toml`:**
```toml
[[functions]]
  name = "expire-palomas"
  schedule = "0 0 * * *"  # Daily at midnight
```

---

## Phase 6: UI Updates - Show Expiring Soon

**New Component: `ExpirationWarning.jsx`**

```javascript
import React, { useState, useEffect } from 'react'

function ExpirationWarning({ supabase, userId }) {
  const [expiringSoon, setExpiringSoon] = useState(0)

  useEffect(() => {
    if (!supabase || !userId) return

    const checkExpiring = async () => {
      const thirtyDaysFromNow = new Date()
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

      const { data } = await supabase
        .from('paloma_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('is_expired', false)
        .lte('expires_at', thirtyDaysFromNow.toISOString())

      const total = data?.reduce((sum, tx) => sum + tx.amount, 0) || 0
      setExpiringSoon(total)
    }

    checkExpiring()
  }, [supabase, userId])

  if (expiringSoon === 0) return null

  return (
    <div style={{
      background: '#fff3cd',
      border: '1px solid #ffc107',
      borderRadius: '10px',
      padding: '0.75rem',
      margin: '1rem 0',
      color: '#856404'
    }}>
      ⚠️ <strong>{expiringSoon} Palomas</strong> expiring in the next 30 days!
    </div>
  )
}

export default ExpirationWarning
```

Add to Dashboard:
```javascript
import ExpirationWarning from './ExpirationWarning'

// In Dashboard render:
<ExpirationWarning supabase={supabase} userId={user?.id} />
```

---

## Phase 7: Helper Function - Calculate Active Balance

**New File: `src/utils/palomaUtils.js`**

```javascript
export async function getActivePalomasBalance(supabase, userId) {
  const { data, error } = await supabase
    .from('paloma_transactions')
    .select('amount')
    .eq('user_id', userId)
    .eq('is_expired', false)
    .gte('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error fetching active Palomas:', error)
    return 0
  }

  return data.reduce((sum, tx) => sum + tx.amount, 0)
}

export async function getPalomasExpirationBreakdown(supabase, userId) {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  const { data } = await supabase
    .from('paloma_transactions')
    .select('amount, expires_at')
    .eq('user_id', userId)
    .eq('is_expired', false)
    .gte('expires_at', now.toISOString())
    .order('expires_at', { ascending: true })

  let expiring30Days = 0
  let expiring90Days = 0
  let active = 0

  data?.forEach(tx => {
    const expiresAt = new Date(tx.expires_at)
    if (expiresAt <= thirtyDays) {
      expiring30Days += tx.amount
    } else if (expiresAt <= ninetyDays) {
      expiring90Days += tx.amount
    } else {
      active += tx.amount
    }
  })

  return {
    expiring30Days,
    expiring90Days,
    active,
    total: expiring30Days + expiring90Days + active
  }
}
```

---

## Implementation Steps Summary

1. ✅ **Create SQL migration** - Add `paloma_transactions` table
2. ✅ **Backfill existing data** - Migrate current balances
3. ✅ **Update PayPal webhook** - Create transaction on purchase
4. ✅ **Update transfer functions** - Track send/receive with FIFO
5. ✅ **Create expiration cron job** - Daily expiration check
6. ✅ **Add UI warnings** - Show expiring soon
7. ✅ **Update Virgil knowledge** - Tell users about expiration

---

## Testing Plan

1. Create test user with known transaction dates
2. Manually set `expires_at` to tomorrow
3. Run expiration function
4. Verify balance decreases
5. Verify UI shows warning

---

## Rollout Strategy

**Phase 1:** Database only (no enforcement)
- Add tables and start tracking
- Don't expire anything yet
- Let data accumulate for 1 month

**Phase 2:** Warnings only
- Show expiration warnings
- Don't actually expire yet
- Give users 30-day notice

**Phase 3:** Full enforcement
- Start running expiration cron
- Palomas actually expire

This gives users time to adjust!
