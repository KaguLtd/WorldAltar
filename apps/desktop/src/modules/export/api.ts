import { invoke } from '@tauri-apps/api/core';
import type { ExportJob, ExportRequest } from './contracts';

export function queueExport(databasePath: string, request: ExportRequest) {
  return invoke<ExportJob>('queue_export_command', {
    databasePath,
    request
  });
}

export function listExportJobs(databasePath: string) {
  return invoke<ExportJob[]>('list_export_jobs_command', {
    databasePath
  });
}
