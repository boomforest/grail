-- ============================================
-- BACKFILL TRANSACTION HISTORY
-- Run this AFTER COMPLETE_MIGRATION.sql
-- ============================================

-- Backfill existing Paloma balances into transaction history
-- This creates receipt entries for all current balances
INSERT INTO paloma_transactions (user_id, amount, transaction_type, source, received_at, expires_at, metadata)
SELECT
  id as user_id,
  dov_balance as amount,
  'received' as transaction_type,
  'historical_balance' as source,
  COALESCE(created_at, NOW()) as received_at,
  COALESCE(created_at, NOW()) + INTERVAL '1 year' as expires_at,
  jsonb_build_object(
    'migration_date', NOW(),
    'original_balance', dov_balance,
    'note', 'Historical balance from account creation'
  ) as metadata
FROM profiles
WHERE dov_balance > 0;

-- Log the results
DO $$
DECLARE
  migrated_users INTEGER;
  total_palomas INTEGER;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO migrated_users, total_palomas
  FROM paloma_transactions
  WHERE source = 'historical_balance';

  RAISE NOTICE 'Backfill complete: % users with % total Palomas in history', migrated_users, total_palomas;
END $$;

SELECT 'Backfill completed! ✅ Users can now see their current balances in transaction history' as status;
