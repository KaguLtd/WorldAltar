use std::{
  path::Path,
  time::{SystemTime, UNIX_EPOCH},
};

use rusqlite::{params, Connection};

use super::projects::WorldProject;

const MIGRATIONS: [(&str, &str); 4] = [
  ("0001_init", include_str!("../../migrations/0001_init.sql")),
  ("0002_entities", include_str!("../../migrations/0002_entities.sql")),
  ("0003_autosave", include_str!("../../migrations/0003_autosave.sql")),
  ("0004_manuscript", include_str!("../../migrations/0004_manuscript.sql")),
];

pub fn current_schema_version() -> u32 {
  MIGRATIONS.len() as u32
}

pub fn open_connection(database_path: &Path) -> Result<Connection, String> {
  let connection = Connection::open(database_path).map_err(|err| err.to_string())?;
  connection
    .pragma_update(None, "journal_mode", "WAL")
    .map_err(|err| err.to_string())?;
  Ok(connection)
}

pub fn migrate_database(database_path: &Path) -> Result<(), String> {
  let connection = open_connection(database_path)?;

  connection
    .execute_batch("BEGIN IMMEDIATE;")
    .map_err(|err| err.to_string())?;

  for (version, sql) in MIGRATIONS {
    let applied = connection
      .query_row(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'migrations'",
        [],
        |row| row.get::<_, i64>(0),
      )
      .map_err(|err| err.to_string())?;

    let already_applied = if applied == 0 {
      false
    } else {
      connection
        .query_row(
          "SELECT COUNT(*) FROM migrations WHERE version = ?1",
          params![version],
          |row| row.get::<_, i64>(0),
        )
        .map(|count| count > 0)
        .map_err(|err| err.to_string())?
    };

    if already_applied {
      continue;
    }

    connection.execute_batch(sql).map_err(|err| err.to_string())?;
    connection
      .execute(
        "INSERT INTO migrations (version, applied_at) VALUES (?1, ?2)",
        params![version, now_timestamp()],
      )
      .map_err(|err| err.to_string())?;
  }

  connection
    .execute_batch("COMMIT;")
    .map_err(|err| err.to_string())?;
  Ok(())
}

pub fn seed_project_metadata(database_path: &Path, project: &WorldProject) -> Result<(), String> {
  let connection = open_connection(database_path)?;
  let schema_version = project.schema_version.to_string();
  let metadata = [
    ("project_id", project.id.as_str()),
    ("project_title", project.title.as_str()),
    ("project_slug", project.slug.as_str()),
    ("schema_version", schema_version.as_str()),
    ("created_at", project.created_at.as_str()),
    ("updated_at", project.updated_at.as_str()),
  ];

  for (key, value) in metadata {
    connection
      .execute(
        "INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?1, ?2)",
        params![key, value],
      )
      .map_err(|err| err.to_string())?;
  }

  Ok(())
}

pub fn now_timestamp() -> String {
  let seconds = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|value| value.as_secs())
    .unwrap_or_default();
  seconds.to_string()
}
