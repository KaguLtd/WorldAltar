use std::{
  fs,
  path::{Path, PathBuf},
};

use rusqlite::{params, Connection, OptionalExtension};

use super::{
  database,
  entity_model::{
    slugify, AutosaveEntityInput, CharacterFields, CreateEntityCommon, CreateEntityInput,
    EntityCommon, EntityRecord, EntityType, EventFields, LocationFields, RegionFields,
    RenameEntityInput,
  },
  time_engine::is_visible_at_year,
};

pub struct EntityRepository {
  connection: Connection,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResult {
  pub id: String,
  #[serde(rename = "type")]
  pub entity_type: EntityType,
  pub title: String,
  pub summary: String,
}

impl EntityRepository {
  pub fn open(database_path: &Path) -> Result<Self, String> {
    let connection = database::open_connection(database_path)?;
    Ok(Self { connection })
  }

  pub fn create(&mut self, input: CreateEntityInput) -> Result<EntityRecord, String> {
    let entity_type = match &input {
      CreateEntityInput::Character { .. } => EntityType::Character,
      CreateEntityInput::Location { .. } => EntityType::Location,
      CreateEntityInput::Region { .. } => EntityType::Region,
      CreateEntityInput::Event { .. } => EntityType::Event,
    };

    let (common_input, extra_json) = match input {
      CreateEntityInput::Character { common, fields } => (common, serde_json::to_string(&fields)),
      CreateEntityInput::Location { common, fields } => (common, serde_json::to_string(&fields)),
      CreateEntityInput::Region { common, fields } => (common, serde_json::to_string(&fields)),
      CreateEntityInput::Event { common, fields } => (common, serde_json::to_string(&fields)),
    };
    let extra_json = extra_json.map_err(|err| err.to_string())?;

    let CreateEntityCommon {
      slug,
      title,
      summary,
      body,
      start_year,
      end_year,
      is_ongoing,
      latitude,
      longitude,
      geometry_ref,
      cover_image_path,
      thumbnail_path,
    } = common_input;

    let next_id = next_entity_id(&self.connection, entity_type)?;
    let now = database::now_timestamp();
    let slug = unique_slug(&self.connection, slug.unwrap_or_else(|| slugify(&title)), None)?;
    let common = EntityCommon {
      id: next_id,
      entity_type,
      slug,
      title,
      summary: summary.unwrap_or_default(),
      body: body.unwrap_or_default(),
      start_year,
      end_year,
      is_ongoing: is_ongoing.unwrap_or(false),
      latitude,
      longitude,
      geometry_ref,
      cover_image_path,
      thumbnail_path,
      created_at: now.clone(),
      updated_at: now,
    };

    let record = match entity_type {
      EntityType::Character => EntityRecord::Character {
        common: common.clone(),
        fields: serde_json::from_str::<CharacterFields>(&extra_json).map_err(|err| err.to_string())?,
      },
      EntityType::Location => EntityRecord::Location {
        common: common.clone(),
        fields: serde_json::from_str::<LocationFields>(&extra_json).map_err(|err| err.to_string())?,
      },
      EntityType::Region => EntityRecord::Region {
        common: common.clone(),
        fields: serde_json::from_str::<RegionFields>(&extra_json).map_err(|err| err.to_string())?,
      },
      EntityType::Event => EntityRecord::Event {
        common,
        fields: serde_json::from_str::<EventFields>(&extra_json).map_err(|err| err.to_string())?,
      },
    };

    persist_entity(&self.connection, &record, &extra_json)?;
    Ok(record)
  }

  pub fn get(&self, id: &str) -> Result<Option<EntityRecord>, String> {
    let mut statement = self
      .connection
      .prepare(
        "SELECT id, type, slug, title, summary, body, start_year, end_year, is_ongoing, latitude,
         longitude, geometry_ref, cover_image_path, thumbnail_path, extra_json, created_at, updated_at
         FROM entities WHERE id = ?1",
      )
      .map_err(|err| err.to_string())?;

    statement
      .query_row(params![id], row_to_entity)
      .optional()
      .map_err(|err| err.to_string())
  }

