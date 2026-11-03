import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const path = process.env.DB_PATH || './data/offers.db';
if (path !== ':memory:') mkdirSync(dirname(path), { recursive: true });

const db = new Database(path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offers (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT NOT NULL UNIQUE,
    name              TEXT NOT NULL,
    bonus_title       TEXT NOT NULL,
    short_description TEXT NOT NULL DEFAULT '',
    description       TEXT NOT NULL DEFAULT '',
    highlights        TEXT NOT NULL DEFAULT '[]',
    terms             TEXT NOT NULL DEFAULT '',
    wagering          TEXT NOT NULL DEFAULT '',
    min_deposit       TEXT NOT NULL DEFAULT '',
    payment_methods   TEXT NOT NULL DEFAULT '',
    countries         TEXT NOT NULL DEFAULT '',
    rating            REAL NOT NULL DEFAULT 4.5,
    badge             TEXT NOT NULL DEFAULT '',
    accent_color      TEXT NOT NULL DEFAULT '#f5c451',
    logo_path         TEXT,
    affiliate_url     TEXT NOT NULL,
    featured          INTEGER NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'active',
    sort_order        INTEGER NOT NULL DEFAULT 0,
    clicks            INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT NOT NULL,
    updated_at        TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  -- Brand sites (one per sender domain): served on offers.<domain> and, when its
  -- DNS points here, on <domain>/www.<domain>. theme/copy are generated once
  -- (services/themeGen.js) so each brand looks and reads differently.
  CREATE TABLE IF NOT EXISTS brands (
    domain        TEXT PRIMARY KEY,
    site_name     TEXT NOT NULL,
    contact_email TEXT NOT NULL DEFAULT '',
    theme         TEXT NOT NULL,
    copy          TEXT NOT NULL,
    offer_seed    INTEGER NOT NULL,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
  );
`);

const DEFAULT_SETTINGS = {
  site_name:     'BonusVault',
  tagline:       'Hand-picked casino offers, explained clearly.',
  hero_title:    'The best casino welcome offers, all in one place',
  hero_subtitle: 'We compare bonuses, wagering and terms so you can choose with confidence. Read the details, then claim only what suits you.',
  contact_email: 'support@example.com',
  min_age:       '18',
  responsible_gambling_url: 'https://www.begambleaware.org',
};
const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) insertSetting.run(k, v);

export const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);
export default db;
