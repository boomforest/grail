-- ============================================
-- CREATE POWER-UPS STORAGE BUCKET AND POLICIES
-- ============================================

-- 1. Create storage bucket for power-up images
-- Note: Run this in Supabase dashboard Storage settings or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('power-ups', 'power-ups', true)
-- ON CONFLICT (id) DO NOTHING;

-- This is just documentation - you'll create the bucket manually in Supabase UI
-- Bucket name: power-ups
-- Public: YES (for easy demo viewing)

-- 2. Storage policies for power-ups bucket
-- Allow public read access
DROP POLICY IF EXISTS "Public read access for power-up images" ON storage.objects;
CREATE POLICY "Public read access for power-up images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'power-ups');

-- Allow admins to upload
DROP POLICY IF EXISTS "Admins can upload power-up images" ON storage.objects;
CREATE POLICY "Admins can upload power-up images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'power-ups'
    AND is_admin()
  );

-- Allow admins to update
DROP POLICY IF EXISTS "Admins can update power-up images" ON storage.objects;
CREATE POLICY "Admins can update power-up images"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'power-ups'
    AND is_admin()
  );

-- Allow admins to delete
DROP POLICY IF EXISTS "Admins can delete power-up images" ON storage.objects;
CREATE POLICY "Admins can delete power-up images"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'power-ups'
    AND is_admin()
  );

SELECT 'Power-ups storage policies created! ✅' as status;
SELECT 'Remember to create bucket "power-ups" (public) in Supabase Storage UI' as reminder;
