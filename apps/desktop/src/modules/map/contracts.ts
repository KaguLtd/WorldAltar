import type { EntityType } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

export type OfflineBasemapMode = 'bundled_raster';

export type OfflineMapPackage = {
  id: string;
  mode: OfflineBasemapMode;
  styleUrl: string;
  manifestUrl: string;
  minZoom: number;
  maxZoom: number;
  coverage: 'world-low-zoom';
};

export type MapMarker = {
  id: string;
  type: EntityType;
  title: string;
  latitude: number;
  longitude: number;
};

export type MapFilters = {
  year: WorldYear | null;
  selectedEntityId: string | null;
};

export type MapLens = {
  markers(filters: MapFilters): Promise<MapMarker[]>;
  focusEntity(id: string): Promise<void>;
};

export const OFFLINE_MAP_PACKAGE: OfflineMapPackage = {
  id: 'offline-raster-v1',
  mode: 'bundled_raster',
  styleUrl: '/offline-map/style.json',
  manifestUrl: '/offline-map/manifest.json',
  minZoom: 0,
  maxZoom: 1,
  coverage: 'world-low-zoom'
};

export async function loadOfflineMapPackage(
  manifestUrl = OFFLINE_MAP_PACKAGE.manifestUrl
) {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Offline map manifest failed: ${response.status}`);
  }

  const payload = (await response.json()) as Partial<OfflineMapPackage>;
  if (
    payload.id &&
    payload.mode === 'bundled_raster' &&
    payload.styleUrl &&
    payload.manifestUrl &&
    typeof payload.minZoom === 'number' &&
    typeof payload.maxZoom === 'number' &&
    payload.coverage === 'world-low-zoom'
  ) {
    return payload as OfflineMapPackage;
  }

  throw new Error('Offline map manifest invalid');
}
