import { convertFileSrc } from '@tauri-apps/api/core';
import type { EntityRecord, EntityType } from '../entity-model/types';

export type AssetKind = 'logo' | 'motif' | 'placeholder';

export type AssetRef = {
  kind: AssetKind;
  path: string;
};

export type EntityVisual = {
  coverPath: string;
  coverMode: 'entity' | 'fallback';
  logo: AssetRef;
  motif: AssetRef;
};

const PLACEHOLDERS: Record<EntityType, string> = {
  character: '/assets/placeholders/character.svg',
  location: '/assets/placeholders/location.svg',
  region: '/assets/placeholders/region.svg',
  event: '/assets/placeholders/event.svg'
};

export function resolveEntityVisual(record: EntityRecord): EntityVisual {
  const coverPath = record.common.coverImagePath
    ? resolveCoverPath(record.common.coverImagePath)
    : PLACEHOLDERS[record.type];

  return {
    coverPath,
    coverMode: record.common.coverImagePath ? 'entity' : 'fallback',
    logo: { kind: 'logo', path: '/assets/logo_worldaltar.svg' },
    motif: { kind: 'motif', path: '/assets/motif_turkic_border.svg' }
  };
}

function resolveCoverPath(path: string) {
  if (path.startsWith('/')) {
    return path;
  }

  const tauriWindow = window as Window & {
    __TAURI_INTERNALS__?: {
      convertFileSrc?: (value: string, protocol?: string) => string;
    };
  };

  if (
    typeof window !== 'undefined' &&
    typeof tauriWindow.__TAURI_INTERNALS__?.convertFileSrc === 'function'
  ) {
    return convertFileSrc(path);
  }

  return path;
}
