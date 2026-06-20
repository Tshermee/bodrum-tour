-- Add options column for multiple-choice challenges (newline-separated list)
ALTER TABLE tour_stops
  ADD COLUMN IF NOT EXISTS challenge_options TEXT;

-- Widen the challenge_type constraint to include the two new types
ALTER TABLE tour_stops
  DROP CONSTRAINT IF EXISTS tour_stops_challenge_type_check;

ALTER TABLE tour_stops
  ADD CONSTRAINT tour_stops_challenge_type_check
  CHECK (challenge_type IN ('photo', 'riddle', 'code', 'multiple_choice', 'image_hunt'));
