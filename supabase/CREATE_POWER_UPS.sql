-- ============================================
-- CREATE POWER-UPS TABLE AND POLICIES
-- Store / Power-Ups feature for Casa de Copas
-- ============================================

-- 1. Create power_ups table
CREATE TABLE IF NOT EXISTS power_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  category TEXT NOT NULL CHECK (category IN ('studios', 'pros', 'health')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price_doves INTEGER NOT NULL CHECK (price_doves >= 0),
  image_path TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_power_ups_category ON power_ups(category);
CREATE INDEX IF NOT EXISTS idx_power_ups_is_active ON power_ups(is_active);
CREATE INDEX IF NOT EXISTS idx_power_ups_category_active_sort ON power_ups(category, is_active, sort_order);

-- 2. Create updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to power_ups table
DROP TRIGGER IF EXISTS update_power_ups_updated_at ON power_ups;
CREATE TRIGGER update_power_ups_updated_at
  BEFORE UPDATE ON power_ups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. Enable RLS
ALTER TABLE power_ups ENABLE ROW LEVEL SECURITY;

-- 5. Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active power-ups" ON power_ups;
DROP POLICY IF EXISTS "Admins can insert power-ups" ON power_ups;
DROP POLICY IF EXISTS "Admins can update power-ups" ON power_ups;
DROP POLICY IF EXISTS "Admins can delete power-ups" ON power_ups;

-- 6. RLS Policies
-- Public read access (anyone can browse)
CREATE POLICY "Anyone can view active power-ups"
  ON power_ups
  FOR SELECT
  USING (true);

-- Admin-only write access
-- Note: Admin check is username='JPR333' OR email='jproney@gmail.com'
-- We'll use a helper function to check this
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND (username = 'JPR333' OR email = 'jproney@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create admin-only policies using the helper
CREATE POLICY "Admins can insert power-ups"
  ON power_ups
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update power-ups"
  ON power_ups
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete power-ups"
  ON power_ups
  FOR DELETE
  USING (is_admin());

-- 7. Seed demo data (3 items per category)
INSERT INTO power_ups (category, title, description, price_doves, sort_order, is_active) VALUES
  -- Studios category
  ('studios', 'Studio A - Full Day', 'Professional recording studio in downtown LA. Includes engineer, SSL console, vintage mics, and unlimited coffee. Perfect for tracking full bands or solo sessions.', 500, 1, true),
  ('studios', 'Studio B - Half Day', 'Cozy mix room with Genelec monitors and analog outboard gear. Great for vocal overdubs, mixing, or production work. Includes Pro Tools Ultimate.', 250, 2, true),
  ('studios', 'Mix Add-On Package', 'Professional mixing services for one song. Includes up to 5 revisions, stem delivery, and mastering-ready bounce. Our engineers have worked with major label artists.', 150, 3, true),

  -- Pros category
  ('pros', 'Producer Day Session', 'Collaborate with an experienced music producer for a full day. We''ll work on arrangement, sound selection, and bring your vision to life. Includes basic mix.', 400, 1, true),
  ('pros', 'Songwriting Co-Write', '3-hour songwriting session with a professional songwriter. Perfect for finishing that chorus, developing lyrics, or starting fresh. Coffee and creative vibes included.', 200, 2, true),
  ('pros', 'Vocal Comp & Tuning', 'Professional vocal comping and tuning for one song. We''ll select the best takes, create a perfect comp, and tune with natural precision. Fast 24hr turnaround.', 100, 3, true),

  -- Health category
  ('health', 'Yoga Session', 'Private 60-minute yoga session with certified instructor. Focus on breath, flexibility, and mindfulness. Perfect for musicians dealing with performance stress.', 75, 1, true),
  ('health', 'Breathwork Class', '45-minute guided breathwork session. Improve lung capacity, reduce anxiety, and enhance vocal control. Popular with singers and performers.', 50, 2, true),
  ('health', 'Massage Therapy Credit', 'One hour massage therapy session at partner wellness center. Choose from deep tissue, Swedish, or sports massage. Heal those touring muscles.', 100, 3, true);

SELECT 'Power-ups table created with seed data! ✅' as status;
