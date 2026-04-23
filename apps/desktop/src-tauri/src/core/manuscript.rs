use std::{
  fs,
  path::{Path, PathBuf},
};

use rusqlite::{params, Connection, OptionalExtension};
use serde::{Deserialize, Serialize};

use super::{database, entity_model::slugify};

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum ManuscriptNodeKind {
  Chapter,
  Scene,
}

impl ManuscriptNodeKind {
  fn as_str(&self) -> &'static str {
    match self {
      Self::Chapter => "chapter",
      Self::Scene => "scene",
    }
  }

  fn id_prefix(&self) -> &'static str {
    match self {
      Self::Chapter => "msc_ch",
      Self::Scene => "msc_sc",
    }
  }

  fn counter_key(&self) -> &'static str {
    match self {
      Self::Chapter => "seq_manuscript_chapter",
      Self::Scene => "seq_manuscript_scene",
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptNode {
  pub id: String,
  pub parent_id: Option<String>,
  pub kind: ManuscriptNodeKind,
  pub slug: String,
  pub title: String,
  pub body: String,
  pub summary: String,
  pub position: i64,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptMention {
  pub id: String,
  pub node_id: String,
  pub entity_id: String,
  pub label: String,
  pub start_offset: i64,
  pub end_offset: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptSceneDetail {
  pub node: ManuscriptNode,
  pub mentions: Vec<ManuscriptMention>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptTreeItem {
  pub node: ManuscriptNode,
  pub children: Vec<ManuscriptNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntityBacklink {
  pub node_id: String,
  pub chapter_id: Option<String>,
  pub chapter_title: Option<String>,
  pub scene_title: String,
  pub entity_id: String,
  pub label: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MentionInput {
  pub entity_id: String,
  pub label: String,
  pub start_offset: i64,
  pub end_offset: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChapterInput {
  pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSceneInput {
  pub chapter_id: String,
  pub title: String,
  pub body: Option<String>,
  pub summary: Option<String>,
  pub mentions: Vec<MentionInput>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutosaveSceneInput {
  pub id: String,
  pub title: String,
  pub body: String,
  pub summary: String,
  pub mentions: Vec<MentionInput>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ManuscriptRecoveryReport {
  pub recovered_count: usize,
  pub conflicted_count: usize,
  pub discarded_count: usize,
}

pub struct ManuscriptRepository {
  connection: Connection,
}

impl ManuscriptRepository {
  pub fn open(database_path: &Path) -> Result<Self, String> {
    let connection = database::open_connection(database_path)?;
    Ok(Self { connection })
  }

  pub fn list_tree(&self) -> Result<Vec<ManuscriptTreeItem>, String> {
    let chapters = self.load_nodes_by_kind(ManuscriptNodeKind::Chapter)?;
    let scenes = self.load_nodes_by_kind(ManuscriptNodeKind::Scene)?;

    Ok(chapters
      .into_iter()
      .map(|chapter| ManuscriptTreeItem {
        children: scenes
          .iter()
          .filter(|scene| scene.parent_id.as_deref() == Some(chapter.id.as_str()))
          .cloned()
          .collect(),
        node: chapter,
      })
      .collect())
  }

  pub fn get_scene(&self, id: &str) -> Result<Option<ManuscriptSceneDetail>, String> {
    let node = get_node(&self.connection, id)?;
    match node {
      Some(node) if node.kind == ManuscriptNodeKind::Scene => Ok(Some(ManuscriptSceneDetail {
        mentions: list_mentions(&self.connection, id)?,
        node,
      })),
      Some(_) => Err("node is not scene".into()),
      None => Ok(None),
    }
  }

  pub fn create_chapter(&self, input: CreateChapterInput) -> Result<ManuscriptNode, String> {
    let title = input.title.trim();
    if title.is_empty() {
      return Err("chapter title required".into());
    }

    let position = next_position(&self.connection, None)?;
    let node = ManuscriptNode {
      id: next_node_id(&self.connection, ManuscriptNodeKind::Chapter)?,
      parent_id: None,
      kind: ManuscriptNodeKind::Chapter,
      slug: unique_node_slug(&self.connection, slugify(title), None)?,
      title: title.into(),
      body: String::new(),
      summary: String::new(),
      position,
      created_at: database::now_timestamp(),
      updated_at: database::now_timestamp(),
    };

    persist_node(&self.connection, &node)?;
    Ok(node)
  }

  pub fn create_scene(&self, input: CreateSceneInput) -> Result<ManuscriptSceneDetail, String> {
    if get_node(&self.connection, &input.chapter_id)?.is_none() {
      return Err("chapter not found".into());
    }

    let title = input.title.trim();
    if title.is_empty() {
      return Err("scene title required".into());
    }

    let chapter_id = input.chapter_id.clone();
    let node = ManuscriptNode {
      id: next_node_id(&self.connection, ManuscriptNodeKind::Scene)?,
      parent_id: Some(chapter_id.clone()),
      kind: ManuscriptNodeKind::Scene,
      slug: unique_node_slug(&self.connection, slugify(title), None)?,
      title: title.into(),
      body: input.body.unwrap_or_default(),
      summary: input.summary.unwrap_or_default(),
      position: next_position(&self.connection, Some(chapter_id))?,
      created_at: database::now_timestamp(),
      updated_at: database::now_timestamp(),
    };

    let detail = persist_scene_detail(&self.connection, &node, &input.mentions)?;
    Ok(detail)
  }

  pub fn autosave_scene(
    &mut self,
    database_path: &Path,
    input: AutosaveSceneInput,
  ) -> Result<ManuscriptSceneDetail, String> {
    let current = self
      .get_scene(&input.id)?
      .ok_or_else(|| "scene not found".to_string())?;
    let payload = SceneAutosavePayload {
      id: input.id.clone(),
      title: input.title,
      body: input.body,
      summary: input.summary,
      mentions: input.mentions,
      updated_at: database::now_timestamp(),
    };

    write_pending_scene_autosave(database_path, &payload)?;

    let transaction = self.connection.transaction().map_err(|err| err.to_string())?;
    let next_slug = unique_node_slug(&transaction, slugify(&payload.title), Some(&payload.id))?;
    transaction
      .execute(
        "UPDATE manuscript_nodes
         SET title = ?1, slug = ?2, body = ?3, summary = ?4, updated_at = ?5
         WHERE id = ?6 AND kind = 'scene'",
        params![
          payload.title,
          next_slug,
          payload.body,
          payload.summary,
          payload.updated_at,
          payload.id
        ],
      )
      .map_err(|err| err.to_string())?;
    replace_mentions(&transaction, &payload.id, &payload.mentions)?;
    transaction
      .execute(
        "INSERT OR REPLACE INTO manuscript_autosave_log (node_id, last_saved_at, source) VALUES (?1, ?2, ?3)",
        params![payload.id, payload.updated_at, "autosave"],
      )
      .map_err(|err| err.to_string())?;
    let detail = get_scene_with_connection(&transaction, &current.node.id)?
      .ok_or_else(|| "scene autosave failed".to_string())?;
    transaction.commit().map_err(|err| err.to_string())?;

    finalize_scene_autosave(database_path, &payload, &detail)?;
    Ok(detail)
  }

  pub fn list_backlinks(&self, entity_id: &str) -> Result<Vec<EntityBacklink>, String> {
    let mut statement = self
      .connection
      .prepare(
        "SELECT s.id, s.title, c.id, c.title, m.entity_id, m.label
         FROM manuscript_mentions m
         JOIN manuscript_nodes s ON s.id = m.node_id
         LEFT JOIN manuscript_nodes c ON c.id = s.parent_id
         WHERE m.entity_id = ?1
         ORDER BY c.position ASC, s.position ASC",
      )
      .map_err(|err| err.to_string())?;

    let rows = statement
      .query_map(params![entity_id], |row| {
        Ok(EntityBacklink {
          node_id: row.get(0)?,
          scene_title: row.get(1)?,
          chapter_id: row.get(2)?,
          chapter_title: row.get(3)?,
          entity_id: row.get(4)?,
          label: row.get(5)?,
        })
      })
      .map_err(|err| err.to_string())?;

    let mut backlinks = Vec::new();
    for row in rows {
      backlinks.push(row.map_err(|err| err.to_string())?);
    }
    Ok(backlinks)
  }

  fn load_nodes_by_kind(&self, kind: ManuscriptNodeKind) -> Result<Vec<ManuscriptNode>, String> {
    let mut statement = self
      .connection
      .prepare(
        "SELECT id, parent_id, kind, slug, title, body, summary, position, created_at, updated_at
         FROM manuscript_nodes
         WHERE kind = ?1
         ORDER BY position ASC, created_at ASC",
      )
      .map_err(|err| err.to_string())?;

    let rows = statement
      .query_map(params![kind.as_str()], row_to_node)
      .map_err(|err| err.to_string())?;
    let mut nodes = Vec::new();
    for row in rows {
      nodes.push(row.map_err(|err| err.to_string())?);
    }
    Ok(nodes)
  }
}

pub fn seed_sample_manuscript(database_path: &Path) -> Result<(), String> {
  let mut repository = ManuscriptRepository::open(database_path)?;
  if !repository.list_tree()?.is_empty() {
    return Ok(());
  }

  let character_id = repository
    .connection
    .query_row(
      "SELECT id FROM entities WHERE type = 'character' ORDER BY created_at ASC LIMIT 1",
      [],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())?
    .ok_or_else(|| "seed character missing".to_string())?;
  let location_id = repository
    .connection
    .query_row(
      "SELECT id FROM entities WHERE type = 'location' ORDER BY created_at ASC LIMIT 1",
      [],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())?
    .ok_or_else(|| "seed location missing".to_string())?;

  let chapter = repository.create_chapter(CreateChapterInput {
    title: "Chapter 1".into(),
  })?;
  repository.create_scene(CreateSceneInput {
    chapter_id: chapter.id,
    title: "Arrival at Altin Ova".into(),
    body: Some("Alp Er Tunga enters Altin Ova before storm.".into()),
    summary: Some("Seed manuscript scene".into()),
    mentions: vec![
      MentionInput {
        entity_id: character_id,
        label: "Alp Er Tunga".into(),
        start_offset: 0,
        end_offset: 12,
      },
      MentionInput {
        entity_id: location_id,
        label: "Altin Ova".into(),
        start_offset: 20,
        end_offset: 29,
      },
    ],
  })?;

  Ok(())
}

pub fn recover_manuscript_autosave(database_path: &Path) -> Result<ManuscriptRecoveryReport, String> {
  let autosave_dir = manuscript_autosave_dir(database_path);
  fs::create_dir_all(&autosave_dir).map_err(|err| err.to_string())?;

  let repository = ManuscriptRepository::open(database_path)?;
  let mut recovered_count = 0;
  let mut conflicted_count = 0;
  let mut discarded_count = 0;

  for entry in fs::read_dir(&autosave_dir).map_err(|err| err.to_string())? {
    let entry = entry.map_err(|err| err.to_string())?;
    let path = entry.path();
    if path.extension().and_then(|value| value.to_str()) != Some("pending") {
      continue;
    }

    let payload = match read_pending_scene_payload(&path) {
      Some(payload) => payload,
      None => {
        preserve_unreadable_pending(database_path, &path)?;
        conflicted_count += 1;
        continue;
      }
    };

    let current = repository.get_scene(&payload.id)?;
    match current {
      Some(detail)
        if detail.node.title == payload.title
          && detail.node.body == payload.body
          && detail.node.summary == payload.summary
          && mention_inputs_equal(&detail.mentions, &payload.mentions) =>
      {
        write_last_scene_success(database_path, &payload, &detail)?;
        fs::remove_file(path).map_err(|err| err.to_string())?;
        recovered_count += 1;
      }
      _ => {
        move_pending_to_conflict(database_path, &path, &payload.id)?;
        conflicted_count += 1;
      }
    }
  }

  Ok(ManuscriptRecoveryReport {
    recovered_count,
    conflicted_count,
    discarded_count,
  })
}

#[derive(Debug, Serialize, Deserialize)]
struct SceneAutosavePayload {
  id: String,
  title: String,
  body: String,
  summary: String,
  mentions: Vec<MentionInput>,
  updated_at: String,
}

fn row_to_node(row: &rusqlite::Row<'_>) -> rusqlite::Result<ManuscriptNode> {
  Ok(ManuscriptNode {
    id: row.get(0)?,
    parent_id: row.get(1)?,
    kind: parse_node_kind(row.get::<_, String>(2)?.as_str())?,
    slug: row.get(3)?,
    title: row.get(4)?,
    body: row.get(5)?,
    summary: row.get(6)?,
    position: row.get(7)?,
    created_at: row.get(8)?,
    updated_at: row.get(9)?,
  })
}

fn parse_node_kind(value: &str) -> rusqlite::Result<ManuscriptNodeKind> {
  match value {
    "chapter" => Ok(ManuscriptNodeKind::Chapter),
    "scene" => Ok(ManuscriptNodeKind::Scene),
    _ => Err(rusqlite::Error::InvalidColumnType(
      2,
      "kind".into(),
      rusqlite::types::Type::Text,
    )),
  }
}

fn next_node_id(connection: &Connection, kind: ManuscriptNodeKind) -> Result<String, String> {
  let current = connection
    .query_row(
      "SELECT value FROM app_metadata WHERE key = ?1",
      params![kind.counter_key()],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())?;
  let next_value = current.and_then(|value| value.parse::<u32>().ok()).unwrap_or(0) + 1;

  connection
    .execute(
      "INSERT OR REPLACE INTO app_metadata (key, value) VALUES (?1, ?2)",
      params![kind.counter_key(), next_value.to_string()],
    )
    .map_err(|err| err.to_string())?;

  Ok(format!("{}_{next_value:03}", kind.id_prefix()))
}

fn next_position(connection: &Connection, parent_id: Option<String>) -> Result<i64, String> {
  let value = match parent_id {
    Some(parent_id) => connection.query_row(
      "SELECT COALESCE(MAX(position), 0) + 1 FROM manuscript_nodes WHERE parent_id = ?1",
      params![parent_id],
      |row| row.get::<_, i64>(0),
    ),
    None => connection.query_row(
      "SELECT COALESCE(MAX(position), 0) + 1 FROM manuscript_nodes WHERE parent_id IS NULL",
      [],
      |row| row.get::<_, i64>(0),
    ),
  }
  .map_err(|err| err.to_string())?;

  Ok(value)
}

fn unique_node_slug(connection: &Connection, base: String, current_id: Option<&str>) -> Result<String, String> {
  let normalized = if base.is_empty() { "scene".to_string() } else { base };
  let mut candidate = normalized.clone();
  let mut index = 2;

  loop {
    let existing = connection
      .query_row(
        "SELECT id FROM manuscript_nodes WHERE slug = ?1",
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

fn persist_node(connection: &Connection, node: &ManuscriptNode) -> Result<(), String> {
  connection
    .execute(
      "INSERT INTO manuscript_nodes (
        id, parent_id, kind, slug, title, body, summary, position, created_at, updated_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
      params![
        node.id,
        node.parent_id,
        node.kind.as_str(),
        node.slug,
        node.title,
        node.body,
        node.summary,
        node.position,
        node.created_at,
        node.updated_at
      ],
    )
    .map_err(|err| err.to_string())?;
  Ok(())
}

fn persist_scene_detail(
  connection: &Connection,
  node: &ManuscriptNode,
  mentions: &[MentionInput],
) -> Result<ManuscriptSceneDetail, String> {
  persist_node(connection, node)?;
  replace_mentions(connection, &node.id, mentions)?;
  Ok(ManuscriptSceneDetail {
    node: node.clone(),
    mentions: list_mentions(connection, &node.id)?,
  })
}

fn replace_mentions(connection: &Connection, node_id: &str, mentions: &[MentionInput]) -> Result<(), String> {
  connection
    .execute("DELETE FROM manuscript_mentions WHERE node_id = ?1", params![node_id])
    .map_err(|err| err.to_string())?;

  for mention in mentions {
    let mention_id = next_mention_id(connection)?;
    connection
      .execute(
        "INSERT INTO manuscript_mentions (
          id, node_id, entity_id, label, start_offset, end_offset, created_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![
          mention_id,
          node_id,
          mention.entity_id,
          mention.label,
          mention.start_offset,
          mention.end_offset,
          database::now_timestamp()
        ],
      )
      .map_err(|err| err.to_string())?;
  }

  Ok(())
}

fn next_mention_id(connection: &Connection) -> Result<String, String> {
  let current = connection
    .query_row(
      "SELECT value FROM app_metadata WHERE key = 'seq_manuscript_mention'",
      [],
      |row| row.get::<_, String>(0),
    )
    .optional()
    .map_err(|err| err.to_string())?;
  let next_value = current.and_then(|value| value.parse::<u32>().ok()).unwrap_or(0) + 1;
  connection
    .execute(
      "INSERT OR REPLACE INTO app_metadata (key, value) VALUES ('seq_manuscript_mention', ?1)",
      params![next_value.to_string()],
    )
    .map_err(|err| err.to_string())?;
  Ok(format!("msm_{next_value:03}"))
}

fn list_mentions(connection: &Connection, node_id: &str) -> Result<Vec<ManuscriptMention>, String> {
  let mut statement = connection
    .prepare(
      "SELECT id, node_id, entity_id, label, start_offset, end_offset
       FROM manuscript_mentions WHERE node_id = ?1 ORDER BY start_offset ASC, created_at ASC",
    )
    .map_err(|err| err.to_string())?;
  let rows = statement
    .query_map(params![node_id], |row| {
      Ok(ManuscriptMention {
        id: row.get(0)?,
        node_id: row.get(1)?,
        entity_id: row.get(2)?,
        label: row.get(3)?,
        start_offset: row.get(4)?,
        end_offset: row.get(5)?,
      })
    })
    .map_err(|err| err.to_string())?;
  let mut mentions = Vec::new();
  for row in rows {
    mentions.push(row.map_err(|err| err.to_string())?);
  }
  Ok(mentions)
}

fn get_node(connection: &Connection, id: &str) -> Result<Option<ManuscriptNode>, String> {
  let mut statement = connection
    .prepare(
      "SELECT id, parent_id, kind, slug, title, body, summary, position, created_at, updated_at
       FROM manuscript_nodes WHERE id = ?1",
    )
    .map_err(|err| err.to_string())?;
  statement
    .query_row(params![id], row_to_node)
    .optional()
    .map_err(|err| err.to_string())
}

fn get_scene_with_connection(connection: &Connection, id: &str) -> Result<Option<ManuscriptSceneDetail>, String> {
  match get_node(connection, id)? {
    Some(node) if node.kind == ManuscriptNodeKind::Scene => Ok(Some(ManuscriptSceneDetail {
      mentions: list_mentions(connection, id)?,
      node,
    })),
    Some(_) => Err("node is not scene".into()),
    None => Ok(None),
  }
}

fn manuscript_autosave_dir(database_path: &Path) -> PathBuf {
  database_path
    .parent()
    .unwrap_or_else(|| Path::new("."))
    .join("cache")
    .join("manuscript")
}

fn scene_pending_path(database_path: &Path, node_id: &str) -> PathBuf {
  manuscript_autosave_dir(database_path).join(format!("{node_id}.pending"))
}

fn scene_conflict_path(database_path: &Path, node_id: &str) -> PathBuf {
  manuscript_autosave_dir(database_path).join(format!("{node_id}.conflict.json"))
}

fn scene_success_path(database_path: &Path, node_id: &str) -> PathBuf {
  manuscript_autosave_dir(database_path).join(format!("{node_id}.last.json"))
}

fn write_pending_scene_autosave(database_path: &Path, payload: &SceneAutosavePayload) -> Result<(), String> {
  let autosave_dir = manuscript_autosave_dir(database_path);
  fs::create_dir_all(&autosave_dir).map_err(|err| err.to_string())?;
  let pending_path = scene_pending_path(database_path, &payload.id);
  let temp_path = pending_path.with_extension("tmp");
  let content = serde_json::to_string_pretty(payload).map_err(|err| err.to_string())?;

  fs::write(&temp_path, content).map_err(|err| err.to_string())?;
  fs::rename(temp_path, pending_path).map_err(|err| err.to_string())
}

fn finalize_scene_autosave(
  database_path: &Path,
  payload: &SceneAutosavePayload,
  detail: &ManuscriptSceneDetail,
) -> Result<(), String> {
  write_last_scene_success(database_path, payload, detail)?;
  let pending_path = scene_pending_path(database_path, &payload.id);
  if pending_path.exists() {
    fs::remove_file(pending_path).map_err(|err| err.to_string())?;
  }
  Ok(())
}

fn write_last_scene_success(
  database_path: &Path,
  payload: &SceneAutosavePayload,
  detail: &ManuscriptSceneDetail,
) -> Result<(), String> {
  let success_path = scene_success_path(database_path, &payload.id);
  let temp_path = success_path.with_extension("tmp");
  let snapshot = serde_json::json!({
    "id": detail.node.id,
    "title": detail.node.title,
    "summary": detail.node.summary,
    "body": detail.node.body,
    "mentions": detail.mentions,
    "updatedAt": detail.node.updated_at
  });
  let content = serde_json::to_string_pretty(&snapshot).map_err(|err| err.to_string())?;

  fs::write(&temp_path, content).map_err(|err| err.to_string())?;
  fs::rename(temp_path, success_path).map_err(|err| err.to_string())
}

fn read_pending_scene_payload(path: &Path) -> Option<SceneAutosavePayload> {
  let raw = fs::read_to_string(path).ok()?;
  serde_json::from_str(&raw).ok()
}

fn move_pending_to_conflict(database_path: &Path, pending_path: &Path, node_id: &str) -> Result<(), String> {
  let conflict_path = scene_conflict_path(database_path, node_id);
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
  let conflict_path = manuscript_autosave_dir(database_path).join(format!("{file_stem}.conflict.raw"));
  if conflict_path.exists() {
    fs::remove_file(&conflict_path).map_err(|err| err.to_string())?;
  }
  fs::rename(pending_path, conflict_path).map_err(|err| err.to_string())
}

fn mention_inputs_equal(mentions: &[ManuscriptMention], inputs: &[MentionInput]) -> bool {
  if mentions.len() != inputs.len() {
    return false;
  }

  mentions.iter().zip(inputs.iter()).all(|(left, right)| {
    left.entity_id == right.entity_id
      && left.label == right.label
      && left.start_offset == right.start_offset
      && left.end_offset == right.end_offset
  })
}

#[cfg(test)]
mod tests {
  use std::{
    path::Path,
    time::{SystemTime, UNIX_EPOCH},
  };

  use rusqlite::Connection;

  use super::*;

  fn repo() -> ManuscriptRepository {
    let connection = Connection::open_in_memory().unwrap();
    connection.execute_batch(include_str!("../../migrations/0001_init.sql")).unwrap();
    connection.execute_batch(include_str!("../../migrations/0002_entities.sql")).unwrap();
    connection.execute_batch(include_str!("../../migrations/0003_autosave.sql")).unwrap();
    connection.execute_batch(include_str!("../../migrations/0004_manuscript.sql")).unwrap();
    connection.execute(
      "INSERT INTO entities (id, type, slug, title, summary, body, extra_json, created_at, updated_at, is_ongoing)
       VALUES ('char_001', 'character', 'alp-er-tunga', 'Alp Er Tunga', '', '', '{}', '1', '1', 0)",
      [],
    ).unwrap();
    ManuscriptRepository { connection }
  }

  fn manuscript_test_db() -> PathBuf {
    let nonce = SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .unwrap()
      .as_nanos();
    let base = std::env::temp_dir().join(format!(
      "worldaltar-manuscript-{}-{}",
      std::process::id(),
      nonce
    ));
    std::fs::create_dir_all(base.join("cache").join("autosave").join("manuscript")).unwrap();
    base.join("worldaltar.db")
  }

  fn file_repo(database_path: &Path) -> ManuscriptRepository {
    database::migrate_database(database_path).unwrap();
    let repository = ManuscriptRepository::open(database_path).unwrap();
    repository.connection.execute(
      "INSERT INTO entities (id, type, slug, title, summary, body, extra_json, created_at, updated_at, is_ongoing)
       VALUES ('char_001', 'character', 'alp-er-tunga', 'Alp Er Tunga', '', '', '{}', '1', '1', 0)",
      [],
    ).unwrap();
    repository
  }

  #[test]
  fn mention_ids_stay_entity_bound_after_title_change() {
    let mut repository = repo();
    let chapter = repository.create_chapter(CreateChapterInput { title: "One".into() }).unwrap();
    let scene = repository.create_scene(CreateSceneInput {
      chapter_id: chapter.id.clone(),
      title: "Arrival".into(),
      body: Some("Alp Er Tunga enters.".into()),
      summary: Some("seed".into()),
      mentions: vec![MentionInput {
        entity_id: "char_001".into(),
        label: "Alp Er Tunga".into(),
        start_offset: 0,
        end_offset: 12,
      }],
    }).unwrap();

    repository.connection.execute(
      "UPDATE entities SET title = 'Alp Tunga' WHERE id = 'char_001'",
      [],
    ).unwrap();

    let backlinks = repository.list_backlinks("char_001").unwrap();
    assert_eq!(scene.mentions[0].entity_id, "char_001");
    assert_eq!(backlinks.len(), 1);
    assert_eq!(backlinks[0].node_id, scene.node.id);
  }

  #[test]
  fn scene_autosave_writes_success_snapshot() {
    let mut repository = repo();
    let chapter = repository.create_chapter(CreateChapterInput { title: "One".into() }).unwrap();
    let scene = repository.create_scene(CreateSceneInput {
      chapter_id: chapter.id,
      title: "Arrival".into(),
      body: Some("Before".into()),
      summary: Some("Before".into()),
      mentions: vec![],
    }).unwrap();
    let database_path = manuscript_test_db();

    let updated = repository.autosave_scene(
      &database_path,
      AutosaveSceneInput {
        id: scene.node.id.clone(),
        title: "Arrival Updated".into(),
        body: "After".into(),
        summary: "After".into(),
        mentions: vec![MentionInput {
          entity_id: "char_001".into(),
          label: "Alp".into(),
          start_offset: 0,
          end_offset: 3,
        }],
      },
    ).unwrap();

    assert_eq!(updated.node.id, scene.node.id);
    assert!(scene_success_path(&database_path, &scene.node.id).exists());
    assert!(!scene_pending_path(&database_path, &scene.node.id).exists());
  }

  #[test]
  fn manuscript_recovery_preserves_uncommitted_pending_payload_as_conflict() {
    let database_path = manuscript_test_db();
    let mut repository = file_repo(&database_path);
    let chapter = repository.create_chapter(CreateChapterInput { title: "One".into() }).unwrap();
    let scene = repository.create_scene(CreateSceneInput {
      chapter_id: chapter.id,
      title: "Arrival".into(),
      body: Some("Before".into()),
      summary: Some("Before".into()),
      mentions: vec![],
    }).unwrap();

    write_pending_scene_autosave(
      &database_path,
      &SceneAutosavePayload {
        id: scene.node.id.clone(),
        title: "Broken".into(),
        body: "Half".into(),
        summary: "Half".into(),
        mentions: vec![],
        updated_at: "9".into(),
      },
    )
    .unwrap();

    let report = recover_manuscript_autosave(&database_path).unwrap();
    assert_eq!(report.conflicted_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert!(!scene_pending_path(&database_path, &scene.node.id).exists());
    assert!(scene_conflict_path(&database_path, &scene.node.id).exists());
  }

  #[test]
  fn manuscript_recovery_marks_committed_pending_payload_as_recovered() {
    let database_path = manuscript_test_db();
    let mut repository = file_repo(&database_path);
    let chapter = repository.create_chapter(CreateChapterInput { title: "One".into() }).unwrap();
    let scene = repository.create_scene(CreateSceneInput {
      chapter_id: chapter.id,
      title: "Arrival".into(),
      body: Some("Before".into()),
      summary: Some("Before".into()),
      mentions: vec![],
    }).unwrap();

    write_pending_scene_autosave(
      &database_path,
      &SceneAutosavePayload {
        id: scene.node.id.clone(),
        title: scene.node.title.clone(),
        body: scene.node.body.clone(),
        summary: scene.node.summary.clone(),
        mentions: vec![],
        updated_at: scene.node.updated_at.clone(),
      },
    )
    .unwrap();

    let report = recover_manuscript_autosave(&database_path).unwrap();

    assert_eq!(report.recovered_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert!(!scene_pending_path(&database_path, &scene.node.id).exists());
    assert!(scene_success_path(&database_path, &scene.node.id).exists());
  }

  #[test]
  fn manuscript_recovery_preserves_bad_pending_payload_without_global_failure() {
    let database_path = manuscript_test_db();
    let bad_path = scene_pending_path(&database_path, "msc_sc_404");
    std::fs::create_dir_all(bad_path.parent().unwrap()).unwrap();
    std::fs::write(&bad_path, "{bad json").unwrap();

    let report = recover_manuscript_autosave(&database_path).unwrap();

    assert_eq!(report.recovered_count, 0);
    assert_eq!(report.conflicted_count, 1);
    assert_eq!(report.discarded_count, 0);
    assert!(!bad_path.exists());
    assert!(manuscript_autosave_dir(&database_path).join("msc_sc_404.conflict.raw").exists());
  }

  #[test]
  fn manuscript_recovery_is_idempotent_after_cleanup() {
    let database_path = manuscript_test_db();
    let mut repository = file_repo(&database_path);
    let chapter = repository.create_chapter(CreateChapterInput { title: "One".into() }).unwrap();
    let scene = repository.create_scene(CreateSceneInput {
      chapter_id: chapter.id,
      title: "Arrival".into(),
      body: Some("Before".into()),
      summary: Some("Before".into()),
      mentions: vec![],
    }).unwrap();

    write_pending_scene_autosave(
      &database_path,
      &SceneAutosavePayload {
        id: scene.node.id.clone(),
        title: "Broken".into(),
        body: "Half".into(),
        summary: "Half".into(),
        mentions: vec![],
        updated_at: "9".into(),
      },
    )
    .unwrap();

    let first = recover_manuscript_autosave(&database_path).unwrap();
    let second = recover_manuscript_autosave(&database_path).unwrap();

    assert_eq!(first.conflicted_count, 1);
    assert_eq!(second.recovered_count, 0);
    assert_eq!(second.conflicted_count, 0);
    assert_eq!(second.discarded_count, 0);
  }
}
