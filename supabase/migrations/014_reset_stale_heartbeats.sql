-- Testing-phase reset: migration 013 seeded last_active_at from started_at, so
-- recent test starts counted as "active". Clear all heartbeats — only sessions
-- that actually report activity (start + 60s heartbeat) from now on will count.
-- Genuinely-active testers re-appear within one heartbeat (~60s).

UPDATE tour_progress SET last_active_at = NULL;
