# Casa de Copas - Development Guide

## What is Casa de Copas?

Casa de Copas (House of Cups) is an antisocial media community token exchange platform. It's a tarot-inspired social economy where users send and receive "Palomas" (doves/tokens) and "Love" tokens, progress through tarot cup levels, and participate in a gift economy.

### Core Concepts

- **Palomas (Dovs)**: The main currency token users exchange
- **Love Tokens**: Bonus tokens earned for supporting Casa de Copas
- **Doves & Eggs Payment System**: Two-payment escrow system
  - When sending Eggs: partial amount (hatched) sent immediately, remainder held pending
  - Sender clicks "Done" to release pending amount when work is complete
- **Cup Game**: Tarot journey progression system with 14 levels (Ace through Knight of Cups)
- **Bilingual**: Full English/Spanish support throughout the app

### Philosophy

The app teaches "the joy of giving for the sake of giving" - breaking free from the "Era of Swords" (taking/extraction) into the "Era of Cups" (giving/abundance). It's designed to be intentionally antisocial media - focused on direct giving rather than attention-seeking.

---

## Tech Stack

- **Frontend**: React + Vite
- **Backend**: Supabase (PostgreSQL + Auth)
- **Styling**: Inline styles (no CSS framework)
- **Translations**: Custom translation system in `src/translations.js`
- **Deployment**: Push straight to `main` branch (no test server during pre-launch)

---

## Development Workflow

### 1. Direct-to-Main Push Strategy (Pre-Launch Only)

**Current Phase**: We push directly to `main` for speed during pre-launch development.

```bash
# Make changes, then:
git add -A
git commit -m "Description

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push
```

**Post-Launch**: Will switch back to test server → main workflow.

### 2. Adding New Features - Checklist

When adding ANY new feature, always:

- [ ] **Implement the feature** in React components
- [ ] **Add database changes** if needed (see Database section below)
- [ ] **Add translations** to `src/translations.js` for BOTH English and Spanish
- [ ] **Test in both languages** using the language toggle
- [ ] **Update this guide** if adding new core concepts
- [ ] **Commit and push** to main

### 3. Translation System

**CRITICAL**: Every user-facing string must be translated.

#### How it works:

1. All translations live in `src/translations.js`
2. Structure: `translations.en.section.key` and `translations.es.section.key`
3. Components import: `import { getTranslation } from '../translations'`
4. Access via: `getTranslation(language, 'section.key')`

#### Example: Adding a new feature with translations

```javascript
// 1. Add to translations.js
export const translations = {
  en: {
    // ... existing translations
    newFeature: {
      title: 'New Feature',
      description: 'This is a new feature',
      button: 'Click Me'
    }
  },
  es: {
    // ... existing translations
    newFeature: {
      title: 'Nueva Característica',
      description: 'Esta es una nueva característica',
      button: 'Haz Clic'
    }
  }
}

// 2. Use in component
import { getTranslation } from '../translations'

function NewFeature({ language }) {
  return (
    <div>
      <h1>{getTranslation(language, 'newFeature.title')}</h1>
      <p>{getTranslation(language, 'newFeature.description')}</p>
      <button>{getTranslation(language, 'newFeature.button')}</button>
    </div>
  )
}
```

#### Translation with variables:

```javascript
// In translations.js
receivedBonus: 'You received {amount} Love tokens as bonus!'

// In component
import { getTranslationWithVars } from '../translations'

const message = getTranslationWithVars(language, 'sendPalomas.receivedBonus', {
  amount: bonusAmount
})
```

---

## Database Management

### Supabase Structure

- **profiles**: User accounts (username, dov_balance, eggs_pending_sent, eggs_pending_received, etc.)
- **paloma_transactions**: Record of all Doves sent/received with FIFO expiration tracking
- **eggs_transactions**: Escrow transactions for Eggs payments (pending/approved status)
- **cashout_requests**: PayPal cashout requests
- **tickets**: Event tickets
- **products**: Marketplace items

### Making Database Changes

1. **Write SQL migration file** in `supabase/` folder
2. **Name it descriptively**: e.g., `CREATE_RELEASE_EGGS_PAYMENT.sql`
3. **Test locally** if possible
4. **Paste into Supabase SQL editor** to run on production
5. **Commit the SQL file** to repo for documentation

#### SQL Function Template

```sql
-- ============================================
-- CREATE function_name FUNCTION
-- Description of what it does
-- ============================================

DROP FUNCTION IF EXISTS function_name(args);

CREATE OR REPLACE FUNCTION function_name(p_arg1 TYPE, p_arg2 TYPE)
RETURNS return_type
LANGUAGE plpgsql
SECURITY DEFINER  -- Use this to bypass RLS policies
AS $$
DECLARE
  v_variable TYPE;
BEGIN
  -- Function logic here
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION function_name(TYPE, TYPE) TO authenticated;

SELECT 'function_name created! ✅' as status;
```

