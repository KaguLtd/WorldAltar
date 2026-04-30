import { useMemo, useState } from 'react';
import {
  DEFERRED_LENS_FLAGS,
  DEFERRED_LENS_KEYS,
  type DeferredLensFlag
} from '../modules/features';

type UseDeferredLensFlagsResult = {
  deferredLensFlags: DeferredLensFlag[];
  enabledDeferredLabels: string[];
  isDeferredLensEnabled: (id: DeferredLensFlag['id']) => boolean;
  toggleDeferredLensFlag: (id: DeferredLensFlag['id']) => void;
};

function readStoredDeferredLensFlags() {
  return DEFERRED_LENS_FLAGS.map((flag) =>
    typeof window !== 'undefined'
      ? {
          ...flag,
          enabled: window.localStorage.getItem(DEFERRED_LENS_KEYS[flag.id]) === 'true'
        }
      : flag
  );
}

export function useDeferredLensFlags(): UseDeferredLensFlagsResult {
  const [deferredLensFlags, setDeferredLensFlags] = useState<DeferredLensFlag[]>(
    readStoredDeferredLensFlags
  );

  const enabledDeferredLabels = useMemo(
    () =>
      deferredLensFlags
        .filter((flag) => flag.enabled)
        .map((flag) => flag.label),
    [deferredLensFlags]
  );

  function isDeferredLensEnabled(id: DeferredLensFlag['id']) {
    return deferredLensFlags.find((flag) => flag.id === id)?.enabled ?? false;
  }

  function toggleDeferredLensFlag(id: DeferredLensFlag['id']) {
    setDeferredLensFlags((current) =>
      current.map((flag) => {
        if (flag.id !== id) {
          return flag;
        }

        const enabled = !flag.enabled;
        window.localStorage.setItem(DEFERRED_LENS_KEYS[id], String(enabled));
        return { ...flag, enabled };
      })
    );
  }

  return {
    deferredLensFlags,
    enabledDeferredLabels,
    isDeferredLensEnabled,
    toggleDeferredLensFlag
  };
}