  pub fn list(&self, year: Option<i32>) -> Result<Vec<EntityRecord>, String> {
    let mut statement = self
      .connection
      .prepare(
        "SELECT id, type, slug, title, summary, body, start_year, end_year, is_ongoing, latitude,
         longitude, geometry_ref, cover_image_path, thumbnail_path, extra_json, created_at, updated_at
         FROM entities ORDER BY created_at ASC",
      )
      .map_err(|err| err.to_string())?;

    let rows = statement
      .query_map([], row_to_entity)
      .map_err(|err| err.to_string())?;

    let mut records = Vec::new();
    for row in rows {
      records.push(row.map_err(|err| err.to_string())?);
    }
    Ok(filter_visible(records, year))
  }

  pub fn rename(&self, input: RenameEntityInput) -> Result<EntityRecord, String> {
    let current = self
      .get(&input.id)?
      .ok_or_else(|| "entity not found".to_string())?;
    let slug = unique_slug(&self.connection, slugify(&input.title), Some(&input.id))?;
    let now = database::now_timestamp();

    self.connection
      .execute(
        "UPDATE entities SET title = ?1, slug = ?2, updated_at = ?3 WHERE id = ?4",
        params![input.title, slug, now, input.id],
      )
      .map_err(|err| err.to_string())?;

    let updated = self
      .get(&current.common().id)?
      .ok_or_else(|| "entity rename failed".to_string())?;
    sync_search_index(&self.connection, &updated)?;
    Ok(updated)
  }

  pub fn autosave(&mut self, database_path: &Path, input: AutosaveEntityInput) -> Result<EntityRecord, String> {
    let current = self
      .get(&input.id)?
      .ok_or_else(|| "entity not found".to_string())?;
    let next_slug = unique_slug(&self.connection, slugify(&input.title), Some(&input.id))?;
    let payload = AutosavePayload {
      id: input.id.clone(),
      title: input.title,
      slug: next_slug,
      summary: input.summary,
      body: input.body,
      updated_at: database::now_timestamp(),
    };

    write_pending_autosave(database_path, &payload)?;

    let transaction = self.connection.transaction().map_err(|err| err.to_string())?;
    transaction
      .execute(
        "UPDATE entities
         SET title = ?1, slug = ?2, summary = ?3, body = ?4, updated_at = ?5
         WHERE id = ?6",
        params![
          payload.title,
          payload.slug,
          payload.summary,
          payload.body,
          payload.updated_at,
          payload.id
        ],
      )
      .map_err(|err| err.to_string())?;

    let updated = get_with_connection(&transaction, &current.common().id)?
      .ok_or_else(|| "entity autosave failed".to_string())?;
    sync_search_index(&transaction, &updated)?;
    transaction
      .execute(
        "INSERT OR REPLACE INTO autosave_log (entity_id, last_saved_at, source) VALUES (?1, ?2, ?3)",
        params![updated.common().id, updated.common().updated_at, "autosave"],
      )
      .map_err(|err| err.to_string())?;
    transaction.commit().map_err(|err| err.to_string())?;

    finalize_autosave(database_path, &payload, &updated)?;
    Ok(updated)
  }

  pub fn delete(&self, id: &str) -> Result<(), String> {
    self.connection
      .execute("DELETE FROM entity_search WHERE entity_id = ?1", params![id])
      .map_err(|err| err.to_string())?;
    self.connection
      .execute("DELETE FROM entities WHERE id = ?1", params![id])
      .map_err(|err| err.to_string())?;
    Ok(())
  }

