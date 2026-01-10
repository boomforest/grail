# Doves & Eggs System - Implementation Complete ✅

## Overview
The dual-send mechanic is now **fully implemented**. Users can send Palomas two ways:
- **Send Doves** 🕊️: Instant, complete transfer for objective exchanges
- **Send Eggs** 🥚: 50% immediate, 50% escrow for creative work with approval workflow

This is **cultural infrastructure** — turning payments into clean agreements without legal friction.

---

## What Was Implemented

### ✅ Phase 1: Database Schema for Escrow

**File Created:**
- [supabase/migrations/003_create_eggs_transactions.sql](supabase/migrations/003_create_eggs_transactions.sql)

**What it does:**
- Creates `eggs_transactions` table to track escrowed Palomas ("Eggs in Flight")
- Adds `eggs_pending_sent` and `eggs_pending_received` columns to profiles
- Creates auto-expiration function for overdue eggs (7+ days past delivery window)
- Sets up Row Level Security policies

**Table Schema:**
```sql
eggs_transactions (
  id UUID PRIMARY KEY,
  sender_id UUID,
  recipient_id UUID,
  total_amount INTEGER, -- Full amount of eggs sent
  hatched_amount INTEGER, -- 50% that landed immediately
  pending_amount INTEGER, -- 50% in escrow
  status VARCHAR(50), -- pending, work_uploaded, approved, disputed, resolved, expired
  work_description TEXT,
  work_delivery_url TEXT, -- Where recipient uploads work
  delivery_window_days INTEGER DEFAULT 30,
  expected_delivery_date TIMESTAMP,
  work_uploaded_at TIMESTAMP,
  reviewed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  dispute_opened_at TIMESTAMP,
  dispute_notes TEXT,
  metadata JSONB
)
```

**Status Flow:**
```
pending → work_uploaded → approved/disputed → resolved
```

---

### ✅ Phase 2: SendDovesEggs Component

**File Created:**
- [src/components/SendDovesEggs.jsx](src/components/SendDovesEggs.jsx)

**What it does:**
- Beautiful dual-choice interface with explainer modals
- **Send Doves:** Immediate FIFO transfer using existing Palomas transaction system
- **Send Eggs:** Splits amount 50/50, creates escrow record, fresh 1-year expiration for recipient
- Clean visual design with doves (blue) and eggs (orange) color schemes
- Help icons explaining each option
- Customizable delivery window (7, 14, 30, 60, 90 days)

**User Flow:**
1. Tap "Send 🕊️🥚" button in Palomas menu
2. Choose Doves or Eggs (with help icons)
3. Enter recipient, amount, and (for Eggs) work description
4. Confirm send
5. For Eggs: 50% hatches immediately, 50% goes into escrow

---

### ✅ Phase 3: EggsInFlight Component

**File Created:**
- [src/components/EggsInFlight.jsx](src/components/EggsInFlight.jsx)

**What it does:**
- Manages all eggs the user sent or received
- **Two tabs:**
  - "Received" - Eggs where you need to upload work
  - "Sent" - Eggs where you're awaiting work approval
- **Recipient actions:**
  - Upload work URL (Dropbox, Google Drive, etc.)
  - Changes status to `work_uploaded`
- **Sender actions:**
  - View uploaded work
  - Approve (releases pending 50% to recipient)
  - Open dispute (starts mediation process)
- Shows days remaining until delivery deadline
- Visual indicators for overdue, pending, work uploaded, disputed

**Card Information:**
- Shows other party's username
- Work description
- Total amount (hatched vs pending)
- Days remaining/overdue
- Status badge

---

### ✅ Phase 4: Integration

**Files Modified:**
- [src/main.jsx:8-9,49-50,1227-1261](src/main.jsx)
- [src/components/PalomasMenu.jsx:15-16,106-172](src/components/PalomasMenu.jsx)

**What it does:**
- Added state for `showSendDovesEggs` and `showEggsInFlight`
- Added conditional renders for both components
- Updated PalomasMenu with new buttons:
  - "Send 🕊️🥚" - Opens SendDovesEggs
  - "Eggs in Flight 🥚" - Opens EggsInFlight
- Passes handlers from main to PalomasMenu to all instances

