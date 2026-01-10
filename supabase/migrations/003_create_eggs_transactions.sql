-- Migration: Create eggs_transactions table for escrow system
-- Created: 2026-01-09
-- Purpose: Track "Eggs in Flight" - escrowed Palomas pending work completion

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create eggs_transactions table for escrow tracking
CREATE TABLE IF NOT EXISTS eggs_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Parties involved
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  recipient_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- Amounts
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  hatched_amount INTEGER NOT NULL CHECK (hatched_amount >= 0), -- Amount already in recipient's account (50%)
  pending_amount INTEGER NOT NULL CHECK (pending_amount >= 0), -- Amount in escrow (50%)

  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'work_uploaded', 'approved', 'disputed', 'resolved', 'expired')),

  -- Work agreement
  work_description TEXT, -- What was agreed upon
  work_delivery_url TEXT, -- Where recipient uploads completed work

  -- Timeline
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  delivery_window_days INTEGER DEFAULT 30 NOT NULL,
  expected_delivery_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days') NOT NULL,
  work_uploaded_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,

  -- Dispute handling
  dispute_opened_at TIMESTAMP WITH TIME ZONE,
  dispute_notes TEXT,

  -- Metadata
  metadata JSONB,

  -- Source transaction tracking (links to paloma_transactions)
  source_transaction_ids UUID[]
);

-- Create indexes for common queries
CREATE INDEX idx_eggs_sender ON eggs_transactions(sender_id, status);
CREATE INDEX idx_eggs_recipient ON eggs_transactions(recipient_id, status);
CREATE INDEX idx_eggs_status ON eggs_transactions(status);
CREATE INDEX idx_eggs_expected_delivery ON eggs_transactions(expected_delivery_date, status);

-- Add Eggs tracking columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS eggs_pending_sent INTEGER DEFAULT 0, -- Palomas in escrow that I sent
ADD COLUMN IF NOT EXISTS eggs_pending_received INTEGER DEFAULT 0; -- Palomas in escrow waiting for my work

-- Comments
COMMENT ON TABLE eggs_transactions IS 'Escrow system for creative work - "Eggs in Flight" with 50% immediate, 50% on approval';
COMMENT ON COLUMN eggs_transactions.hatched_amount IS '50% that landed immediately in recipient account';
COMMENT ON COLUMN eggs_transactions.pending_amount IS '50% in escrow, released on approval';
COMMENT ON COLUMN eggs_transactions.status IS 'pending -> work_uploaded -> approved/disputed -> resolved';
COMMENT ON COLUMN eggs_transactions.delivery_window_days IS 'Days until work is expected (default 30)';

-- Enable Row Level Security
ALTER TABLE eggs_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view eggs they sent or received
CREATE POLICY "Users can view own egg transactions"
  ON eggs_transactions
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Policy: Senders can update to approve or dispute
CREATE POLICY "Senders can update status"
  ON eggs_transactions
  FOR UPDATE
  USING (auth.uid() = sender_id);

-- Policy: Recipients can upload work
CREATE POLICY "Recipients can upload work"
  ON eggs_transactions
  FOR UPDATE
  USING (auth.uid() = recipient_id);

-- Policy: Service role has full access (for automated processes)
CREATE POLICY "Service role has full access to eggs"
  ON eggs_transactions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Function to automatically expire eggs after delivery window + 7 days grace period
CREATE OR REPLACE FUNCTION expire_overdue_eggs()
RETURNS void AS $$
BEGIN
  -- Auto-approve eggs that are 7+ days overdue
  UPDATE eggs_transactions
  SET
    status = 'approved',
    resolved_at = NOW(),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('auto_approved', true, 'reason', 'delivery_window_exceeded')
  WHERE status IN ('pending', 'work_uploaded')
    AND expected_delivery_date < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expire_overdue_eggs IS 'Auto-approves eggs that are 7+ days past delivery window to prevent indefinite escrow';
