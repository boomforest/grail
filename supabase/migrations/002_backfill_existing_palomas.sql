-- Migration: Backfill existing Paloma balances into paloma_transactions
-- Created: 2026-01-09
-- Purpose: Migrate existing dov_balance data to transaction-based tracking

-- Insert migration records for all existing users with Paloma balances
INSERT INTO paloma_transactions (user_id, amount, transaction_type, source, received_at, expires_at, metadata)
SELECT
  id as user_id,
  dov_balance as amount,
  'migration' as transaction_type,
  'historical_balance' as source,
  COALESCE(created_at, NOW()) as received_at,
  COALESCE(created_at, NOW()) + INTERVAL '1 year' as expires_at,
  jsonb_build_object(
    'migration_date', NOW(),
    'original_balance', dov_balance,
    'note', 'Migrated from legacy dov_balance field'
  ) as metadata
FROM profiles
WHERE dov_balance > 0;

-- Update active_dov_balance to match current dov_balance
UPDATE profiles
SET active_dov_balance = dov_balance,
    total_dov_ever_received = COALESCE(total_palomas_collected, dov_balance)
WHERE dov_balance > 0;

-- Log migration results
DO $$
DECLARE
  migrated_users INTEGER;
  total_palomas INTEGER;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(amount), 0)
  INTO migrated_users, total_palomas
  FROM paloma_transactions
  WHERE transaction_type = 'migration';

  RAISE NOTICE 'Migration complete: % users migrated with % total Palomas', migrated_users, total_palomas;
END $$;
