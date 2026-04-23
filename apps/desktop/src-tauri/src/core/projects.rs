use std::{
  fs,
  path::{Path, PathBuf},
  time::{SystemTime, UNIX_EPOCH},
};

use serde::{Deserialize, Serialize};

use super::{database, entity_model, manuscript, repository};

const APP_ROOT_NAME: &str = "WorldAltar";
const DB_FILE_NAME: &str = "worldaltar.db";
const PROJECT_FILE_NAME: &str = "project.json";
const WORLD_DIRS: [&str; 6] = ["assets", "maps", "backups", "exports", "cache", "logs"];

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BootstrapStatus {
  documents_root: String,
  app_root: String,
  worlds_root: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorldRequest {
  title: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WorldProject {
  pub id: String,
  pub title: String,
  pub slug: String,
  pub schema_version: u32,
  pub created_at: String,
  pub updated_at: String,
  pub world_path: String,
  pub database_path: String,
}

pub fn get_bootstrap_status() -> Result<BootstrapStatus, String> {
  let documents_root = get_documents_dir()?;
  let app_root = documents_root.join(APP_ROOT_NAME);
  let worlds_root = app_root.join("worlds");

  Ok(BootstrapStatus {
    documents_root: documents_root.display().to_string(),
    app_root: app_root.display().to_string(),
    worlds_root: worlds_root.display().to_string(),
  })
}

pub fn create_world(request: CreateWorldRequest) -> Result<WorldProject, String> {
  let title = request.title.trim();
  if title.is_empty() {
    return Err("world title required".into());
  }

  let documents_root = get_documents_dir()?;
  let app_root = documents_root.join(APP_ROOT_NAME);
  let worlds_root = app_root.join("worlds");

  fs::create_dir_all(&worlds_root).map_err(|err| err.to_string())?;

  let slug = next_world_slug(&worlds_root, title);
  let world_path = worlds_root.join(&slug);

  if world_path.exists() {
    return Err("world path already exists".into());
  }

  fs::create_dir_all(&world_path).map_err(|err| err.to_string())?;
  for dir in WORLD_DIRS {
    fs::create_dir_all(world_path.join(dir)).map_err(|err| err.to_string())?;
  }

  let database_path = world_path.join(DB_FILE_NAME);
  database::migrate_database(&database_path)?;

  let now = now_timestamp();
  let project = WorldProject {
    id: entity_model::build_world_id(&slug),
    title: title.to_string(),
    slug,
    schema_version: database::current_schema_version(),
    created_at: now.clone(),
    updated_at: now,
    world_path: world_path.display().to_string(),
    database_path: database_path.display().to_string(),
  };

  write_project_metadata(&world_path.join(PROJECT_FILE_NAME), &project)?;
  database::seed_project_metadata(&database_path, &project)?;
  repository::seed_sample_entities(&database_path)?;
  manuscript::seed_sample_manuscript(&database_path)?;

  Ok(project)
}

fn get_documents_dir() -> Result<PathBuf, String> {
  dirs::document_dir().ok_or_else(|| "documents directory not found".into())
}

fn next_world_slug(worlds_root: &Path, title: &str) -> String {
  let mut base = entity_model::slugify(title);
  if base == "entity" {
    base = "world".into();
  }
  if !worlds_root.join(&base).exists() {
    return base;
  }

  let mut index = 2;
  loop {
    let candidate = format!("{base}-{index}");
    if !worlds_root.join(&candidate).exists() {
      return candidate;
    }
    index += 1;
  }
}

fn write_project_metadata(project_path: &Path, project: &WorldProject) -> Result<(), String> {
  let json = serde_json::to_string_pretty(project).map_err(|err| err.to_string())?;
  let temp_path = project_path.with_extension("json.tmp");

  fs::write(&temp_path, json).map_err(|err| err.to_string())?;
  fs::rename(temp_path, project_path).map_err(|err| err.to_string())
}

fn now_timestamp() -> String {
  let seconds = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .map(|value| value.as_secs())
    .unwrap_or_default();
  seconds.to_string()
}

#[cfg(test)]
mod tests {
  use crate::core::entity_model::slugify;

  #[test]
  fn slugify_basic_title() {
    assert_eq!(slugify("Age of Bronze"), "age-of-bronze");
  }

  #[test]
  fn slugify_fallback_entity() {
    assert_eq!(slugify("!!!"), "entity");
  }
}
