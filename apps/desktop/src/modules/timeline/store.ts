import { useEffect, useState } from 'react';

const DEFAULT_YEAR = 1204;
const YEAR_KEY = 'worldaltar.activeYear';

function readYear() {
  if (typeof window === 'undefined') {
    return DEFAULT_YEAR;
  }

  const raw = window.localStorage.getItem(YEAR_KEY);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_YEAR;
}

export function useTimelineYear() {
  const [year, setYear] = useState(readYear);

  useEffect(() => {
    window.localStorage.setItem(YEAR_KEY, String(year));
  }, [year]);

  return [year, setYear] as const;
}
