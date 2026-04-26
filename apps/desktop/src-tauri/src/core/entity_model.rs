use serde::{Deserialize, Serialize};

pub fn build_world_id(slug: &str) -> String {
  format!("world_{slug}")
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum EntityType {
  Character,
  Location,
  Region,
  Event,
}

impl EntityType {
  pub fn as_str(&self) -> &'static str {
    match self {
      Self::Character => "character",
      Self::Location => "location",
      Self::Region => "region",
      Self::Event => "event",
    }
  }

  pub fn id_prefix(&self) -> &'static str {
    match self {
      Self::Character => "char",
      Self::Location => "loc",
      Self::Region => "reg",
      Self::Event => "evt",
    }
  }

  pub fn counter_key(&self) -> &'static str {
    match self {
      Self::Character => "seq_character",
      Self::Location => "seq_location",
      Self::Region => "seq_region",
      Self::Event => "seq_event",
    }
  }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EntityCommon {
  pub id: String,
  #[serde(rename = "type")]
  pub entity_type: EntityType,
  pub slug: String,
  pub title: String,
  pub summary: String,
  pub body: String,
  pub start_year: Option<i32>,
  pub end_year: Option<i32>,
  pub is_ongoing: bool,
  pub latitude: Option<f64>,
  pub longitude: Option<f64>,
  pub geometry_ref: Option<String>,
  pub cover_image_path: Option<String>,
  pub thumbnail_path: Option<String>,
  pub created_at: String,
  pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CharacterFields {
  pub culture: Option<String>,
  pub birth_year_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct LocationFields {
  pub region_id: Option<String>,
  pub location_kind: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct RegionFields {
  pub parent_region_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct EventFields {
  pub location_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum EntityRecord {
  Character {
    common: EntityCommon,
    fields: CharacterFields,
  },
  Location {
    common: EntityCommon,
    fields: LocationFields,
  },
  Region {
    common: EntityCommon,
    fields: RegionFields,
  },
  Event {
    common: EntityCommon,
    fields: EventFields,
  },
}

impl EntityRecord {
  pub fn common(&self) -> &EntityCommon {
    match self {
      Self::Character { common, .. }
      | Self::Location { common, .. }
      | Self::Region { common, .. }
      | Self::Event { common, .. } => common,
    }
  }

  pub fn entity_type(&self) -> EntityType {
    self.common().entity_type
  }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CreateEntityCommon {
  pub slug: Option<String>,
  pub title: String,
  pub summary: Option<String>,
  pub body: Option<String>,
  pub start_year: Option<i32>,
  pub end_year: Option<i32>,
  pub is_ongoing: Option<bool>,
  pub latitude: Option<f64>,
  pub longitude: Option<f64>,
  pub geometry_ref: Option<String>,
  pub cover_image_path: Option<String>,
  pub thumbnail_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum CreateEntityInput {
  Character {
    common: CreateEntityCommon,
    fields: CharacterFields,
  },
  Location {
    common: CreateEntityCommon,
    fields: LocationFields,
  },
  Region {
    common: CreateEntityCommon,
    fields: RegionFields,
  },
  Event {
    common: CreateEntityCommon,
    fields: EventFields,
  },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RenameEntityInput {
  pub id: String,
  pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutosaveEntityInput {
  pub id: String,
  pub title: String,
  pub summary: String,
  pub body: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEntityMediaInput {
  pub id: String,
  pub cover_image_path: Option<String>,
  pub thumbnail_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateEntityLinksInput {
  pub id: String,
  pub region_id: Option<String>,
  pub parent_region_id: Option<String>,
  pub location_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportEntityMediaInput {
  pub id: String,
  pub source_path: String,
  pub variant: String,
}

pub fn slugify(input: &str) -> String {
  let mut slug = String::new();
  let mut last_dash = false;

  for ch in input.chars().flat_map(|ch| ch.to_lowercase()) {
    if ch.is_ascii_alphanumeric() {
      slug.push(ch);
      last_dash = false;
      continue;
    }

    if !last_dash && !slug.is_empty() {
      slug.push('-');
      last_dash = true;
    }
  }

  let trimmed = slug.trim_matches('-');
  if trimmed.is_empty() {
    "entity".to_string()
  } else {
    trimmed.to_string()
  }
}

#[cfg(test)]
mod tests {
  use super::{slugify, EntityType};

  #[test]
  fn slugify_basic_title() {
    assert_eq!(slugify("Age of Bronze"), "age-of-bronze");
  }

  #[test]
  fn slugify_fallback_entity() {
    assert_eq!(slugify("!!!"), "entity");
  }

  #[test]
  fn stable_prefixes() {
    assert_eq!(EntityType::Character.id_prefix(), "char");
    assert_eq!(EntityType::Location.id_prefix(), "loc");
    assert_eq!(EntityType::Region.id_prefix(), "reg");
    assert_eq!(EntityType::Event.id_prefix(), "evt");
  }
}
