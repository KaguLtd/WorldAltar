export type WorldId = string;
export type EntityId = string;

export type EntityType = 'character' | 'location' | 'region' | 'event';

export type EntityCommon = {
  id: EntityId;
  type: EntityType;
  slug: string;
  title: string;
  summary: string;
  body: string;
  startYear: number | null;
  endYear: number | null;
  isOngoing: boolean;
  latitude: number | null;
  longitude: number | null;
  geometryRef: string | null;
  coverImagePath: string | null;
  thumbnailPath: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CharacterEntity = {
  type: 'character';
  common: EntityCommon;
  fields: {
    culture: string | null;
    birthYearLabel: string | null;
  };
};

export type LocationEntity = {
  type: 'location';
  common: EntityCommon;
  fields: {
    regionId: EntityId | null;
    locationKind: string | null;
  };
};

export type RegionEntity = {
  type: 'region';
  common: EntityCommon;
  fields: {
    parentRegionId: EntityId | null;
  };
};

export type EventEntity = {
  type: 'event';
  common: EntityCommon;
  fields: {
    locationId: EntityId | null;
  };
};

export type EntityRecord = CharacterEntity | LocationEntity | RegionEntity | EventEntity;
