import { invoke } from '@tauri-apps/api/core';
import type { EntityType } from '../entity-model/types';
import type { SearchHit } from './contracts';
import type { WorldYear } from '../time-engine/contracts';

export function searchEntities(
  databasePath: string,
  query: string,
  year: WorldYear | null,
  entityType: EntityType | null = null
) {
  return invoke<SearchHit[]>('search_entities_command', {
    databasePath,
    query,
    year,
    entityType
  });
}