  pub fn search(
    &self,
    query: &str,
    year: Option<i32>,
    entity_type: Option<EntityType>,
  ) -> Result<Vec<SearchResult>, String> {
    if query.trim().is_empty() {
      return self
        .list(year)
        .map(|records| {
          filter_type(records, entity_type)
            .into_iter()
            .map(search_result_from_record)
            .collect()
        });
    }

    let mut statement = self
      .connection
      .prepare(
        "SELECT e.id, e.type, e.slug, e.title, e.summary, e.body, e.start_year, e.end_year, e.is_ongoing,
                e.latitude, e.longitude, e.geometry_ref, e.cover_image_path, e.thumbnail_path,
                e.extra_json, e.created_at, e.updated_at
         FROM entity_search s
         JOIN entities e ON e.id = s.entity_id
         WHERE entity_search MATCH ?1
         ORDER BY bm25(entity_search)",
      )
      .map_err(|err| err.to_string())?;
    let rows = statement
      .query_map(params![query.trim()], row_to_entity)
      .map_err(|err| err.to_string())?;
    let mut records = Vec::new();
    for row in rows {
      records.push(row.map_err(|err| err.to_string())?);
    }
    Ok(
      filter_type(filter_visible(records, year), entity_type)
        .into_iter()
        .map(search_result_from_record)
        .collect(),
    )
  }
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AutosaveRecoveryReport {
  pub recovered_count: usize,
  pub conflicted_count: usize,
  pub discarded_count: usize,
}

pub fn recover_autosave(database_path: &Path) -> Result<AutosaveRecoveryReport, String> {
  let autosave_dir = autosave_dir(database_path);
  fs::create_dir_all(&autosave_dir).map_err(|err| err.to_string())?;

  let repository = EntityRepository::open(database_path)?;
  let mut recovered_count = 0;
  let mut conflicted_count = 0;
  let discarded_count = 0;

  for entry in fs::read_dir(&autosave_dir).map_err(|err| err.to_string())? {
    let entry = entry.map_err(|err| err.to_string())?;
    let path = entry.path();
    if path.extension().and_then(|value| value.to_str()) != Some("pending") {
      continue;
    }

    let payload = match read_pending_payload(&path) {
      Some(payload) => payload,
      None => {
        preserve_unreadable_pending(database_path, &path)?;
        conflicted_count += 1;
        continue;
      }
    };

    let current = repository.get(&payload.id)?;
    match current {
      Some(record)
        if record.common().title == payload.title
          && record.common().slug == payload.slug
          && record.common().summary == payload.summary
          && record.common().body == payload.body =>
      {
        write_last_success(database_path, &payload, &record)?;
        fs::remove_file(path).map_err(|err| err.to_string())?;
        recovered_count += 1;
      }
      _ => {
        move_pending_to_conflict(database_path, &path, &payload.id)?;
        conflicted_count += 1;
      }
    }
  }

  Ok(AutosaveRecoveryReport {
    recovered_count,
    conflicted_count,
    discarded_count,
  })
}

pub fn seed_sample_entities(database_path: &Path) -> Result<(), String> {
  let mut repository = EntityRepository::open(database_path)?;
  if !repository.list(None)?.is_empty() {
    return Ok(());
  }

  let region = repository.create(CreateEntityInput::Region {
    common: CreateEntityCommon {
      title: "Orta Bozkir".into(),
      summary: Some("Merkez bolge".into()),
      body: Some("Orta dunya omurga bolgesi.".into()),
      ..CreateEntityCommon::default()
    },
    fields: RegionFields::default(),
  })?;

  let location = repository.create(CreateEntityInput::Location {
    common: CreateEntityCommon {
      title: "Altin Ova".into(),
      summary: Some("Ana yerlesim".into()),
      body: Some("Kervan yollarinin bulustugu ova.".into()),
      latitude: Some(39.92),
      longitude: Some(32.85),
      ..CreateEntityCommon::default()
    },
    fields: LocationFields {
      region_id: Some(region.common().id.clone()),
      location_kind: Some("plain".into()),
    },
  })?;

  repository.create(CreateEntityInput::Character {
    common: CreateEntityCommon {
      title: "Alp Er Tunga".into(),
      summary: Some("Bozkir hukumdari".into()),
      body: Some("Karakter seed kaydi.".into()),
      start_year: Some(1200),
      ..CreateEntityCommon::default()
    },
    fields: CharacterFields {
      culture: Some("Turkic".into()),
      birth_year_label: Some("MVP seed".into()),
    },
  })?;

  repository.create(CreateEntityInput::Event {
    common: CreateEntityCommon {
      title: "X Savasi".into(),
      summary: Some("Tek yillik event".into()),
      body: Some("Search ve repository seed kaydi.".into()),
      start_year: Some(1204),
      end_year: Some(1204),
      ..CreateEntityCommon::default()
    },
    fields: EventFields {
      location_id: Some(location.common().id.clone()),
    },
  })?;

  Ok(())
}

#[derive(Debug, serde::Serialize, serde::Deserialize)]
struct AutosavePayload {
  id: String,
  title: String,
  slug: String,
  summary: String,
  body: String,
  updated_at: String,
}

fn next_entity_id(connection: &Connection, entity_type: EntityType) -> Result<String, String> {
  let current = connection
    .query_row(
      "SELECT value FROM app_metadata WHERE key = ?1",
      params![entity_type.counter_key()],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())?;
  let next_value = current
    .and_then(|value| value.parse::<u32>().ok())
    .unwrap_or(0)
    + 1;

  connection
    .execute(
      "INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?1, ?2)",
      params![entity_type.counter_key(), next_value.to_string()],
    )
    .map_err(|err| err.to_string())?;

  Ok(format!("{}_{next_value:03}", entity_type.id_prefix()))
}

fn persist_entity(connection: &Connection, record: &EntityRecord, extra_json: &str) -> Result<(), String> {
  let common = record.common();
  connection
    .execute(
      "INSERT INTO entities (
        id, type, slug, title, summary, body, start_year, end_year, is_ongoing,
        latitude, longitude, geometry_ref, cover_image_path, thumbnail_path,
        extra_json, created_at, updated_at
      ) VALUES (
        ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
        ?10, ?11, ?12, ?13, ?14,
        ?15, ?16, ?17
      )",
      params![
        common.id,
        common.entity_type.as_str(),
        common.slug,
        common.title,
        common.summary,
        common.body,
        common.start_year,
        common.end_year,
        if common.is_ongoing { 1 } else { 0 },
        common.latitude,
        common.longitude,
        common.geometry_ref,
        common.cover_image_path,
        common.thumbnail_path,
        extra_json,
        common.created_at,
        common.updated_at
      ],
    )
    .map_err(|err| err.to_string())?;
  sync_search_index(connection, record)?;
  Ok(())
}

fn sync_search_index(connection: &Connection, record: &EntityRecord) -> Result<(), String> {
  let common = record.common();
  connection
    .execute("DELETE FROM entity_search WHERE entity_id = ?1", params![common.id])
    .map_err(|err| err.to_string())?;
  connection
    .execute(
      "INSERT INTO entity_search (entity_id, type, title, summary, body) VALUES (?1, ?2, ?3, ?4, ?5)",
      params![
        common.id,
        common.entity_type.as_str(),
        common.title,
        common.summary,
        common.body
      ],
    )
    .map_err(|err| err.to_string())?;
  Ok(())
}

fn unique_slug(connection: &Connection, base: String, current_id: Option<&str>) -> Result<String, String> {
  let normalized = if base.is_empty() { "entity".to_string() } else { base };
  let mut candidate = normalized.clone();
  let mut index = 2;

  loop {
    let existing = connection
      .query_row(
        "SELECT id FROM entities WHERE slug = ?1",
        params![candidate],
        |row| row.get::<_, String>(0),
      )
      .optional()
      .map_err(|err| err.to_string())?;

    match existing {
      None => return Ok(candidate),
      Some(id) if current_id.is_some() && current_id == Some(id.as_str()) => return Ok(candidate),
      Some(_) => {
        candidate = format!("{normalized}-{index}");
        index += 1;
      }
    }
  }
}

fn get_with_connection(connection: &Connection, id: &str) -> Result<Option<EntityRecord>, String> {
  let mut statement = connection
    .prepare(
      "SELECT id, type, slug, title, summary, body, start_year, end_year, is_ongoing, latitude,
       longitude, geometry_ref, cover_image_path, thumbnail_path, extra_json, created_at, updated_at
       FROM entities WHERE id = ?1",
    )
    .map_err(|err| err.to_string())?;

  statement
    .query_row(params![id], row_to_entity)
    .optional()
    .map_err(|err| err.to_string())
}

fn autosave_dir(database_path: &Path) -> PathBuf {
  database_path
    .parent()
    .unwrap_or_else(|| Path::new("."))
    .join("cache")
    .join("autosave")
}

fn pending_path(database_path: &Path, entity_id: &str) -> PathBuf {
  autosave_dir(database_path).join(format!("{entity_id}.pending"))
}

fn conflict_path(database_path: &Path, entity_id: &str) -> PathBuf {
  autosave_dir(database_path).join(format!("{entity_id}.conflict.json"))
}

fn success_path(database_path: &Path, entity_id: &str) -> PathBuf {
  autosave_dir(database_path).join(format!("{entity_id}.last.json"))
}

fn write_pending_autosave(database_path: &Path, payload: &AutosavePayload) -> Result<(), String> {
  let autosave_dir = autosave_dir(database_path);
  fs::create_dir_all(&autosave_dir).map_err(|err| err.to_string())?;
  let pending_path = pending_path(database_path, &payload.id);
  let temp_path = pending_path.with_extension("tmp");
  let content = serde_json::to_string_pretty(payload).map_err(|err| err.to_string())?;

  fs::write(&temp_path, content).map_err(|err| err.to_string())?;
  fs::rename(temp_path, pending_path).map_err(|err| err.to_string())
}

fn finalize_autosave(
  database_path: &Path,
  payload: &AutosavePayload,
  record: &EntityRecord,
) -> Result<(), String> {
  write_last_success(database_path, payload, record)?;
  let pending_path = pending_path(database_path, &payload.id);
  if pending_path.exists() {
    fs::remove_file(pending_path).map_err(|err| err.to_string())?;
  }
  Ok(())
}

fn write_last_success(
  database_path: &Path,
  payload: &AutosavePayload,
  record: &EntityRecord,
) -> Result<(), String> {
  let success_path = success_path(database_path, &payload.id);
  let temp_path = success_path.with_extension("tmp");
  let snapshot = serde_json::json!({
    "id": record.common().id,
    "title": record.common().title,
    "slug": record.common().slug,
    "summary": record.common().summary,
    "body": record.common().body,
    "updatedAt": record.common().updated_at
  });
  let content = serde_json::to_string_pretty(&snapshot).map_err(|err| err.to_string())?;

  fs::write(&temp_path, content).map_err(|err| err.to_string())?;
  fs::rename(temp_path, success_path).map_err(|err| err.to_string())
}

fn read_pending_payload(path: &Path) -> Option<AutosavePayload> {
  let raw = fs::read_to_string(path).ok()?;
  serde_json::from_str(&raw).ok()
}

fn move_pending_to_conflict(database_path: &Path, pending_path: &Path, entity_id: &str) -> Result<(), String> {
  let conflict_path = conflict_path(database_path, entity_id);
  if conflict_path.exists() {
    fs::remove_file(&conflict_path).map_err(|err| err.to_string())?;
  }
  fs::rename(pending_path, conflict_path).map_err(|err| err.to_string())
}

fn preserve_unreadable_pending(database_path: &Path, pending_path: &Path) -> Result<(), String> {
  let file_stem = pending_path
    .file_stem()
    .and_then(|value| value.to_str())
    .unwrap_or("unknown");
  let conflict_path = autosave_dir(database_path).join(format!("{file_stem}.conflict.raw"));
  if conflict_path.exists() {
    fs::remove_file(&conflict_path).map_err(|err| err.to_string())?;
  }
  fs::rename(pending_path, conflict_path).map_err(|err| err.to_string())
}

fn row_to_entity(row: &rusqlite::Row<'_>) -> rusqlite::Result<EntityRecord> {
  let entity_type = parse_entity_type(row.get::<_, String>(1)?.as_str())?;
  let common = EntityCommon {
    id: row.get(0)?,
    entity_type,
    slug: row.get(2)?,
    title: row.get(3)?,
    summary: row.get(4)?,
    body: row.get(5)?,
    start_year: row.get(6)?,
    end_year: row.get(7)?,
    is_ongoing: row.get::<_, i64>(8)? == 1,
    latitude: row.get(9)?,
    longitude: row.get(10)?,
    geometry_ref: row.get(11)?,
    cover_image_path: row.get(12)?,
    thumbnail_path: row.get(13)?,
    created_at: row.get(15)?,
    updated_at: row.get(16)?,
  };
  let extra_json = row.get::<_, String>(14)?;

  match entity_type {
    EntityType::Character => Ok(EntityRecord::Character {
      common: common.clone(),
      fields: serde_json::from_str(&extra_json).unwrap_or_default(),
    }),
    EntityType::Location => Ok(EntityRecord::Location {
      common: common.clone(),
      fields: serde_json::from_str(&extra_json).unwrap_or_default(),
    }),
    EntityType::Region => Ok(EntityRecord::Region {
      common: common.clone(),
      fields: serde_json::from_str(&extra_json).unwrap_or_default(),
    }),
    EntityType::Event => Ok(EntityRecord::Event {
      common,
      fields: serde_json::from_str(&extra_json).unwrap_or_default(),
    }),
  }
}

fn parse_entity_type(value: &str) -> rusqlite::Result<EntityType> {
  match value {
    "character" => Ok(EntityType::Character),
    "location" => Ok(EntityType::Location),
    "region" => Ok(EntityType::Region),
    "event" => Ok(EntityType::Event),
    _ => Err(rusqlite::Error::InvalidColumnType(
      1,
      "type".into(),
      rusqlite::types::Type::Text,
    )),
  }
}

fn filter_visible(records: Vec<EntityRecord>, year: Option<i32>) -> Vec<EntityRecord> {
  match year {
    None => records,
    Some(year) => records
      .into_iter()
      .filter(|record| is_visible_at_year(record.common(), year))
      .collect(),
  }
}

fn filter_type(records: Vec<EntityRecord>, entity_type: Option<EntityType>) -> Vec<EntityRecord> {
  match entity_type {
    None => records,
    Some(entity_type) => records
      .into_iter()
      .filter(|record| record.entity_type() == entity_type)
      .collect(),
  }
}

fn search_result_from_record(record: EntityRecord) -> SearchResult {
  SearchResult {
    id: record.common().id.clone(),
    entity_type: record.entity_type(),
    title: record.common().title.clone(),
    summary: record.common().summary.clone(),
  }
}

#[cfg(test)]
mod tests {
  use std::{
    path::{Path, PathBuf},
    time::{SystemTime, UNIX_EPOCH},
  };

