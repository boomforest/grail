-- Migration: Create paloma_transactions table for expiration tracking
-- Created: 2026-01-09
-- Purpose: Track individual Paloma transactions with expiration dates (1 year)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create paloma_transactions table
CREATE TABLE IF NOT EXISTS paloma_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('purchase', 'received', 'sent', 'expired', 'migration')),
  source VARCHAR(100), -- 'paypal', 'transfer_from_user', 'admin_grant', 'historical_balance', etc.
  received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '1 year') NOT NULL,
  is_expired BOOLEAN DEFAULT FALSE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  metadata JSONB -- For storing additional context (e.g., PayPal transaction ID, sender username)
);

-- Create indexes for fast queries
CREATE INDEX idx_paloma_expires_at ON paloma_transactions(expires_at, is_expired);
CREATE INDEX idx_paloma_user_id ON paloma_transactions(user_id);
CREATE INDEX idx_paloma_user_active ON paloma_transactions(user_id, is_expired, expires_at);

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS active_dov_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_dov_ever_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_expiration_check TIMESTAMP WITH TIME ZONE;

-- Add comment explaining the fields
COMMENT ON TABLE paloma_transactions IS 'Tracks individual Paloma (DOV) transactions for expiration tracking. Palomas expire 1 year after receipt.';
COMMENT ON COLUMN paloma_transactions.amount IS 'Number of Palomas in this transaction (always positive)';
COMMENT ON COLUMN paloma_transactions.transaction_type IS 'Type: purchase, received, sent, expired, migration';
COMMENT ON COLUMN paloma_transactions.source IS 'Origin of transaction (paypal, transfer_from_user, admin_grant, etc.)';
COMMENT ON COLUMN paloma_transactions.received_at IS 'When Palomas were received (used for expiration calculation)';
COMMENT ON COLUMN paloma_transactions.expires_at IS 'When these Palomas expire (received_at + 1 year)';
COMMENT ON COLUMN paloma_transactions.is_expired IS 'Whether this transaction has been marked as expired';

-- Enable Row Level Security
ALTER TABLE paloma_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON paloma_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can do anything (for cron jobs and backend operations)
CREATE POLICY "Service role has full access"
  ON paloma_transactions
  FOR ALL
  USING (auth.role() = 'service_role');
