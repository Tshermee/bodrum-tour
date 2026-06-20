-- Fix: stops within a tour sharing the same order_index.
--
-- The app uses order_index as a stop's identity (mission id), so duplicates make
-- completing one stop look like completing every stop with that index — which in
-- free-roam tours finishes the whole tour after a single stop. New stops used to
-- default to order_index = 1, so a tour built without touching the Order field
-- ended up with every stop at 1.
--
-- Renumber stops 1..N (by current order, breaking ties by creation time) ONLY for
-- tours that actually have a collision, so correctly-ordered tours are untouched.

WITH dup_tours AS (
  SELECT tour_id
  FROM tour_stops
  GROUP BY tour_id, order_index
  HAVING COUNT(*) > 1
),
renum AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY tour_id ORDER BY order_index, created_at, id) AS rn
  FROM tour_stops
  WHERE tour_id IN (SELECT DISTINCT tour_id FROM dup_tours)
)
UPDATE tour_stops s
   SET order_index = r.rn
  FROM renum r
 WHERE s.id = r.id
   AND s.order_index <> r.rn;
