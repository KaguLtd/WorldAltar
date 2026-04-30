import { useEffect, useState } from 'react';
import { recoverAutosave } from '../modules/entity-model/api';

type UseStartupRecoveryArgs = {
  databasePath: string | null;
  setError: (value: string) => void;
};

export function useStartupRecovery({
  databasePath,
  setError
}: UseStartupRecoveryArgs) {
  const [isBootstrappingProject, setIsBootstrappingProject] = useState(false);
  const [recoveryState, setRecoveryState] = useState('');

  useEffect(() => {
    if (!databasePath) {
      setRecoveryState('');
      return;
    }

    setIsBootstrappingProject(true);
    setError('');

    recoverAutosave(databasePath)
      .then((entityReport) => {
        if (
          entityReport.recoveredCount > 0 ||
          entityReport.conflictedCount > 0 ||
          entityReport.discardedCount > 0
        ) {
          setRecoveryState(
            `Recovered ${entityReport.recoveredCount} / Conflicts ${entityReport.conflictedCount} / Dropped ${entityReport.discardedCount}`
          );
        }
      })
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsBootstrappingProject(false));
  }, [databasePath, setError]);

  return {
    isBootstrappingProject,
    recoveryState
  };
}
