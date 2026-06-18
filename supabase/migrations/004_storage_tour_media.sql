-- ============================================================
-- Bodrum Tour — Storage policies for the `tour-media` bucket (004)
-- ------------------------------------------------------------
-- Photo uploads failed with "new row violates row-level security policy"
-- because storage.objects has RLS enabled but no policy permitted writes to
-- the tour-media bucket. This bucket holds public tour media:
--   • admin uploads stop photos  → stops/<stopId>.<ext>      (authenticated)
--   • players upload submissions  → user-submissions/<...>    (anon)
-- so reads are public and writes are allowed for any role, scoped to this
-- one bucket. Idempotent (DROP POLICY IF EXISTS) so it is safe to re-run.
-- ============================================================

-- Ensure the bucket exists and is public (so getPublicUrl works).
INSERT INTO storage.buckets (id, name, public)
VALUES ('tour-media', 'tour-media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Public read of anything in the bucket.
DROP POLICY IF EXISTS "tour-media public read" ON storage.objects;
CREATE POLICY "tour-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'tour-media');

-- Anyone may upload into the bucket (admin stop photos + player submissions).
DROP POLICY IF EXISTS "tour-media insert" ON storage.objects;
CREATE POLICY "tour-media insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'tour-media');

-- Allow overwrite (the uploader uses upsert: true).
DROP POLICY IF EXISTS "tour-media update" ON storage.objects;
CREATE POLICY "tour-media update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'tour-media')
  WITH CHECK (bucket_id = 'tour-media');
