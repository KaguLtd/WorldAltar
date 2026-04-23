import { invoke } from '@tauri-apps/api/core';
import type { EntityRecord } from './types';

export type AutosaveRecoveryReport = {
  recoveredCount: number;
  conflictedCount: number;
  discardedCount: number;
};

export function autosaveEntity(databasePath: string, input: { id: string; title: string; summary: string; body: string }) {
  return invoke<EntityRecord>('autosave_entity_command', {
    databasePath,
    input
  });
}

export function recoverAutosave(databasePath: string) {
  return invoke<AutosaveRecoveryReport>('recover_autosave_command', {
    databasePath
  });
}
