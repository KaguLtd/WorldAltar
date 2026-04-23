export type ThemeId = 'dusk' | 'parchment';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  summary: string;
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dusk',
    label: 'Dusk',
    summary: 'Dark teal, bronze, indigo.'
  },
  {
    id: 'parchment',
    label: 'Parchment',
    summary: 'Light parchment shell, iron lines.'
  }
];
