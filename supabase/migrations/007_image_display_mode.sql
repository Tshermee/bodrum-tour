-- ============================================================
-- Bodrum Tour — Image display toggle for tours & stops (007)
-- ------------------------------------------------------------
-- Tours and stops can carry an uploaded image (tours.cover_image_url already
-- exists; tour_stops.photo_url already exists). These flags let an admin choose
-- whether the player app shows the map or the uploaded image for that item.
-- Default false = keep showing the map (current behaviour). Idempotent.
-- ============================================================

ALTER TABLE tours      ADD COLUMN IF NOT EXISTS show_cover_image BOOLEAN DEFAULT false;
ALTER TABLE tour_stops ADD COLUMN IF NOT EXISTS show_photo       BOOLEAN DEFAULT false;
