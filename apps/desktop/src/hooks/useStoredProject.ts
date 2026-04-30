import { useEffect, useState } from 'react';
import type { WorldProject } from '../modules/projects/api';

function readStoredProject(storageKey: string) {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(storageKey);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorldProject;
  } catch {
    return null;
  }
}

export function useStoredProject(storageKey: string) {
  const [project, setProject] = useState<WorldProject | null>(() =>
    readStoredProject(storageKey)
  );

  useEffect(() => {
    if (project) {
      window.localStorage.setItem(storageKey, JSON.stringify(project));
    }
  }, [project, storageKey]);

  return [project, setProject] as const;
}
