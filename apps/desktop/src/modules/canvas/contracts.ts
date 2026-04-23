import type { EntityId } from '../entity-model/types';
import type { WorldYear } from '../time-engine/contracts';

export type CanvasBoardKind =
  | 'relation_board'
  | 'family_tree'
  | 'story_board'
  | 'event_chain'
  | 'faction_board';

export type CanvasNodeRef =
  | {
      kind: 'entity';
      entityId: EntityId;
    }
  | {
      kind: 'scene';
      sceneId: string;
    };

export type CanvasNode = {
  id: string;
  label: string;
  ref: CanvasNodeRef;
  x: number;
  y: number;
};

export type CanvasEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  label: string | null;
};

export type CanvasBoard = {
  id: string;
  kind: CanvasBoardKind;
  title: string;
  year: WorldYear | null;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export type CanvasLens = {
  listBoards(): Promise<CanvasBoard[]>;
  openBoard(id: string): Promise<CanvasBoard | null>;
};
