import type { EntityType } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

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
