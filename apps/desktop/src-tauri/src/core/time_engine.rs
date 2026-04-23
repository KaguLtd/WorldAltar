use super::entity_model::EntityCommon;

pub fn is_visible_at_year(record: &EntityCommon, year: i32) -> bool {
  let starts_before_or_at = match record.start_year {
    None => true,
    Some(start) => start <= year,
  };
  let ends_after_or_at = if record.is_ongoing {
    true
  } else {
    match record.end_year {
      None => true,
      Some(end) => end >= year,
    }
  };

  starts_before_or_at && ends_after_or_at
}

#[cfg(test)]
mod tests {
  use super::is_visible_at_year;
  use crate::core::entity_model::{EntityCommon, EntityType};

  fn make_common(start_year: Option<i32>, end_year: Option<i32>, is_ongoing: bool) -> EntityCommon {
    EntityCommon {
      id: "evt_001".into(),
      entity_type: EntityType::Event,
      slug: "battle-of-x".into(),
      title: "Battle of X".into(),
      summary: String::new(),
      body: String::new(),
      start_year,
      end_year,
      is_ongoing,
      latitude: None,
      longitude: None,
      geometry_ref: None,
      cover_image_path: None,
      thumbnail_path: None,
      created_at: "0".into(),
      updated_at: "0".into(),
    }
  }

  #[test]
  fn inclusive_single_year_event() {
    let record = make_common(Some(1204), Some(1204), false);

    assert!(!is_visible_at_year(&record, 1203));
    assert!(is_visible_at_year(&record, 1204));
    assert!(!is_visible_at_year(&record, 1205));
  }

  #[test]
  fn ongoing_ignores_end_cap() {
    let record = make_common(Some(1450), Some(1451), true);

    assert!(!is_visible_at_year(&record, 1449));
    assert!(is_visible_at_year(&record, 1451));
    assert!(is_visible_at_year(&record, 1600));
  }

  #[test]
  fn open_ranges_supported() {
    assert!(is_visible_at_year(&make_common(None, Some(100), false), 50));
    assert!(!is_visible_at_year(&make_common(None, Some(100), false), 101));
    assert!(!is_visible_at_year(&make_common(Some(100), None, false), 99));
    assert!(is_visible_at_year(&make_common(Some(100), None, false), 101));
    assert!(is_visible_at_year(&make_common(None, None, false), 0));
  }
}
