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
  const coverPath = record.common.coverImagePath ?? PLACEHOLDERS[record.type];

  return {
    coverPath,
    coverMode: record.common.coverImagePath ? 'entity' : 'fallback',
    logo: { kind: 'logo', path: '/assets/logo_worldaltar.svg' },
    motif: { kind: 'motif', path: '/assets/motif_turkic_border.svg' }
  };
}
