-- "Teams Active" on the dashboard counted every unfinished session forever,
-- because there was no recency signal. Add a last_active_at heartbeat the player
-- app bumps while a tour is open, so the dashboard can count only teams that
-- have been active within a recent window.

ALTER TABLE tour_progress
  ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ;

-- Backfill existing rows with their start time so old abandoned sessions read as
-- long-inactive (they won't count as "active now").
UPDATE tour_progress
   SET last_active_at = started_at
 WHERE last_active_at IS NULL;