---

### ✅ Phase 5: Virgil Knowledge Update

**File Modified:**
- [src/components/GPTChatWindow.jsx:116-145](src/components/GPTChatWindow.jsx)

**What it does:**
- Added comprehensive explanation of Doves vs Eggs
- Explains when to use each
- Describes escrow workflow
- Emphasizes "cultural infrastructure" and "clean agreements without legal friction"

---

## How It Works

### Send Doves Workflow 🕊️

1. **User initiates send**
   - Selects "Send Doves" option
   - Enters recipient username and amount

2. **FIFO deduction from sender**
   - Fetches sender's active `paloma_transactions` (oldest first)
   - Deducts from oldest transactions
   - Deletes or reduces transaction amounts

3. **Create new transaction for recipient**
   - Creates new `paloma_transaction` for recipient
   - Fresh 1-year expiration from receipt date
   - Source: `doves_from_{sender_username}`

4. **Update balances**
   - Deduct from sender's `dov_balance`
   - Add to recipient's `dov_balance`

5. **Complete**
   - Instant, irreversible transfer

---

### Send Eggs Workflow 🥚

1. **User initiates send**
   - Selects "Send Eggs" option
   - Enters recipient, amount, work description, delivery window

2. **Calculate split**
   - `hatchedAmount` = Math.floor(totalAmount / 2)
   - `pendingAmount` = totalAmount - hatchedAmount
   - Example: 100 Palomas → 50 hatched, 50 pending

3. **FIFO deduction (full amount)**
   - Deducts FULL amount from sender using FIFO
   - Stores used transaction IDs for tracking

4. **Create hatched transaction**
   - Creates `paloma_transaction` for hatched amount (50%)
   - Recipient gets this immediately
   - Fresh 1-year expiration
   - Source: `eggs_hatched_from_{sender_username}`

5. **Create escrow record**
   - Creates `eggs_transaction` record
   - Status: `pending`
   - Stores work description and delivery window
   - Expected delivery date = now + delivery_window_days

6. **Update balances and eggs tracking**
   - Sender: `dov_balance -= totalAmount`, `eggs_pending_sent += pendingAmount`
   - Recipient: `dov_balance += hatchedAmount`, `eggs_pending_received += pendingAmount`

7. **Recipient uploads work**
   - Visits "Eggs in Flight" → Received tab
   - Enters URL to completed work
   - Status changes to `work_uploaded`

8. **Sender reviews**
   - Opens "Eggs in Flight" → Sent tab
   - Views uploaded work
   - **Option A: Approve**
     - Creates new `paloma_transaction` for pending amount
     - Recipient gets remaining 50%
     - Fresh 1-year expiration
     - Updates balances and eggs counters
     - Status: `approved`
   - **Option B: Dispute**
     - Opens dispute with notes
     - Status: `disputed`
     - Casa de Copas facilitates resolution (not automated)

9. **Auto-expiration safety valve**
   - If 7+ days past expected delivery date
   - Auto-approves to prevent indefinite escrow
   - Releases pending amount to recipient

---

## Database Migration Required

### Step 1: Run SQL Migration

**In Supabase Dashboard:**
1. Go to SQL Editor
2. Copy contents of `supabase/migrations/003_create_eggs_transactions.sql`
3. Run the migration
4. Verify table and columns created successfully

**Verify:**
```sql
-- Check table exists
SELECT * FROM eggs_transactions LIMIT 1;

-- Check new profile columns
SELECT eggs_pending_sent, eggs_pending_received FROM profiles LIMIT 1;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'eggs_transactions';
```

---

## User Guide: When to Use Doves vs Eggs

### Use Doves 🕊️ For:
- ✅ Food and drinks
- ✅ Merch purchases
- ✅ Studio time booking
- ✅ Room bookings
- ✅ Tickets to events
- ✅ Fixed services with clear deliverables
- ✅ Anything that already exists or is objective

### Use Eggs 🥚 For:
- ✅ Logo design
- ✅ Album artwork
- ✅ Music production/mixing
- ✅ Photography/videography
- ✅ Writing/copywriting
- ✅ Custom builds
- ✅ Creative work in progress
- ✅ Interpretive services
- ✅ Anything subjective or not yet created

