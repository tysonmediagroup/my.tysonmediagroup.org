-- Cloudflare D1 Schema for myTYSON Accounts & Profiles
-- Run with: npx wrangler d1 execute mytyson-db --file=./schema.sql
-- Note: mytyson-edge-api.js also auto-runs CREATE TABLE IF NOT EXISTS on first request.

CREATE TABLE IF NOT EXISTS mytyson_accounts (
  slug TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  show_real_name INTEGER DEFAULT 1,
  password_hashes TEXT DEFAULT '[]',
  team TEXT DEFAULT 'N',
  badge TEXT DEFAULT 'Standard Member',
  badge_class TEXT DEFAULT 'badge-member',
  has_tyson_badge INTEGER DEFAULT 0,
  role TEXT DEFAULT 'Registered Member',
  division TEXT DEFAULT 'TYSON Media Group',
  bio TEXT DEFAULT '',
  pfp_url TEXT DEFAULT '',
  google_sub TEXT DEFAULT NULL,
  google_email TEXT DEFAULT NULL,
  is_power_admin INTEGER DEFAULT 0,
  data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mytyson_accounts_google_sub ON mytyson_accounts(google_sub);
CREATE INDEX IF NOT EXISTS idx_mytyson_accounts_google_email ON mytyson_accounts(google_email);

CREATE TABLE IF NOT EXISTS mytyson_profiles (
  slug TEXT PRIMARY KEY,
  data_json TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
