use std::{
  fs,
  path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

use super::{
  database,
  entity_model::EntityRecord,
  manuscript::{ManuscriptRepository, ManuscriptTreeItem},
  repository::EntityRepository,
};

const JOBS_FILE_NAME: &str = "export_jobs.json";
const ASSET_MANIFEST_FILE_NAME: &str = "asset-manifest.json";
const PDF_PAGE_LINE_LIMIT: usize = 34;
const PDF_LINE_WIDTH: usize = 82;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExportKind {
  PdfDossier,
  ManuscriptPdf,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRequest {
  pub kind: ExportKind,
  pub target_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportJob {
  pub id: String,
  pub kind: ExportKind,
  pub status: String,
  pub target_path: String,
  pub artifact_paths: Vec<String>,
  pub created_at: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetManifest {
  generated_at: String,
  entities: Vec<AssetManifestEntity>,
  scenes: Vec<AssetManifestScene>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetManifestEntity {
  id: String,
  #[serde(rename = "type")]
  entity_type: String,
  slug: String,
  cover_image_path: Option<String>,
  thumbnail_path: Option<String>,
  geometry_ref: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct AssetManifestScene {
  id: String,
  chapter_id: Option<String>,
  mention_entity_ids: Vec<String>,
}

struct PdfPage {
  heading: String,
  lines: Vec<String>,
}

pub fn queue_export(database_path: &Path, request: ExportRequest) -> Result<ExportJob, String> {
  let exports_dir = export_root(database_path)?;
  fs::create_dir_all(&exports_dir).map_err(|err| err.to_string())?;

  let entity_repository = EntityRepository::open(database_path)?;
  let manuscript_repository = ManuscriptRepository::open(database_path)?;
  let records = entity_repository.list(None)?;
  let tree = manuscript_repository.list_tree()?;
  let now = database::now_timestamp();
  let target_path = resolve_target_path(&exports_dir, &request, &now);
  let asset_manifest_path = exports_dir.join(ASSET_MANIFEST_FILE_NAME);
  let asset_manifest = build_asset_manifest(&records, &tree, &manuscript_repository, &now)?;

  fs::write(
    &asset_manifest_path,
    serde_json::to_string_pretty(&asset_manifest).map_err(|err| err.to_string())?,
  )
  .map_err(|err| err.to_string())?;

  let pdf_bytes = match request.kind {
    ExportKind::ManuscriptPdf => {
      let pages = build_manuscript_pages(&tree, &manuscript_repository)?;
      render_pdf_document(&pages)
    }
    ExportKind::PdfDossier => {
      let pages = build_dossier_pages(&records);
      render_pdf_document(&pages)
    }
  };

  fs::write(&target_path, pdf_bytes).map_err(|err| err.to_string())?;

  let job = ExportJob {
    id: format!("exp_{now}"),
    kind: request.kind,
    status: "done".into(),
    target_path: target_path.display().to_string(),
    artifact_paths: vec![asset_manifest_path.display().to_string()],
    created_at: now,
  };

  let mut jobs = load_jobs(&exports_dir)?;
  jobs.insert(0, job.clone());
  save_jobs(&exports_dir, &jobs)?;

  Ok(job)
}

pub fn list_export_jobs(database_path: &Path) -> Result<Vec<ExportJob>, String> {
  load_jobs(&export_root(database_path)?)
}

fn export_root(database_path: &Path) -> Result<PathBuf, String> {
  database_path
    .parent()
    .map(|path| path.join("exports"))
    .ok_or_else(|| "world root not found".into())
}

fn resolve_target_path(exports_dir: &Path, request: &ExportRequest, timestamp: &str) -> PathBuf {
  match request.target_path.as_deref() {
    Some(path) if !path.trim().is_empty() => {
      let candidate = PathBuf::from(path);
      if candidate.is_absolute() {
        candidate
      } else {
        exports_dir.join(candidate)
      }
    }
    _ => exports_dir.join(match request.kind {
      ExportKind::ManuscriptPdf => format!("manuscript-{timestamp}.pdf"),
      ExportKind::PdfDossier => format!("dossier-{timestamp}.pdf"),
    }),
  }
}

fn load_jobs(exports_dir: &Path) -> Result<Vec<ExportJob>, String> {
  let jobs_path = exports_dir.join(JOBS_FILE_NAME);
  if !jobs_path.exists() {
    return Ok(Vec::new());
  }

  let raw = fs::read_to_string(jobs_path).map_err(|err| err.to_string())?;
  serde_json::from_str(&raw).map_err(|err| err.to_string())
}

fn save_jobs(exports_dir: &Path, jobs: &[ExportJob]) -> Result<(), String> {
  let jobs_path = exports_dir.join(JOBS_FILE_NAME);
  let json = serde_json::to_string_pretty(jobs).map_err(|err| err.to_string())?;
  fs::write(jobs_path, json).map_err(|err| err.to_string())
}

fn build_asset_manifest(
  records: &[EntityRecord],
  tree: &[ManuscriptTreeItem],
  repository: &ManuscriptRepository,
  generated_at: &str,
) -> Result<AssetManifest, String> {
  let entities = records
    .iter()
    .map(|record| AssetManifestEntity {
      id: record.common().id.clone(),
      entity_type: record.entity_type().as_str().to_string(),
      slug: record.common().slug.clone(),
      cover_image_path: record.common().cover_image_path.clone(),
      thumbnail_path: record.common().thumbnail_path.clone(),
      geometry_ref: record.common().geometry_ref.clone(),
    })
    .collect();

  let mut scenes = Vec::new();
  for chapter in tree {
    for scene in &chapter.children {
      let detail = repository
        .get_scene(&scene.id)?
        .ok_or_else(|| "scene missing during export".to_string())?;
      scenes.push(AssetManifestScene {
        id: scene.id.clone(),
        chapter_id: scene.parent_id.clone(),
        mention_entity_ids: detail.mentions.into_iter().map(|mention| mention.entity_id).collect(),
      });
    }
  }

  Ok(AssetManifest {
    generated_at: generated_at.to_string(),
    entities,
    scenes,
  })
}

fn build_manuscript_pages(tree: &[ManuscriptTreeItem], repository: &ManuscriptRepository) -> Result<Vec<PdfPage>, String> {
  let mut lines = Vec::new();
  lines.push("WorldAltar Manuscript Export".into());

  for chapter in tree {
    lines.push(format!("CHAPTER | {}", chapter.node.title));
    lines.push(format!("NODE | {}", chapter.node.id));

    for scene in &chapter.children {
      let detail = repository
        .get_scene(&scene.id)?
        .ok_or_else(|| "scene missing during manuscript export".to_string())?;
      lines.push(String::new());
      lines.push(format!("SCENE | {} | {}", detail.node.id, detail.node.title));
      if !detail.node.summary.trim().is_empty() {
        lines.push(format!("SUMMARY | {}", detail.node.summary.trim()));
      }
      if !detail.mentions.is_empty() {
        let mentions = detail
          .mentions
          .iter()
          .map(|mention| format!("{} [{}]", mention.label, mention.entity_id))
          .collect::<Vec<_>>()
          .join(", ");
        lines.push(format!("MENTIONS | {mentions}"));
      }
      lines.extend(split_block(&detail.node.body));
    }

    lines.push(String::new());
  }

  Ok(paginate_lines("WorldAltar Manuscript", &lines))
}

fn build_dossier_pages(records: &[EntityRecord]) -> Vec<PdfPage> {
  let mut lines = vec!["WorldAltar Dossier Export".into()];

  for record in records {
    let common = record.common();
    lines.push(String::new());
    lines.push(format!(
      "{} | {} | {}",
      record.entity_type().as_str().to_uppercase(),
      common.id,
      common.title
    ));
    lines.push(format!(
      "YEARS | {} - {}",
      common.start_year.map(|value| value.to_string()).unwrap_or_else(|| "open".into()),
      common.end_year.map(|value| value.to_string()).unwrap_or_else(|| "open".into())
    ));
    if !common.summary.trim().is_empty() {
      lines.push(format!("SUMMARY | {}", common.summary.trim()));
    }
    if !common.body.trim().is_empty() {
      lines.extend(split_block(&common.body));
    }
    if let (Some(latitude), Some(longitude)) = (common.latitude, common.longitude) {
      lines.push(format!("COORDS | {:.4}, {:.4}", latitude, longitude));
    }
  }

  paginate_lines("WorldAltar Dossier", &lines)
}

fn split_block(text: &str) -> Vec<String> {
  let mut lines = Vec::new();

  for paragraph in text.lines() {
    let trimmed = paragraph.trim();
    if trimmed.is_empty() {
      lines.push(String::new());
      continue;
    }
    lines.extend(wrap_text(trimmed, PDF_LINE_WIDTH));
  }

  if lines.is_empty() {
    lines.push("No body".into());
  }

  lines
}

fn paginate_lines(heading: &str, lines: &[String]) -> Vec<PdfPage> {
  let mut pages = Vec::new();
  let mut chunk = Vec::new();

  for line in lines {
    if chunk.len() == PDF_PAGE_LINE_LIMIT {
      pages.push(PdfPage {
        heading: heading.to_string(),
        lines: chunk,
      });
      chunk = Vec::new();
    }
    chunk.push(line.clone());
  }

  if !chunk.is_empty() || pages.is_empty() {
    pages.push(PdfPage {
      heading: heading.to_string(),
      lines: chunk,
    });
  }

  pages
}

fn wrap_text(text: &str, width: usize) -> Vec<String> {
  let mut lines = Vec::new();
  let mut current = String::new();

  for word in text.split_whitespace() {
    let next_len = if current.is_empty() {
      word.len()
    } else {
      current.len() + 1 + word.len()
    };

    if next_len > width && !current.is_empty() {
      lines.push(current);
      current = word.to_string();
    } else {
      if !current.is_empty() {
        current.push(' ');
      }
      current.push_str(word);
    }
  }

  if !current.is_empty() {
    lines.push(current);
  }

  if lines.is_empty() {
    lines.push(String::new());
  }

  lines
}

fn render_pdf_document(pages: &[PdfPage]) -> Vec<u8> {
  let mut objects: Vec<Vec<u8>> = Vec::new();
  let page_count = pages.len();
  let mut page_refs = Vec::new();

  objects.push(b"<< /Type /Catalog /Pages 2 0 R >>".to_vec());
  objects.push(Vec::new());
  objects.push(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>".to_vec());

  for (index, page) in pages.iter().enumerate() {
    let content_object_id = 4 + (index * 2);
    let page_object_id = content_object_id + 1;
    page_refs.push(format!("{page_object_id} 0 R"));

    let content = build_pdf_content(page);
    let mut content_object = format!("<< /Length {} >>\nstream\n", content.len()).into_bytes();
    content_object.extend(content);
    content_object.extend(b"\nendstream");
    objects.push(content_object);

    objects.push(
      format!(
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents {content_object_id} 0 R >>"
      )
      .into_bytes(),
    );
  }

  objects[1] = format!("<< /Type /Pages /Count {page_count} /Kids [{}] >>", page_refs.join(" ")).into_bytes();

  let mut out = Vec::new();
  let mut offsets = Vec::new();
  out.extend(b"%PDF-1.4\n%\xC7\xEC\x8F\xA2\n");

  for (index, object) in objects.iter().enumerate() {
    offsets.push(out.len());
    out.extend(format!("{} 0 obj\n", index + 1).as_bytes());
    out.extend(object);
    out.extend(b"\nendobj\n");
  }

  let xref_start = out.len();
  out.extend(format!("xref\n0 {}\n0000000000 65535 f \n", objects.len() + 1).as_bytes());
  for offset in offsets {
    out.extend(format!("{offset:010} 00000 n \n").as_bytes());
  }
  out.extend(
    format!(
      "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF\n",
      objects.len() + 1,
      xref_start
    )
    .as_bytes(),
  );

  out
}

fn build_pdf_content(page: &PdfPage) -> Vec<u8> {
  let mut lines = Vec::new();
  lines.push(page.heading.clone());
  lines.extend(page.lines.iter().cloned());

  let mut content = String::from("BT\n/F1 12 Tf\n54 786 Td\n14 TL\n");
  for (index, line) in lines.iter().enumerate() {
    let escaped = escape_pdf_text(line);
    if index > 0 {
      content.push_str("T*\n");
    }
    content.push_str(&format!("({escaped}) Tj\n"));
  }
  content.push_str("ET");
  content.into_bytes()
}

fn escape_pdf_text(value: &str) -> String {
  value
    .chars()
    .map(|ch| match ch {
      '\\' => "\\\\".into(),
      '(' => "\\(".into(),
      ')' => "\\)".into(),
      '\n' | '\r' => " ".into(),
      ch if ch.is_ascii() => ch.to_string(),
      _ => "?".into(),
    })
    .collect()
}

#[cfg(test)]
mod tests {
  use super::{build_dossier_pages, render_pdf_document, wrap_text, PdfPage};
  use crate::core::entity_model::{CharacterFields, EntityCommon, EntityRecord, EntityType};

  #[test]
  fn wrap_text_splits_long_line() {
    let lines = wrap_text("one two three four five six seven eight", 12);
    assert!(lines.len() > 1);
  }

  #[test]
  fn pdf_has_header() {
    let pdf = render_pdf_document(&[PdfPage {
      heading: "Export".into(),
      lines: vec!["Line".into()],
    }]);
    assert!(String::from_utf8_lossy(&pdf).starts_with("%PDF-1.4"));
  }

  #[test]
  fn dossier_pages_emit_entity_id() {
    let pages = build_dossier_pages(&[EntityRecord::Character {
      common: EntityCommon {
        id: "char_001".into(),
        entity_type: EntityType::Character,
        slug: "alp".into(),
        title: "Alp".into(),
        summary: "Hero".into(),
        body: "Body".into(),
        start_year: Some(1200),
        end_year: None,
        is_ongoing: false,
        latitude: None,
        longitude: None,
        geometry_ref: None,
        cover_image_path: None,
        thumbnail_path: None,
        created_at: "1".into(),
        updated_at: "1".into(),
      },
      fields: CharacterFields::default(),
    }]);
    assert!(pages[0].lines.iter().any(|line| line.contains("char_001")));
  }
}