---

## Edge Cases & Business Rules

### Dispute Resolution
- **System does NOT judge quality**
- Casa de Copas acts as mediator
- Structured conversation window
- Resolution options:
  - Full release to recipient
  - Full refund to sender
  - Partial split
  - Recipient revises work
- Final decision recorded in `eggs_transactions.metadata`

### Auto-Approval
- Kicks in 7 days AFTER expected delivery date
- Example: 30-day window → auto-approves on day 37
- Prevents indefinite escrow
- Logged in metadata: `{auto_approved: true, reason: 'delivery_window_exceeded'}`

### Expired Palomas in Escrow
- Pending Palomas don't expire while in escrow
- Clock starts when they hatch (approval)
- Recipient gets fresh 1-year timer from approval date

### Minimum Amounts
- Doves: minimum 1 Paloma
- Eggs: minimum 2 Palomas (so split works: 1 hatched, 1 pending)

---

## UI/UX Flow Map

```
Palomas Menu
    |
    ├─> "Get" → PayPal
    ├─> "Send 🕊️🥚" → SendDovesEggs
    |       |
    |       ├─> Choose Doves → Fill form → Send → Complete
    |       └─> Choose Eggs → Fill form → Send → 50% hatched, 50% in flight
    |
    └─> "Eggs in Flight 🥚" → EggsInFlight
            |
            ├─> "Received" tab
            |       └─> Card → Upload work URL → Status: work_uploaded
            |
            └─> "Sent" tab
                    └─> Card → View work
                            ├─> Approve → Remaining 50% released
                            └─> Dispute → Opens mediation
```

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    DOVES & EGGS SYSTEM                       │
└──────────────────────────────────────────────────────────────┘

SEND DOVES (Instant Transfer)
  User clicks "Send Doves"
      ↓
  Enter recipient + amount
      ↓
  FIFO: Deduct from sender's oldest paloma_transactions
      ↓
  Create new paloma_transaction for recipient (fresh 1-year)
      ↓
  Update both dov_balances
      ↓
  COMPLETE ✅


SEND EGGS (Escrow Transfer)
  User clicks "Send Eggs"
      ↓
  Enter recipient + amount + work description + delivery window
      ↓
  Split: hatched (50%) + pending (50%)
      ↓
  FIFO: Deduct FULL amount from sender
      ↓
  Create paloma_transaction for hatched amount (recipient gets immediately)
      ↓
  Create eggs_transaction record (status: pending)
      ↓
  Update balances and eggs_pending counters
      ↓
  EGGS IN FLIGHT 🥚

  Recipient: Upload work URL
      ↓
  Status → work_uploaded
      ↓
  Sender: Review work
      ├─> Approve
      |     ↓
      |   Create paloma_transaction for pending amount
      |     ↓
      |   Update balances, eggs counters
      |     ↓
      |   Status → approved ✅
      |
      └─> Dispute
            ↓
          Status → disputed
            ↓
          Casa mediates
            ↓
          Manual resolution
```

---

## Testing Checklist

- [ ] Run database migration successfully
- [ ] Verify eggs_transactions table exists with correct schema
- [ ] Test Send Doves: instant transfer works
- [ ] Test Send Eggs: 50/50 split works
- [ ] Test FIFO: oldest Palomas are spent first
- [ ] Test recipient receives fresh 1-year expiration
- [ ] Test Eggs in Flight shows correct cards
- [ ] Test work upload changes status to work_uploaded
- [ ] Test approval releases pending amount
- [ ] Test eggs_pending counters update correctly
- [ ] Test auto-expiration function (manually trigger on test data)
- [ ] Test dispute flow (manual - just verify UI and status change)
- [ ] Verify Virgil can explain Doves vs Eggs

---

## Deployment Steps

### 1. Database Migration
```bash
# Copy migration SQL to Supabase SQL Editor
# Run: supabase/migrations/003_create_eggs_transactions.sql
```

### 2. Deploy Code
```bash
git add .
git commit -m "Implement Doves & Eggs dual-send system with escrow"
git push
```

### 3. Verify Deployment
- Test Send Doves flow end-to-end
- Test Send Eggs flow end-to-end
- Check Eggs in Flight displays correctly
- Verify pending counters update

### 4. User Announcement
When ready to announce:

---

**🕊️🥚 New Way to Send Palomas**

Casa de Copas now has two ways to send value:

**Send Doves** - Instant, complete transfer
Perfect for food, merch, studio time, bookings

**Send Eggs** - 50% now, 50% when work is approved
Perfect for creative work, design, music production

When you send Eggs:
- 50% lands in their account immediately
- 50% waits for you to approve their work
- They upload the work, you review and approve
- Clean agreements without legal friction

This is cultural infrastructure. Doves for objective exchanges, Eggs for creative work.

Check it out: Palomas Menu → "Send 🕊️🥚"

---

## Success Metrics

Track these to understand adoption:

```sql
-- Total eggs sent vs doves sent
SELECT
  COUNT(*) FILTER (WHERE status != 'pending') as total_eggs,
  SUM(total_amount) FILTER (WHERE status != 'pending') as total_palomas_in_eggs
