export type DeferredLensId = 'manuscript' | 'canvas' | 'export' | 'relations';

export type DeferredLensFlag = {
  id: DeferredLensId;
  label: string;
  enabled: boolean;
};

export const MANUSCRIPT_FLAG_KEY = 'worldaltar.feature.manuscript';
export const CANVAS_FLAG_KEY = 'worldaltar.feature.canvas';
export const EXPORT_FLAG_KEY = 'worldaltar.feature.export';
export const RELATIONS_FLAG_KEY = 'worldaltar.feature.relations';

export const DEFERRED_LENS_FLAGS: DeferredLensFlag[] = [
  { id: 'manuscript', label: 'Manuscript', enabled: false },
  { id: 'canvas', label: 'Canvas', enabled: false },
  { id: 'export', label: 'Export', enabled: false },
  { id: 'relations', label: 'Relations', enabled: false }
];

export const DEFERRED_LENS_KEYS: Record<DeferredLensId, string> = {
  manuscript: MANUSCRIPT_FLAG_KEY,
  canvas: CANVAS_FLAG_KEY,
  export: EXPORT_FLAG_KEY,
  relations: RELATIONS_FLAG_KEY
};
