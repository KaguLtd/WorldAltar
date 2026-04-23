import { invoke } from '@tauri-apps/api/core';
import type { EntityRecord } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

export function listEntities(databasePath: string, year: WorldYear | null) {
  return invoke<EntityRecord[]>('list_entities_command', {
    databasePath,
    year
  });
}
