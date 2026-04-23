import type { EntityRecord, EntityType } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

export type SearchFilters = {
  query: string;
  types?: EntityType[];
  year: WorldYear | null;
};

export type SearchHit = {
  id: string;
  type: EntityType;
  title: string;
  summary: string;
};

export type SearchLens = {
  search(filters: SearchFilters): Promise<SearchHit[]>;
  openEntity(id: string): Promise<EntityRecord | null>;
};
