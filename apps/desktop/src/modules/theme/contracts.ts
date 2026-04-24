export type ThemeId = 'dusk' | 'parchment';

export type ThemeOption = {
  id: ThemeId;
  label: string;
  summary: string;
  tones: [string, string, string];
};

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: 'dusk',
    label: 'Dusk',
    summary: 'Dark teal, bronze, indigo.',
    tones: ['#6f9c96', '#c89b65', '#2d3452']
  },
  {
    id: 'parchment',
    label: 'Parchment',
    summary: 'Light parchment shell, iron lines.',
    tones: ['#f5e9d3', '#8a663a', '#40486a']
  }
];
