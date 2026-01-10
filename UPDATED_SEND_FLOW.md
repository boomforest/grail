# Updated Send Flow - Implementation Complete ✅

## New User Flow

### Step 1: Main Menu (PalomasMenu)
Tap the dove → See menu with:
- **Get** (PayPal purchase)
- **Send** ← Opens choice modal
- Send Love (admin only)

### Step 2: Choose Transfer Type (ChooseSendType)
When user taps "Send", they see:

**🕊️ Doves**
- Helper text: "Instant transfer. Use for immediate things like food, merch, bookings, studio time, etc."
- Selecting this sets `transferType = 'DOVES'`

**🥚 Eggs**
- Helper text: "Work-in-progress. 50% transfers now, 50% releases when you approve delivery."
- Selecting this sets `transferType = 'EGGS'`

"Back" button returns to main menu.

### Step 3: Send Form (SendDovesEggs)
After choosing type, user enters:
- Recipient username
- Amount

**If type = DOVES:**
- 100% leaves sender immediately
- 100% lands in recipient immediately
- Transaction complete (instant)
- Uses FIFO from sender's oldest Palomas
- Recipient gets fresh 1-year expiration

**If type = EGGS:**
- 100% leaves sender immediately
- 50% (rounded down) lands in recipient immediately
- 50% held in escrow (status: `PENDING_APPROVAL`)
- User also enters: work description, delivery window
- Creates `eggs_transaction` record

## Files Changed

### Created:
- [src/components/ChooseSendType.jsx](src/components/ChooseSendType.jsx)

### Modified:
- [src/components/PalomasMenu.jsx](src/components/PalomasMenu.jsx)
  - Changed "Send 🕊️🥚" button to "Send"
  - Opens ChooseSendType modal instead of direct send
  - Removed "Eggs in Flight" button from main menu

- [src/components/SendDovesEggs.jsx](src/components/SendDovesEggs.jsx)
  - Now accepts `transferType` prop ('DOVES' or 'EGGS')
  - Skips initial choice screen if type is provided

- [src/main.jsx](src/main.jsx)
  - Changed `showSendDovesEggs` from boolean to string (stores 'DOVES' or 'EGGS')
  - Passes transferType to SendDovesEggs component

## Data Structure

### Transaction Record Fields:
```javascript
{
  transferType: 'DOVES' | 'EGGS',
  // For EGGS only:
  immediateAmount: number, // 50% that lands immediately
  pendingAmount: number,   // 50% in escrow
  status: 'PENDING_APPROVAL' | 'RELEASED'
}
```

### Database:
- Doves use existing `paloma_transactions` table
- Eggs use `eggs_transactions` table with escrow tracking

## UX Benefits

1. **Clarity**: User explicitly chooses transfer type before entering details
2. **Education**: Helper text explains when to use each type
3. **Simplicity**: Main menu stays clean (Get/Send)
4. **Consistency**: Same send form for both types, just different behavior

## Testing

1. Tap dove → Should see "Get" and "Send" buttons
2. Tap "Send" → Should see Doves/Eggs choice modal
3. Tap "Doves" → Should go to send form
4. Complete send → Should transfer 100% instantly
5. Tap "Send" → Tap "Eggs" → Should go to send form with work description field
6. Complete send → Should split 50/50 and create escrow record

## Next Steps

- Deploy and test the new flow
- User should see this immediately when they tap the dove button
- Send flow is now: Dove → Send → Choose Type → Enter Details → Complete