  use rusqlite::Connection;

  use super::*;
  use crate::core::entity_model::{
    AutosaveEntityInput, CreateEntityCommon, CreateEntityInput, EventFields, LocationFields,
  };

  fn repo() -> EntityRepository {
    let connection = Connection::open_in_memory().unwrap();
    connection.execute_batch(include_str!("../../migrations/0001_init.sql")).unwrap();
    connection.execute_batch(include_str!("../../migrations/0002_entities.sql")).unwrap();
    connection.execute_batch(include_str!("../../migrations/0003_autosave.sql")).unwrap();
    EntityRepository { connection }
  }

  fn autosave_test_dir() -> PathBuf {
    let nonce = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let base = std::env::temp_dir().join(format!(
      "worldaltar-autosave-test-{}-{}",
      std::process::id(),
      nonce
    ));
    std::fs::create_dir_all(base.join("cache").join("autosave")).unwrap();
    base.join("worldaltar.db")
  }

  fn file_repo(database_path: &Path) -> EntityRepository {
    database::migrate_database(database_path).unwrap();
    EntityRepository::open(database_path).unwrap()
  }

  #[test]
  fn at01_event_visibility_hits_list_and_search_same_way() {
    let mut repository = repo();
    repository
      .create(CreateEntityInput::Event {
        common: CreateEntityCommon {
          title: "Battle of X".into(),
          start_year: Some(1204),
          end_year: Some(1204),
          ..CreateEntityCommon::default()
        },
        fields: EventFields::default(),
      })
      .unwrap();

    assert!(repository.list(Some(1203)).unwrap().is_empty());
    assert_eq!(repository.list(Some(1204)).unwrap().len(), 1);
    assert_eq!(
      repository
        .search("Battle", Some(1204), Some(EntityType::Event))
        .unwrap()
        .len(),
      1
    );
    assert!(repository.search("Battle", Some(1205), None).unwrap().is_empty());
  }

