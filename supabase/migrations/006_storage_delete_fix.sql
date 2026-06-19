-- ============================================================
-- Bodrum Tour — Fix tour-media delete policy (006)
-- ------------------------------------------------------------
-- The 005 DELETE policy gated on auth.role() = 'authenticated'. In this
-- project's RLS, auth.uid() is the proven-working check (see migration 003's
-- admin read policies); auth.role() was deleting nothing, and supabase-js
-- reports an RLS-blocked remove() as success-with-empty-result, so deletes
-- silently failed. Re-gate on auth.uid() IS NOT NULL: any logged-in admin may
-- delete, anonymous players (null uid) cannot. Idempotent.
-- ============================================================

DROP POLICY IF EXISTS "tour-media delete" ON storage.objects;
CREATE POLICY "tour-media delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'tour-media' AND auth.uid() IS NOT NULL);
