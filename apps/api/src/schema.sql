CREATE TABLE IF NOT EXISTS identities (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  statement   TEXT,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS systems (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  description  TEXT,
  identity_id  TEXT REFERENCES identities(id) ON DELETE SET NULL,
  rule_type    TEXT NOT NULL DEFAULT 'count',
  rule_count   INTEGER NOT NULL DEFAULT 1,
  rule_period  TEXT NOT NULL DEFAULT 'day',
  created_at   TEXT NOT NULL
);
-- Migration for existing systems tables:
--   ALTER TABLE systems ADD COLUMN rule_type TEXT NOT NULL DEFAULT 'count';
--   ALTER TABLE systems ADD COLUMN rule_count INTEGER NOT NULL DEFAULT 1;
--   ALTER TABLE systems ADD COLUMN rule_period TEXT NOT NULL DEFAULT 'day';

CREATE TABLE IF NOT EXISTS routines (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  frequency    TEXT NOT NULL,
  time_range   TEXT,
  preferred_days TEXT,
  description  TEXT,
  created_at   TEXT NOT NULL,
  paused       INTEGER NOT NULL DEFAULT 0,
  identity_id  TEXT REFERENCES identities(id) ON DELETE SET NULL,
  system_id    TEXT REFERENCES systems(id) ON DELETE SET NULL
);

-- Migrations for existing databases. Run ONCE by hand; ADD COLUMN is not
-- idempotent and errors if the column already exists:
--   ALTER TABLE routines ADD COLUMN identity_id TEXT REFERENCES identities(id) ON DELETE SET NULL;
--   ALTER TABLE routines ADD COLUMN system_id TEXT REFERENCES systems(id) ON DELETE SET NULL;
-- (create the systems table first, above.)

CREATE TABLE IF NOT EXISTS reflections (
  date  TEXT PRIMARY KEY,
  mood  TEXT NOT NULL,
  note  TEXT
);

CREATE TABLE IF NOT EXISTS completions (
  routine_id  TEXT NOT NULL,
  date        TEXT NOT NULL,
  count       INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (routine_id, date),
  FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gamification (
  id              TEXT PRIMARY KEY DEFAULT 'current',
  xp              INTEGER NOT NULL DEFAULT 0,
  level           INTEGER NOT NULL DEFAULT 1,
  achievements    TEXT NOT NULL DEFAULT '[]',
  streak_freezes  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS perfect_day_bonuses (
  date TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id          TEXT PRIMARY KEY,
  endpoint    TEXT NOT NULL UNIQUE,
  p256dh      TEXT NOT NULL,
  auth        TEXT NOT NULL,
  created_at  TEXT NOT NULL
);

INSERT OR IGNORE INTO gamification (id) VALUES ('current');
