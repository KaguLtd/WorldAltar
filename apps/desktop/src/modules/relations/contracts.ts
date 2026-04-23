import type { EntityId } from '../entity-model/types';

export type RelationType =
  | 'parent'
  | 'child'
  | 'spouse'
  | 'ally'
  | 'rival'
  | 'rules'
  | 'controls'
  | 'located_in'
  | 'member_of'
  | 'founded'
  | 'caused_by'
  | 'participant_in'
  | 'defeated_by'
  | 'worships'
  | 'speaks';

export type RelationRecord = {
  id: string;
  fromEntityId: EntityId;
  toEntityId: EntityId;
  type: RelationType;
  label: string | null;
};

export type RelationLens = {
  listForEntity(entityId: EntityId): Promise<RelationRecord[]>;
  listAll(): Promise<RelationRecord[]>;
};
