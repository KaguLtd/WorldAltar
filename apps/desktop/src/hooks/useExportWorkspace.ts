import { useEffect, useState } from 'react';
import { listExportJobs } from '../modules/export/api';
import type { ExportJob } from '../modules/export/contracts';
import type { ActiveLens } from '../App';

type UseExportWorkspaceArgs = {
  activeLens: ActiveLens;
  databasePath: string | null;
  exportEnabled: boolean;
  setError: (value: string) => void;
};

export function useExportWorkspace({
  activeLens,
  databasePath,
  exportEnabled,
  setError
}: UseExportWorkspaceArgs) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportStatus, setExportStatus] = useState('Deferred off');

  useEffect(() => {
    if (!databasePath || !exportEnabled || activeLens !== 'Export') {
      return;
    }

    setExportStatus('Loading export queue');
    listExportJobs(databasePath)
      .then((jobs) => {
        setExportJobs(jobs);
        setExportStatus(
          jobs.length ? 'Export queue ready' : 'Export queue empty'
        );
      })
      .catch((value: unknown) => {
        setExportStatus('Export failed');
        setError(String(value));
      });
  }, [activeLens, databasePath, exportEnabled, setError]);

  return {
    exportJobs,
    exportStatus,
    setExportJobs,
    setExportStatus
  };
}
