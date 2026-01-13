-- Add Spanish translation fields to power_ups table
-- Run this in Supabase SQL Editor

-- Add Spanish title field
ALTER TABLE power_ups
ADD COLUMN IF NOT EXISTS title_es TEXT;

-- Add Spanish description field
ALTER TABLE power_ups
ADD COLUMN IF NOT EXISTS description_es TEXT;

-- Add comment for documentation
COMMENT ON COLUMN power_ups.title_es IS 'Spanish translation of title';
COMMENT ON COLUMN power_ups.description_es IS 'Spanish translation of description';
