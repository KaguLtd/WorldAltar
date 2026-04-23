import { useEffect, useState } from 'react';
import { THEME_OPTIONS, type ThemeId } from './contracts';

const THEME_KEY = 'worldaltar.theme';

function readTheme(): ThemeId {
  if (typeof window === 'undefined') {
    return THEME_OPTIONS[0].id;
  }

  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === 'parchment' ? 'parchment' : 'dusk';
}

export function useTheme(): [ThemeId, (next: ThemeId) => void] {
  const [theme, setTheme] = useState<ThemeId>(readTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  return [theme, setTheme];
}