  #[test]
  fn at02_search_and_list_share_same_visibility_set() {
    let mut repository = repo();
    repository
      .create(CreateEntityInput::Location {
        common: CreateEntityCommon {
          title: "City of Gates".into(),
          start_year: Some(1453),
          ..CreateEntityCommon::default()
        },
        fields: LocationFields::default(),
      })
      .unwrap();
    repository
      .create(CreateEntityInput::Event {
        common: CreateEntityCommon {
          title: "Old Siege".into(),
          start_year: Some(1204),
          end_year: Some(1204),
          ..CreateEntityCommon::default()
        },
        fields: EventFields::default(),
      })
      .unwrap();

    let list_ids: Vec<_> = repository
      .list(Some(1453))
      .unwrap()
      .into_iter()
      .map(|record| record.common().id.clone())
      .collect();
    let search_ids: Vec<_> = repository
      .search("", Some(1453), None)
      .unwrap()
      .into_iter()
      .map(|record| record.id)
      .collect();
    let typed_search_ids: Vec<_> = repository
      .search("", Some(1453), Some(EntityType::Location))
      .unwrap()
      .into_iter()
      .map(|record| record.id)
      .collect();
    let hidden_type_ids: Vec<_> = repository
      .search("", Some(1453), Some(EntityType::Event))
      .unwrap()
      .into_iter()
      .map(|record| record.id)
      .collect();

    assert_eq!(list_ids, search_ids);
    assert_eq!(list_ids, typed_search_ids);
    assert_eq!(list_ids.len(), 1);
    assert!(hidden_type_ids.is_empty());
  }

