-- ============================================================
-- Bodrum Tour — Seed Data (5 tours, 30 stops)
-- ============================================================

INSERT INTO tours (id, name, subtitle, description, duration_min, duration_max, difficulty, price, max_score, gradient_from, gradient_to, accent_color, tags, kid_friendly, published)
VALUES
  ('bodrum-blue-secret',   'Bodrum Blue Secret',       'The Hidden Heart of the Aegean',      'Uncover the layered history and timeless beauty of Bodrum on this signature journey through its most iconic landmarks.', '2.5','3.5','Moderate',   15.00,1400,'#1e3a8a','#0e7490','#38bdf8',ARRAY['history','photography','culture'],false,true),
  ('flavors-of-bodrum',    'Flavors of Bodrum',        'A Culinary Journey',                  'Taste your way through Bodrum''s vibrant food scene, from fresh fish markets to legendary kumru sandwiches.',             '1',  '1.5','Easy',       3.00, 700, '#431407','#9a3412','#fb923c',ARRAY['food','culture'],                       true, true),
  ('instagrammers-route',  'The Instagrammer''s Route','Picture-Perfect Bodrum',              'Find the most photogenic spots in Bodrum, from the famous blue doors to golden-hour windmills.',                         '1',  '1.5','Easy',       3.00, 700, '#134e4a','#065f46','#34d399',ARRAY['photography','scenic'],                   true, true),
  ('ancient-halicarnassus','Ancient Halicarnassus',    'Walk in the Footsteps of History',    'Explore the ancient city of Halicarnassus, birthplace of Herodotus and home to one of the Seven Wonders.',               '2',  '2.5','Moderate',   15.00,1100,'#3b0764','#581c87','#a855f7',ARRAY['history','culture','architecture'],     false,true),
  ('bodrum-coastal-trail', 'Bodrum Coastal Trail',     'From Bay to Bay',                     'An epic journey along the Bodrum Peninsula, visiting hidden bays, charming villages and stunning viewpoints.',             '4',  '5',  'Challenging',15.00,1200,'#042f2e','#064e3b','#2dd4bf',ARRAY['nature','active','scenic'],               false,true)
ON CONFLICT (id) DO NOTHING;

-- (Full stop seed data lives in 001_initial_schema.sql — insert stops here after creating tours)
