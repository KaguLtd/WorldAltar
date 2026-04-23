CREATE TABLE IF NOT EXISTS autosave_log (
  entity_id TEXT PRIMARY KEY,
  last_saved_at TEXT NOT NULL,
  source TEXT NOT NULL
);