  #[test]
  fn at03_rename_preserves_stable_id() {
    let mut repository = repo();
    let created = repository
      .create(CreateEntityInput::Character {
        common: CreateEntityCommon {
          title: "Alp Er Tunga".into(),
          ..CreateEntityCommon::default()
        },
        fields: CharacterFields::default(),
      })
      .unwrap();

    let renamed = repository
      .rename(RenameEntityInput {
        id: created.common().id.clone(),
        title: "Alp Tunga".into(),
      })
      .unwrap();
    let fetched = repository.get(&created.common().id).unwrap().unwrap();

    assert_eq!(renamed.common().id, created.common().id);
    assert_eq!(fetched.common().id, created.common().id);
    assert_eq!(renamed.common().title, "Alp Tunga");
    assert_eq!(fetched.common().title, "Alp Tunga");
    assert_ne!(renamed.common().slug, created.common().slug);
  }

  #[test]
  fn autosave_updates_entity_and_clears_pending_file() {
    let mut repository = repo();
    let database_path = autosave_test_dir();
    let created = repository
      .create(CreateEntityInput::Character {
        common: CreateEntityCommon {
          title: "Alp Er Tunga".into(),
          summary: Some("Old".into()),
          body: Some("Before".into()),
          ..CreateEntityCommon::default()
        },
        fields: CharacterFields::default(),
      })
      .unwrap();

    let updated = repository
      .autosave(
        &database_path,
        AutosaveEntityInput {
          id: created.common().id.clone(),
          title: "Alp Tunga".into(),
          summary: "New summary".into(),
          body: "New body".into(),
        },
      )
      .unwrap();

    assert_eq!(updated.common().id, created.common().id);
    assert_eq!(updated.common().title, "Alp Tunga");
    assert!(!pending_path(&database_path, &created.common().id).exists());
    assert!(success_path(&database_path, &created.common().id).exists());
  }

