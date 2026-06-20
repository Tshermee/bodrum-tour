-- Fix: GET skip_reports?select=*,tours(name) returns 400 in the admin dashboard.
--
-- skip_reports was created with `CREATE TABLE IF NOT EXISTS` (migration 003).
-- If the table already existed on the remote DB at that point, the inline
-- `tour_id TEXT REFERENCES tours(id)` foreign key was never actually added —
-- so PostgREST can't resolve the `tours(name)` embed and rejects the request.
--
-- Add the FK if (and only if) no skip_reports → tours foreign key exists yet,
-- after removing any orphaned rows that would block it. Then nudge PostgREST
-- to reload its schema cache so the embed works immediately.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint con
    JOIN pg_class rel  ON rel.oid  = con.conrelid
    JOIN pg_class fref ON fref.oid = con.confrelid
    WHERE con.contype = 'f'
      AND rel.relname  = 'skip_reports'
      AND fref.relname = 'tours'
  ) THEN
    -- tour_id is NOT NULL, so orphaned reports (pointing at a tour that no
    -- longer exists — e.g. deleted or test tours) can't be repaired. Drop them
    -- so the FK can be validated.
    DELETE FROM skip_reports s
     WHERE NOT EXISTS (SELECT 1 FROM tours t WHERE t.id = s.tour_id);

    ALTER TABLE skip_reports
      ADD CONSTRAINT skip_reports_tour_id_fkey
      FOREIGN KEY (tour_id) REFERENCES tours(id) ON DELETE CASCADE;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
