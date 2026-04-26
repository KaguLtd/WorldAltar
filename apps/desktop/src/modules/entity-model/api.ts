import { invoke } from '@tauri-apps/api/core';
import type { EntityRecord } from './types';
import type { CharacterEntity, EventEntity, LocationEntity, RegionEntity } from './types';

export type AutosaveRecoveryReport = {
  recoveredCount: number;
  conflictedCount: number;
  discardedCount: number;
};

export function autosaveEntity(
  databasePath: string,
  input: { id: string; title: string; summary: string; body: string }
) {
  return invoke<EntityRecord>('autosave_entity_command', {
    databasePath,
    input
  });
}

export function recoverAutosave(databasePath: string) {
  return invoke<AutosaveRecoveryReport>('recover_autosave_command', {
    databasePath
  });
}

export function updateEntityMedia(
  databasePath: string,
  input: { id: string; coverImagePath: string | null; thumbnailPath: string | null }
) {
  return invoke<EntityRecord>('update_entity_media_command', {
    databasePath,
    input
  });
}

export function updateEntityLinks(
  databasePath: string,
  input: {
    id: string;
    regionId: string | null;
    parentRegionId: string | null;
    locationId: string | null;
  }
) {
  return invoke<EntityRecord>('update_entity_links_command', {
    databasePath,
    input
  });
}

export function importEntityMedia(
  databasePath: string,
  input: {
    id: string;
    sourcePath: string;
    variant: 'cover' | 'thumbnail';
  }
) {
  return invoke<EntityRecord>('import_entity_media_command', {
    databasePath,
    input
  });
}

export type CreateEntityInput =
  | {
      type: 'character';
      common: {
        title: string;
        summary?: string;
        body?: string;
        startYear?: number | null;
        endYear?: number | null;
      };
      fields: CharacterEntity['fields'];
    }
  | {
      type: 'location';
      common: {
        title: string;
        summary?: string;
        body?: string;
        startYear?: number | null;
        endYear?: number | null;
        latitude?: number | null;
        longitude?: number | null;
      };
      fields: LocationEntity['fields'];
    }
  | {
      type: 'region';
      common: {
        title: string;
        summary?: string;
        body?: string;
        startYear?: number | null;
        endYear?: number | null;
      };
      fields: RegionEntity['fields'];
    }
  | {
      type: 'event';
      common: {
        title: string;
        summary?: string;
        body?: string;
        startYear?: number | null;
        endYear?: number | null;
      };
      fields: EventEntity['fields'];
    };

export function createEntity(databasePath: string, input: CreateEntityInput) {
  return invoke<EntityRecord>('create_entity_command', {
    databasePath,
    input
  });
}
