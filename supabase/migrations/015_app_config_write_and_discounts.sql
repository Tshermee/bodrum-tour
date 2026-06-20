-- 1. Fix: saving app_config (welcome / rules / completion) fails with
-- "new row violates row-level security policy". The admin app uses the anon
-- client with the logged-in admin's session (no service-role key in the
-- frontend), and app_config only had a public SELECT policy — no write policy.
-- Add an admin write policy gated on admin_users (same gate used elsewhere).

DROP POLICY IF EXISTS app_config_admin_write ON app_config;
CREATE POLICY app_config_admin_write ON app_config
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- 2. Discount codes (not tour-specific).
CREATE TABLE IF NOT EXISTS discount_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code          TEXT UNIQUE NOT NULL,
  description   TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  amount        NUMERIC NOT NULL DEFAULT 0,   -- percent (0-100) or fixed € off
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read ACTIVE codes (needed to validate at checkout).
DROP POLICY IF EXISTS discount_codes_public_read ON discount_codes;
CREATE POLICY discount_codes_public_read ON discount_codes
  FOR SELECT USING (active = true);

-- Admins manage all codes (read incl. inactive, create, edit, delete).
DROP POLICY IF EXISTS discount_codes_admin_all ON discount_codes;
CREATE POLICY discount_codes_admin_all ON discount_codes
  FOR ALL
  USING (auth.uid() IN (SELECT id FROM admin_users))
  WITH CHECK (auth.uid() IN (SELECT id FROM admin_users));

-- 3. Record which code (if any) was applied on a purchase.
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_code   TEXT;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;
