-- ============================================================
-- Bodrum Tour — Initial Schema
-- Run against your Supabase project to set up all tables.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Tours ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  duration_min TEXT,
  duration_max TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Moderate', 'Challenging')),
  price DECIMAL(10,2) DEFAULT 0,
  max_score INTEGER DEFAULT 0,
  gradient_from TEXT DEFAULT '#1e3a8a',
  gradient_to TEXT DEFAULT '#0e7490',
  accent_color TEXT DEFAULT '#38bdf8',
  tags TEXT[] DEFAULT '{}',
  kid_friendly BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  cover_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tour Stops ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  name TEXT NOT NULL,
  story TEXT,
  location_name TEXT,
  lat DECIMAL(10,7),
  lng DECIMAL(10,7),
  challenge_type TEXT CHECK (challenge_type IN ('photo', 'riddle', 'code')),
  challenge_answer TEXT,
  challenge_hint TEXT,
  challenge_prompt TEXT,
  photo_url TEXT,
  points INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Admin Users ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Purchases ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT,
  team_name TEXT,
  amount DECIMAL(10,2) DEFAULT 0,
  payment_ref TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded')),
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Tour Progress ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_score INTEGER DEFAULT 0
);

-- ── Stop Progress ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stop_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tour_progress_id UUID REFERENCES tour_progress(id) ON DELETE CASCADE,
  stop_id UUID REFERENCES tour_stops(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ,
  score INTEGER DEFAULT 0,
  photo_url TEXT,
  attempts INTEGER DEFAULT 0,
  UNIQUE(tour_progress_id, stop_id)
);

-- ── Analytics Views ───────────────────────────────────────────
CREATE OR REPLACE VIEW tour_stats AS
SELECT
  t.id,
  t.name,
  t.price,
  t.difficulty,
  COUNT(DISTINCT p.id) AS total_purchases,
  COUNT(DISTINCT tp.id) AS total_starts,
  COUNT(DISTINCT CASE WHEN tp.completed_at IS NOT NULL THEN tp.id END) AS total_completions,
  ROUND(
    CASE WHEN COUNT(DISTINCT tp.id) > 0
      THEN COUNT(DISTINCT CASE WHEN tp.completed_at IS NOT NULL THEN tp.id END)::DECIMAL
           / COUNT(DISTINCT tp.id) * 100
      ELSE 0 END, 1
  ) AS completion_rate_pct,
  ROUND(AVG(CASE WHEN tp.completed_at IS NOT NULL THEN tp.total_score END), 0) AS avg_score,
  COALESCE(SUM(p.amount), 0) AS total_revenue
FROM tours t
LEFT JOIN purchases p ON p.tour_id = t.id AND p.status = 'completed'
LEFT JOIN tour_progress tp ON tp.tour_id = t.id
GROUP BY t.id, t.name, t.price, t.difficulty;

CREATE OR REPLACE VIEW stop_dropoff_stats AS
SELECT
  ts.tour_id,
  ts.id AS stop_id,
  ts.order_index,
  ts.name AS stop_name,
  ts.challenge_type,
  ts.points,
  COUNT(DISTINCT sp.id) AS total_attempts,
  COUNT(DISTINCT CASE WHEN sp.completed_at IS NOT NULL THEN sp.id END) AS completions,
  ROUND(
    CASE WHEN COUNT(DISTINCT sp.id) > 0
      THEN COUNT(DISTINCT CASE WHEN sp.completed_at IS NOT NULL THEN sp.id END)::DECIMAL
           / COUNT(DISTINCT sp.id) * 100
      ELSE 0 END, 1
  ) AS completion_rate_pct,
  ROUND(AVG(sp.attempts), 1) AS avg_attempts
FROM tour_stops ts
LEFT JOIN stop_progress sp ON sp.stop_id = ts.id
GROUP BY ts.tour_id, ts.id, ts.order_index, ts.name, ts.challenge_type, ts.points
ORDER BY ts.tour_id, ts.order_index;

-- ── Row Level Security ────────────────────────────────────────
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Tours: public read, service-role write
CREATE POLICY "Public can read published tours" ON tours FOR SELECT USING (published = true);
CREATE POLICY "Service role full access tours" ON tours USING (auth.role() = 'service_role');

-- Stops: public read, service-role write
CREATE POLICY "Public can read stops" ON tour_stops FOR SELECT USING (true);
CREATE POLICY "Service role full access stops" ON tour_stops USING (auth.role() = 'service_role');

-- Purchases: anyone insert, service-role full
CREATE POLICY "Anyone can insert purchases" ON purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role full access purchases" ON purchases USING (auth.role() = 'service_role');

-- Progress: anyone insert/update, service-role full
CREATE POLICY "Anyone can insert progress" ON tour_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update own progress" ON tour_progress FOR UPDATE USING (true);
CREATE POLICY "Service role full access progress" ON tour_progress USING (auth.role() = 'service_role');

CREATE POLICY "Anyone can insert stop progress" ON stop_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stop progress" ON stop_progress FOR UPDATE USING (true);
CREATE POLICY "Service role full access stop progress" ON stop_progress USING (auth.role() = 'service_role');

-- Admin: users can check their own admin status
CREATE POLICY "Users can check own admin status" ON admin_users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Service role full access admin_users" ON admin_users USING (auth.role() = 'service_role');
