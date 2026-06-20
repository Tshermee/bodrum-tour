-- Free-roam tours: stops can be completed in any order.
-- 'sequential' (default) keeps the existing one-stop-at-a-time flow.
-- 'free_roam' unlocks every stop at once and lets the player pick the next.

ALTER TABLE tours
  ADD COLUMN IF NOT EXISTS tour_type TEXT NOT NULL DEFAULT 'sequential';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tours_tour_type_check'
  ) THEN
    ALTER TABLE tours
      ADD CONSTRAINT tours_tour_type_check
      CHECK (tour_type IN ('sequential', 'free_roam'));
  END IF;
END $$;
