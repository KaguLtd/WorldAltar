import type { WorldYear } from '../time-engine/contracts';

export type TimelineState = {
  year: WorldYear;
};

export type TimelineLens = {
  getYear(): WorldYear;
  setYear(year: WorldYear): void;
  subscribe(listener: (state: TimelineState) => void): () => void;
};
