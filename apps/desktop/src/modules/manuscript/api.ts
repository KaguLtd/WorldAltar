import { invoke } from '@tauri-apps/api/core';
import type {
  EntityBacklink,
  ManuscriptNode,
  ManuscriptRecoveryReport,
  ManuscriptSceneDetail,
  ManuscriptTreeItem,
  MentionInput
} from './contracts';

export function listManuscriptTree(databasePath: string) {
  return invoke<ManuscriptTreeItem[]>('list_manuscript_tree_command', {
    databasePath
  });
}

export function getManuscriptScene(databasePath: string, id: string) {
  return invoke<ManuscriptSceneDetail | null>('get_manuscript_scene_command', {
    databasePath,
    id
  });
}

export function createManuscriptChapter(databasePath: string, input: { title: string }) {
  return invoke<ManuscriptNode>('create_manuscript_chapter_command', {
    databasePath,
    input
  });
}

export function createManuscriptScene(
  databasePath: string,
  input: {
    chapterId: string;
    title: string;
    body?: string;
    summary?: string;
    mentions: MentionInput[];
  }
) {
  return invoke<ManuscriptSceneDetail>('create_manuscript_scene_command', {
    databasePath,
    input
  });
}

export function autosaveManuscriptScene(
  databasePath: string,
  input: {
    id: string;
    title: string;
    body: string;
    summary: string;
    mentions: MentionInput[];
  }
) {
  return invoke<ManuscriptSceneDetail>('autosave_manuscript_scene_command', {
    databasePath,
    input
  });
}

export function recoverManuscriptAutosave(databasePath: string) {
  return invoke<ManuscriptRecoveryReport>('recover_manuscript_autosave_command', {
    databasePath
  });
}

export function listManuscriptBacklinks(databasePath: string, entityId: string) {
  return invoke<EntityBacklink[]>('list_manuscript_backlinks_command', {
    databasePath,
    entityId
  });
}
