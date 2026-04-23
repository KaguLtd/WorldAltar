import type { EntityRecord, EntityType } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

export type WikiListFilters = {
  year: WorldYear | null;
  type: EntityType | null;
  query: string;
};

export type WikiListItem = {
  id: string;
  type: EntityType;
  title: string;
  summary: string;
};

export type WikiLens = {
  list(filters: WikiListFilters): Promise<WikiListItem[]>;
  detail(id: string): Promise<EntityRecord | null>;
};
