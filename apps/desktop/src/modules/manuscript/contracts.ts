import type { EntityId } from '../entity-model/types';

export type ManuscriptNodeKind = 'chapter' | 'scene';

export type ManuscriptNode = {
  id: string;
  parentId: string | null;
  kind: ManuscriptNodeKind;
  slug: string;
  title: string;
  body: string;
  summary: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type ManuscriptMention = {
  id: string;
  nodeId: string;
  entityId: EntityId;
  label: string;
  startOffset: number;
  endOffset: number;
};

export type ManuscriptSceneDetail = {
  node: ManuscriptNode;
  mentions: ManuscriptMention[];
};

export type ManuscriptTreeItem = {
  node: ManuscriptNode;
  children: ManuscriptNode[];
};

export type MentionInput = {
  entityId: EntityId;
  label: string;
  startOffset: number;
  endOffset: number;
};

export type EntityBacklink = {
  nodeId: string;
  chapterId: string | null;
  chapterTitle: string | null;
  sceneTitle: string;
  entityId: EntityId;
  label: string;
};

export type ManuscriptRecoveryReport = {
  recoveredCount: number;
  discardedCount: number;
};
