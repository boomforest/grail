-- Create paloma_transactions table for tracking individual Paloma transactions with expiration
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

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_user_id ON paloma_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_expires_at ON paloma_transactions(expires_at);
CREATE INDEX IF NOT EXISTS idx_paloma_transactions_user_expired ON paloma_transactions(user_id, is_expired, expires_at);

-- Enable RLS
ALTER TABLE paloma_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own paloma transactions"
  ON paloma_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own paloma transactions"
  ON paloma_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own paloma transactions"
  ON paloma_transactions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own paloma transactions"
  ON paloma_transactions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Function to mark expired palomas
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

COMMENT ON TABLE paloma_transactions IS 'Tracks individual Paloma transactions with expiration dates for FIFO spending';
COMMENT ON COLUMN paloma_transactions.received_at IS 'When the Palomas were received (for FIFO ordering)';
COMMENT ON COLUMN paloma_transactions.expires_at IS 'When these Palomas expire (1 year from receipt)';
COMMENT ON COLUMN paloma_transactions.is_expired IS 'Whether these Palomas have expired';