FROM eggs_transactions;

-- Approval rate
SELECT
  COUNT(*) FILTER (WHERE status = 'approved') * 100.0 / COUNT(*) as approval_rate_percent
FROM eggs_transactions
WHERE status IN ('approved', 'disputed');

-- Average delivery time
SELECT
  AVG(EXTRACT(EPOCH FROM (work_uploaded_at - created_at)) / 86400) as avg_days_to_upload
FROM eggs_transactions
WHERE work_uploaded_at IS NOT NULL;

-- Dispute rate
SELECT
  COUNT(*) FILTER (WHERE status = 'disputed') * 100.0 / COUNT(*) as dispute_rate_percent
FROM eggs_transactions
WHERE status IN ('approved', 'disputed');
```

---

## Future Enhancements

### V2 Features (Optional)
- **Milestones:** Split eggs into multiple approval stages (25% / 25% / 25% / 25%)
- **Ratings:** After approval, sender rates experience (builds reputation)
- **Templates:** Save common work descriptions for repeat services
- **Notifications:** Email when work uploaded or approved
- **Escrow limits:** Max pending per user to prevent abuse
- **Revision requests:** Structured way to request changes before approval

---

## Files Changed Summary

### Created
- `supabase/migrations/003_create_eggs_transactions.sql`
- `src/components/SendDovesEggs.jsx`
- `src/components/EggsInFlight.jsx`
- `DOVES_EGGS_IMPLEMENTATION.md` (this file)

### Modified
- `src/main.jsx` (lines 8-9, 49-50, 851-854, 1227-1261)
- `src/components/PalomasMenu.jsx` (lines 15-16, 106-172)
- `src/components/GPTChatWindow.jsx` (lines 116-145)

---

## Support & Troubleshooting

**"Eggs not showing in Eggs in Flight"**
- Check eggs_transactions table has records
- Verify user IDs match
- Check status is pending/work_uploaded/disputed (not resolved/expired)

**"Approval not releasing Palomas"**
- Check sender's eggs_pending_sent counter
- Verify paloma_transaction created for pending amount
- Check recipient's dov_balance increased

**"Auto-expiration not working"**
- Manually call: `SELECT expire_overdue_eggs();`
- Should be run via cron job daily
- Check expected_delivery_date is past + 7 days

**"Dispute stuck"**
- Disputes require manual resolution by Casa admin
- Not automated - this is intentional
- Update status manually after mediation

---

## Cultural Notes

This system isn't just technical infrastructure — it's **cultural infrastructure**.

**Doves** represent trust and immediate exchange. They fly directly to their destination.

**Eggs** represent potential and creative process. They need time to hatch, care to develop, and agreement when they're ready.

The metaphor is intuitive. The system enforces closure without judging taste. Casa remains mediator, not police.

This prevents the most common creative work failure mode: "I paid but didn't get what I expected." Eggs solve this humanely, without contracts or legal friction.

---

## Success! 🎉

The Doves & Eggs dual-send system is now fully implemented and ready for deployment.

**Doves = instant, objective exchange**
**Eggs = trust-based escrow for creative work**

This is the Era of CUPS. We drink deeply. We pour freely. We break only to be remade. 🕊️🥚
