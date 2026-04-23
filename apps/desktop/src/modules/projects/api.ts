import { invoke } from '@tauri-apps/api/core';
import type { WorldId } from '../entity-model/types';

export type BootstrapStatus = {
  documentsRoot: string;
  appRoot: string;
  worldsRoot: string;
};

export type WorldProject = {
  id: WorldId;
  title: string;
  slug: string;
  schemaVersion: number;
  createdAt: string;
  updatedAt: string;
  worldPath: string;
  databasePath: string;
};

export function getBootstrapStatus() {
  return invoke<BootstrapStatus>('bootstrap_status');
}

export function createWorld(title: string) {
  return invoke<WorldProject>('create_world_command', {
    request: { title }
  });
}
