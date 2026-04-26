#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod core;

use core::{
  entity_model::{
    AutosaveEntityInput, CreateEntityInput, EntityRecord, RenameEntityInput,
    ImportEntityMediaInput, UpdateEntityLinksInput, UpdateEntityMediaInput,
  },
  export::{list_export_jobs, queue_export, ExportJob, ExportRequest},
  manuscript::{
    recover_manuscript_autosave, AutosaveSceneInput, CreateChapterInput, CreateSceneInput,
    EntityBacklink, ManuscriptRecoveryReport, ManuscriptRepository, ManuscriptSceneDetail,
    ManuscriptTreeItem,
  },
  projects::{create_demo_world, create_world, get_bootstrap_status, BootstrapStatus, CreateWorldRequest, WorldProject},
  repository::{recover_autosave, AutosaveRecoveryReport, EntityRepository, SearchResult},
};
use std::path::Path;

#[tauri::command]
fn bootstrap_status() -> Result<BootstrapStatus, String> {
  get_bootstrap_status()
}

#[tauri::command]
fn create_world_command(request: CreateWorldRequest) -> Result<WorldProject, String> {
  create_world(request)
}

#[tauri::command]
fn create_demo_world_command(request: CreateWorldRequest) -> Result<WorldProject, String> {
  create_demo_world(request)
}

#[tauri::command]
fn create_entity_command(database_path: String, input: CreateEntityInput) -> Result<EntityRecord, String> {
  let mut repository = EntityRepository::open(Path::new(&database_path))?;
  repository.create(input)
}

#[tauri::command]
fn list_entities_command(database_path: String, year: Option<i32>) -> Result<Vec<EntityRecord>, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.list(year)
}

#[tauri::command]
fn rename_entity_command(database_path: String, input: RenameEntityInput) -> Result<EntityRecord, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.rename(input)
}

#[tauri::command]
fn delete_entity_command(database_path: String, id: String) -> Result<(), String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.delete(&id)
}

#[tauri::command]
fn search_entities_command(
  database_path: String,
  query: String,
  year: Option<i32>,
  entity_type: Option<core::entity_model::EntityType>,
) -> Result<Vec<SearchResult>, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.search(&query, year, entity_type)
}

#[tauri::command]
fn autosave_entity_command(database_path: String, input: AutosaveEntityInput) -> Result<EntityRecord, String> {
  let mut repository = EntityRepository::open(Path::new(&database_path))?;
  repository.autosave(Path::new(&database_path), input)
}

#[tauri::command]
fn update_entity_media_command(database_path: String, input: UpdateEntityMediaInput) -> Result<EntityRecord, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.update_media(input)
}

#[tauri::command]
fn update_entity_links_command(database_path: String, input: UpdateEntityLinksInput) -> Result<EntityRecord, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.update_links(input)
}

#[tauri::command]
fn import_entity_media_command(database_path: String, input: ImportEntityMediaInput) -> Result<EntityRecord, String> {
  let repository = EntityRepository::open(Path::new(&database_path))?;
  repository.import_media(Path::new(&database_path), input)
}

#[tauri::command]
fn recover_autosave_command(database_path: String) -> Result<AutosaveRecoveryReport, String> {
  recover_autosave(Path::new(&database_path))
}

#[tauri::command]
fn list_manuscript_tree_command(database_path: String) -> Result<Vec<ManuscriptTreeItem>, String> {
  let repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.list_tree()
}

#[tauri::command]
fn get_manuscript_scene_command(database_path: String, id: String) -> Result<Option<ManuscriptSceneDetail>, String> {
  let repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.get_scene(&id)
}

#[tauri::command]
fn create_manuscript_chapter_command(database_path: String, input: CreateChapterInput) -> Result<core::manuscript::ManuscriptNode, String> {
  let repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.create_chapter(input)
}

#[tauri::command]
fn create_manuscript_scene_command(database_path: String, input: CreateSceneInput) -> Result<ManuscriptSceneDetail, String> {
  let repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.create_scene(input)
}

#[tauri::command]
fn autosave_manuscript_scene_command(
  database_path: String,
  input: AutosaveSceneInput,
) -> Result<ManuscriptSceneDetail, String> {
  let mut repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.autosave_scene(Path::new(&database_path), input)
}

#[tauri::command]
fn recover_manuscript_autosave_command(database_path: String) -> Result<ManuscriptRecoveryReport, String> {
  recover_manuscript_autosave(Path::new(&database_path))
}

#[tauri::command]
fn list_manuscript_backlinks_command(database_path: String, entity_id: String) -> Result<Vec<EntityBacklink>, String> {
  let repository = ManuscriptRepository::open(Path::new(&database_path))?;
  repository.list_backlinks(&entity_id)
}

#[tauri::command]
fn queue_export_command(database_path: String, request: ExportRequest) -> Result<ExportJob, String> {
  queue_export(Path::new(&database_path), request)
}

#[tauri::command]
fn list_export_jobs_command(database_path: String) -> Result<Vec<ExportJob>, String> {
  list_export_jobs(Path::new(&database_path))
}

fn main() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      bootstrap_status,
      create_world_command,
      create_demo_world_command,
      create_entity_command,
      list_entities_command,
      rename_entity_command,
      delete_entity_command,
      search_entities_command,
      autosave_entity_command,
      update_entity_media_command,
      update_entity_links_command,
      import_entity_media_command,
      recover_autosave_command,
      list_manuscript_tree_command,
      get_manuscript_scene_command,
      create_manuscript_chapter_command,
      create_manuscript_scene_command,
      autosave_manuscript_scene_command,
      recover_manuscript_autosave_command,
      list_manuscript_backlinks_command,
      queue_export_command,
      list_export_jobs_command
    ])
    .run(tauri::generate_context!())
    .expect("error while running WorldAltar desktop shell");
}