### Row Level Security (RLS)

- Users can only update their own `dov_balance` (RLS enforced)
- To update other users' balances, use `SECURITY DEFINER` functions
- Always verify the calling user with `auth.uid()` in security-sensitive functions

---

## Key Features & How They Work

### Doves & Eggs Payment System

**Two-phase escrow payment for work/services:**

1. **Sending Eggs**:
   - User sends X Eggs to recipient
   - Immediately: 1 Dov sent and delivered (hatched amount)
   - Pending: (X-1) Dovs held in escrow tracked via `eggs_pending_sent`/`eggs_pending_received`
   - Full amount deducted from sender's balance upfront

2. **Clicking "Done"**:
   - Sender reviews work and clicks "Done" button
   - Calls `release_eggs_payment(egg_id)` RPC function
   - Releases pending Dovs to recipient
   - Updates balances and creates transaction records

**Database Function**: `release_eggs_payment(p_egg_id UUID)`
- Updates `eggs_transactions` status to 'approved'
- Creates `paloma_transaction` for recipient (received)
- Creates `paloma_transaction` for sender (sent history)
- Updates both users' balances and pending counters

### Transaction History

Shows two sections:
- **Hatching Eggs**: Pending eggs transactions with "Done" button for senders
- **Completed Transactions**: All Doves sent/received with usernames and dates

Display format: Simple list (no fancy animations to avoid browser crashes)

### Cup Game / Tarot Journey

Users progress through 14 cup levels by sending Palomas:
- Ace of Cups → Two of Cups → ... → Knight of Cups
- Each level requires more Palomas to reach
- Visual tarot card display
- Unlocks lower cashout tax rates at higher levels

---

## Component Architecture

### Language Prop Pattern

**Every component** that displays text must accept a `language` prop:

```javascript
function MyComponent({ profile, supabase, language, onClose }) {
  return (
    <div>
      <h1>{getTranslation(language, 'section.title')}</h1>
    </div>
  )
}
```

### Styling Approach

- **No CSS files** - all styles are inline
- Keep it simple, avoid complex animations (causes browser crashes)
- Use basic colors: `#d2691e` (brown), `#ff9800` (orange), `#4caf50` (green)

### Common Patterns

```javascript
// Loading state
{loading ? (
  <div>Loading...</div>
) : (
  <div>Content</div>
)}

// Empty state
{items.length === 0 ? (
  <div>No items yet</div>
) : (
  items.map(item => ...)
)}

// Error handling
try {
  const { data, error } = await supabase.from('table').select()
  if (error) throw error
} catch (err) {
  console.error('Error:', err)
  alert('Something went wrong')
}
```

---

## Common Tasks

### Adding a New Menu/Modal

1. Create component file in `src/components/`
2. Accept props: `{ profile, supabase, language, onClose }`
3. Add translations to `translations.js`
4. Import and conditionally render in parent component
5. Test in both English and Spanish

### Adding a New Database Function

1. Write SQL in `supabase/DESCRIPTIVE_NAME.sql`
2. Test logic carefully (use DECLARE variables, error handling)
3. Add `SECURITY DEFINER` if it needs to bypass RLS
4. Grant execute to `authenticated` role
5. Paste into Supabase SQL editor
6. Test from frontend with `supabase.rpc('function_name', { args })`

### Fixing Performance Issues

- Remove animations and transitions from lists
- Use `useCallback` for functions in `useEffect` dependencies
- Limit query results with `.limit(50)`
- Avoid re-renders by checking `profile?.id` instead of `profile`

---

## Testing Checklist

Before pushing to main:

- [ ] Feature works in English
- [ ] Feature works in Spanish
- [ ] No console errors
- [ ] Database functions execute without errors
- [ ] Mobile responsive (test on phone if possible)
- [ ] No performance issues (browser doesn't crash/lag)

---

## Troubleshooting

### Browser Cache Issues

If changes don't appear after pushing:
```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev

# Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### Translation Not Showing

1. Check `translations.js` has entry for both `en` and `es`
2. Verify path is correct: `section.subsection.key`
3. Make sure component receives `language` prop
4. Check console for "translation not found" warnings

### Database Function Not Found

1. Check function name matches exactly (case-sensitive)
2. Verify function was created in Supabase SQL editor
3. Check parameter types match the call
4. Look for typos in RPC call: `supabase.rpc('function_name', { p_arg: value })`

---

## Future Enhancements

Ideas to consider:
- Push notifications for received Palomas
- Mobile app (React Native)
- More tarot suits (Wands, Pentacles, Swords progression)
- Community events and ticket system expansion
- Marketplace for physical goods with Palomas

---

## Questions?

If something is unclear or you're adding a major new feature:
1. Update this guide with the new information
2. Add clear comments in the code
3. Document any new database tables/functions

---

**Last Updated**: January 2026
**Current Phase**: Pre-launch development (direct-to-main)
