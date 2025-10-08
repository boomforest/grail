-- Add gold_ring field to profiles table
-- Run this in your Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS gold_ring BOOLEAN DEFAULT FALSE;

-- Add index for gold_ring for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_gold_ring ON profiles(gold_ring) WHERE gold_ring = TRUE;

-- Comment to explain the field
COMMENT ON COLUMN profiles.gold_ring IS 'Gold ring indicator for profile picture. Admins can add/remove, users can only remove their own.';
