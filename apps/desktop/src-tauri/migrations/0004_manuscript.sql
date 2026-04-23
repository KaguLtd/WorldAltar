CREATE TABLE IF NOT EXISTS manuscript_nodes (
  id TEXT PRIMARY KEY,
  parent_id TEXT REFERENCES manuscript_nodes(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK(kind IN ('chapter', 'scene')),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  position INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manuscript_nodes_parent ON manuscript_nodes(parent_id, position);

CREATE TABLE IF NOT EXISTS manuscript_mentions (
  id TEXT PRIMARY KEY,
  node_id TEXT NOT NULL REFERENCES manuscript_nodes(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  start_offset INTEGER NOT NULL,
  end_offset INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_manuscript_mentions_entity ON manuscript_mentions(entity_id, node_id);
CREATE INDEX IF NOT EXISTS idx_manuscript_mentions_node ON manuscript_mentions(node_id, start_offset);

CREATE TABLE IF NOT EXISTS manuscript_autosave_log (
  node_id TEXT PRIMARY KEY REFERENCES manuscript_nodes(id) ON DELETE CASCADE,
  last_saved_at TEXT NOT NULL,
  source TEXT NOT NULL
);
