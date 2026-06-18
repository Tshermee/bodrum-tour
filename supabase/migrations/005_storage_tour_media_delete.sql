-- ============================================================
-- Bodrum Tour — Allow deleting tour-media objects (005)
-- ------------------------------------------------------------
-- Removing an object from storage needs a DELETE policy on storage.objects;
-- migration 004 only granted read/insert/update. Scope DELETE to authenticated
-- users (the admin console) so admins can remove a stop photo, while anonymous
-- players cannot delete objects (e.g. other players' submissions).
-- Idempotent (DROP POLICY IF EXISTS) so it is safe to re-run.
-- ============================================================

DROP POLICY IF EXISTS "tour-media delete" ON storage.objects;
CREATE POLICY "tour-media delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tour-media' AND auth.role() = 'authenticated');
