-- ============================================================
-- AlBayan Alert Map — Supabase Database Setup
-- Run this ENTIRE script in the Supabase SQL Editor
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================

-- 1. Create the alerts table
CREATE TABLE IF NOT EXISTS alerts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  area TEXT NOT NULL,
  type TEXT NOT NULL,
  type_label TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT DEFAULT '',
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  radius INTEGER DEFAULT 800,
  expires_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
  is_urgent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable Row Level Security
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- 3. Public read policy — anyone can see active alerts
CREATE POLICY "Anyone can read alerts"
  ON alerts FOR SELECT
  USING (true);

-- 4. Authenticated users (admins) can insert alerts
CREATE POLICY "Admins can insert alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Authenticated users (admins) can update alerts
CREATE POLICY "Admins can update alerts"
  ON alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. Authenticated users (admins) can delete alerts
CREATE POLICY "Admins can delete alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (true);

-- 7. Enable real-time for the alerts table
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- 8. Create an index for faster active alert queries
CREATE INDEX idx_alerts_status_expires ON alerts (status, expires_at);

-- ============================================================
-- DONE! Now go to Authentication → Users → Add User
-- to create your admin account (email + password).
-- ============================================================
