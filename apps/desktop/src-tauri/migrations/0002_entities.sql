CREATE TABLE IF NOT EXISTS entities (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  start_year INTEGER,
  end_year INTEGER,
  is_ongoing INTEGER NOT NULL DEFAULT 0,
  latitude REAL,
  longitude REAL,
  geometry_ref TEXT,
  cover_image_path TEXT,
  thumbnail_path TEXT,
  extra_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_entities_slug ON entities (slug);
CREATE INDEX IF NOT EXISTS idx_entities_type ON entities (type);

CREATE VIRTUAL TABLE IF NOT EXISTS entity_search USING fts5(
  entity_id UNINDEXED,
  type,
  title,
  summary,
  body
);