  #[test]
  fn recovery_preserves_uncommitted_pending_payload_as_conflict() {
    let database_path = autosave_test_dir();
    let mut repository = file_repo(&database_path);
    let created = repository
      .create(CreateEntityInput::Event {
        common: CreateEntityCommon {
          title: "Battle of X".into(),
          summary: Some("Old".into()),
          body: Some("Stable".into()),
          ..CreateEntityCommon::default()
        },
        fields: EventFields::default(),
      })
      .unwrap();

    write_pending_autosave(
      &database_path,
      &AutosavePayload {
        id: created.common().id.clone(),
        title: "Broken Draft".into(),
        slug: "broken-draft".into(),
        summary: "Half write".into(),
        body: "Should discard".into(),
        updated_at: "2".into(),
      },
    )
    .unwrap();

    let report = recover_autosave(&database_path).unwrap();
    let current = repository.get(&created.common().id).unwrap().unwrap();

    assert_eq!(report.conflicted_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert_eq!(current.common().title, "Battle of X");
    assert!(!pending_path(&database_path, &created.common().id).exists());
    assert!(conflict_path(&database_path, &created.common().id).exists());
  }

  #[test]
  fn recovery_marks_committed_pending_payload_as_recovered() {
    let database_path = autosave_test_dir();
    let mut repository = file_repo(&database_path);
    let created = repository
      .create(CreateEntityInput::Event {
        common: CreateEntityCommon {
          title: "Battle of X".into(),
          summary: Some("Old".into()),
          body: Some("Stable".into()),
          ..CreateEntityCommon::default()
        },
        fields: EventFields::default(),
      })
      .unwrap();

    write_pending_autosave(
      &database_path,
      &AutosavePayload {
        id: created.common().id.clone(),
        title: created.common().title.clone(),
        slug: created.common().slug.clone(),
        summary: created.common().summary.clone(),
        body: created.common().body.clone(),
        updated_at: created.common().updated_at.clone(),
      },
    )
    .unwrap();

    let report = recover_autosave(&database_path).unwrap();

    assert_eq!(report.recovered_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert!(!pending_path(&database_path, &created.common().id).exists());
    assert!(success_path(&database_path, &created.common().id).exists());
  }

  #[test]
  fn recovery_preserves_bad_pending_payload_without_global_failure() {
    let database_path = autosave_test_dir();
    let bad_path = pending_path(&database_path, "char_404");
    std::fs::write(&bad_path, "{bad json").unwrap();

    let report = recover_autosave(&database_path).unwrap();

    assert_eq!(report.recovered_count, 0);
    assert_eq!(report.conflicted_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert!(!bad_path.exists());
    assert!(autosave_dir(&database_path).join("char_404.conflict.raw").exists());
  }

  #[test]
  fn recovery_is_idempotent_after_cleanup() {
    let database_path = autosave_test_dir();
    let mut repository = file_repo(&database_path);
    let created = repository
      .create(CreateEntityInput::Event {
        common: CreateEntityCommon {
          title: "Battle of X".into(),
          summary: Some("Old".into()),
          body: Some("Stable".into()),
          ..CreateEntityCommon::default()
        },
        fields: EventFields::default(),
      })
      .unwrap();

    write_pending_autosave(
      &database_path,
      &AutosavePayload {
        id: created.common().id.clone(),
        title: "Broken Draft".into(),
        slug: "broken-draft".into(),
        summary: "Half write".into(),
        body: "Should discard".into(),
        updated_at: "2".into(),
      },
    )
    .unwrap();

    let first = recover_autosave(&database_path).unwrap();
    let second = recover_autosave(&database_path).unwrap();

    assert_eq!(first.conflicted_count, 1);
    assert_eq!(second.recovered_count, 0);
    assert_eq!(second.conflicted_count, 0);
    assert_eq!(second.discarded_count, 0);
  }
}
