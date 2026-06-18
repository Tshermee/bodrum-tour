-- ============================================================
-- Bodrum Tour — Schema Drift Sync (003)
-- ------------------------------------------------------------
-- Captures changes that were applied directly to the live database
-- (via the Supabase SQL editor) but never recorded in a migration, so a
-- fresh `001 + 002 + 003` run reproduces what the deployed frontend expects.
--
-- Every statement is idempotent (IF NOT EXISTS / DROP ... IF EXISTS) so this
-- file is safe to run against the existing, already-drifted database too.
-- ============================================================

-- NB: use gen_random_uuid() (Postgres core, pg_catalog) rather than
-- uuid_generate_v4() — the uuid-ossp extension lives in the `extensions`
-- schema on Supabase and is not on the search_path during `supabase db push`.

-- ── tours: extra columns the admin + preview flows rely on ────
--   bypass_gps    — per-tour GPS gating toggle (TourEdit, transformTour)
--   sort_order    — admin drag-reorder + app ordering (.order('sort_order'))
--   preview_token — shareable preview link for unpublished tours
ALTER TABLE tours ADD COLUMN IF NOT EXISTS bypass_gps    BOOLEAN DEFAULT false;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS sort_order    INTEGER DEFAULT 0;
ALTER TABLE tours ADD COLUMN IF NOT EXISTS preview_token UUID DEFAULT gen_random_uuid();

-- Backfill preview tokens for any tour rows that predate the column.
UPDATE tours SET preview_token = gen_random_uuid() WHERE preview_token IS NULL;

-- ── tour_progress: per-device identity ────────────────────────
--   device_id powers idempotent progress sync. upsertTourProgress() uses
--   onConflict: 'tour_id,device_id', which requires a matching unique index.
ALTER TABLE tour_progress ADD COLUMN IF NOT EXISTS device_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS tour_progress_tour_device_uniq
  ON tour_progress (tour_id, device_id);

-- ── skip_reports: stop-skip feedback (entirely new table) ─────
CREATE TABLE IF NOT EXISTS skip_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id TEXT REFERENCES tours(id) ON DELETE CASCADE,
  stop_order INTEGER,
  stop_name TEXT,
  team_name TEXT,
  reason TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE skip_reports ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Row Level Security
-- ------------------------------------------------------------
-- The frontend uses a single anon-key client for BOTH the public app and the
-- admin console (the service-role key was removed from the bundle). So:
--   • public/anon flows need INSERT/UPDATE grants on player-facing tables
--   • the admin console reads as an authenticated user who is in admin_users
-- These policies reflect what the live DB already enforces; recreating them
-- here keeps a from-scratch setup working with the current frontend.
-- DROP-then-CREATE keeps the file re-runnable.
-- ============================================================

-- skip_reports: anyone can file a report; admins can read them.
DROP POLICY IF EXISTS "Anyone can insert skip reports" ON skip_reports;
CREATE POLICY "Anyone can insert skip reports"
  ON skip_reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read skip reports" ON skip_reports;
CREATE POLICY "Admins can read skip reports"
  ON skip_reports FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

DROP POLICY IF EXISTS "Service role full access skip_reports" ON skip_reports;
CREATE POLICY "Service role full access skip_reports"
  ON skip_reports USING (auth.role() = 'service_role');

-- Admin console reads (Dashboard / Analytics / Purchases / Tours admin).
-- Authenticated admins need to read rows the public anon policies don't expose
-- (all tours incl. unpublished, all progress, all purchases).
DROP POLICY IF EXISTS "Admins can read all tours" ON tours;
CREATE POLICY "Admins can read all tours"
  ON tours FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

DROP POLICY IF EXISTS "Admins can read progress" ON tour_progress;
CREATE POLICY "Admins can read progress"
  ON tour_progress FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

DROP POLICY IF EXISTS "Admins can read stop progress" ON stop_progress;
CREATE POLICY "Admins can read stop progress"
  ON stop_progress FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));

DROP POLICY IF EXISTS "Admins can read purchases" ON purchases;
CREATE POLICY "Admins can read purchases"
  ON purchases FOR SELECT
  USING (auth.uid() IN (SELECT id FROM admin_users));
