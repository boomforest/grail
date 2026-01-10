-- ============================================
-- COMPLETE MIGRATION FOR DOVES & EGGS SYSTEM
-- Run this entire file in Supabase SQL Editor
-- ============================================

-- 1. Create paloma_transactions table
CREATE TABLE IF NOT EXISTS paloma_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount > 0),
  transaction_type VARCHAR(50) NOT NULL DEFAULT 'received',
  source TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_user_id ON paloma_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_expires_at ON paloma_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_user_expired ON paloma_transactions(user_id, is_expired, expires_at);

-- Enable RLS
ALTER TABLE paloma_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own paloma transactions" ON paloma_transactions;
DROP POLICY IF EXISTS "Users can insert their own paloma transactions" ON paloma_transactions;
DROP POLICY IF EXISTS "Users can update their own paloma transactions" ON paloma_transactions;
DROP POLICY IF EXISTS "Users can delete their own paloma transactions" ON paloma_transactions;
DROP POLICY IF EXISTS "Service role can manage all paloma transactions" ON paloma_transactions;

-- RLS Policies - Allow users to manage their own transactions
CREATE POLICY "Users can view their own paloma transactions"
  ON paloma_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert paloma transactions"
  ON paloma_transactions
  FOR INSERT
  WITH CHECK (true);  -- Allow all authenticated users to insert

CREATE POLICY "Users can update their own paloma transactions"
  ON paloma_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paloma transactions"
  ON paloma_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Create eggs_transactions table
CREATE TABLE IF NOT EXISTS eggs_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  hatched_amount INTEGER NOT NULL DEFAULT 0,
  pending_amount INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  work_description TEXT,
  delivery_window_days INTEGER DEFAULT 30,
  expected_delivery_date TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_eggs_transactions_sender ON eggs_transactions(sender_id);
CREATE INDEX IF NOT EXISTS idx_eggs_transactions_recipient ON eggs_transactions(recipient_id);
CREATE INDEX IF NOT EXISTS idx_eggs_transactions_status ON eggs_transactions(status);

-- Enable RLS
ALTER TABLE eggs_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view eggs transactions they are part of" ON eggs_transactions;
DROP POLICY IF EXISTS "Users can insert eggs transactions they send" ON eggs_transactions;
DROP POLICY IF EXISTS "Senders can update their eggs transactions" ON eggs_transactions;

-- RLS Policies
CREATE POLICY "Users can view eggs transactions they are part of"
  ON eggs_transactions
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert eggs transactions"
  ON eggs_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Senders can update their eggs transactions"
  ON eggs_transactions
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- 3. Create helper function to increment balance
CREATE OR REPLACE FUNCTION increment_balance(p_user_id UUID, p_amount INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET dov_balance = dov_balance + p_amount,
      last_status_update = NOW()
  WHERE id = p_user_id;
END;
$$;

-- 4. Function to mark expired palomas
CREATE OR REPLACE FUNCTION mark_expired_palomas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE paloma_transactions
  SET is_expired = true
  WHERE expires_at < NOW() AND is_expired = false;
END;
$$;

-- 5. Add comments for documentation
COMMENT ON TABLE paloma_transactions IS 'Tracks individual Paloma transactions with expiration dates for FIFO spending';
COMMENT ON TABLE eggs_transactions IS 'Tracks escrow transactions where 50% is immediate and 50% is pending approval';

COMMENT ON COLUMN paloma_transactions.received_at IS 'When the Palomas were received (for FIFO ordering)';
COMMENT ON COLUMN paloma_transactions.expires_at IS 'When these Palomas expire (1 year from receipt)';
COMMENT ON COLUMN paloma_transactions.is_expired IS 'Whether these Palomas have expired';

COMMENT ON COLUMN eggs_transactions.hatched_amount IS 'Amount released immediately (50%)';
COMMENT ON COLUMN eggs_transactions.pending_amount IS 'Amount held in escrow until approved (50%)';
COMMENT ON COLUMN eggs_transactions.status IS 'pending, approved, or rejected';

-- Done!
SELECT 'Migration completed successfully! ✅' as status;
