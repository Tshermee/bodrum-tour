-- Feature 1: audio narration per stop
ALTER TABLE tour_stops ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Feature 2: per-language content overrides
ALTER TABLE tours ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';
ALTER TABLE tour_stops ADD COLUMN IF NOT EXISTS translations JSONB DEFAULT '{}';

-- Feature 5: app-level config (welcome screen text, etc.)
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='app_config' AND policyname='app_config_public_read'
  ) THEN
    CREATE POLICY app_config_public_read ON app_config FOR SELECT USING (true);
  END IF;
END $$;
INSERT INTO app_config (key, data) VALUES (
  'welcome',
  '{"en":{"tagline":"Self-guided adventure","heading_main":"BODRUM","heading_sub":"Blue Secret","description":"Follow the clues through Bodrum''s ancient wonders, iconic landmarks, and hidden gems. Solve riddles. Find codes. Capture the perfect shot.","footer":"Bodrum, Turkey · All seasons"}}'
) ON CONFLICT (key) DO NOTHING;
