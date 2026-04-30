import { useEffect, useState } from 'react';
import { listManuscriptBacklinks } from '../modules/manuscript/api';
import type { EntityRecord } from '../modules/entity-model/types';
import type { EntityBacklink } from '../modules/manuscript/contracts';

type UseManuscriptBacklinksArgs = {
  databasePath: string | null;
  manuscriptEnabled: boolean;
  selectedEntity: EntityRecord | null;
  setError: (value: string) => void;
};

export function useManuscriptBacklinks({
  databasePath,
  manuscriptEnabled,
  selectedEntity,
  setError
}: UseManuscriptBacklinksArgs) {
  const [backlinks, setBacklinks] = useState<EntityBacklink[]>([]);

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || !selectedEntity) {
      setBacklinks([]);
      return;
    }

    listManuscriptBacklinks(databasePath, selectedEntity.common.id)
      .then(setBacklinks)
      .catch((value: unknown) => setError(String(value)));
  }, [databasePath, manuscriptEnabled, selectedEntity, setError]);

  return backlinks;
}
