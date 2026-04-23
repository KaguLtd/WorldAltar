import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  createWorld,
  getBootstrapStatus,
  type BootstrapStatus,
  type WorldProject
} from './modules/projects/api';
import { listEntities } from './modules/wiki/api';
import { searchEntities } from './modules/search/api';
import { useTimelineYear } from './modules/timeline/store';
import { OfflineMap } from './modules/map/OfflineMap';
import type { EntityRecord, EntityType } from './modules/entity-model/types';
import { autosaveEntity, recoverAutosave } from './modules/entity-model/api';
import { resolveEntityVisual } from './modules/assets/contracts';
import { THEME_OPTIONS } from './modules/theme/contracts';
import { useTheme } from './modules/theme/store';
import { listExportJobs, queueExport } from './modules/export/api';
import type { ExportJob, ExportKind } from './modules/export/contracts';
import {
  autosaveManuscriptScene,
  createManuscriptChapter,
  createManuscriptScene,
  getManuscriptScene,
  listManuscriptBacklinks,
  listManuscriptTree,
  recoverManuscriptAutosave
} from './modules/manuscript/api';
import type {
  EntityBacklink,
  ManuscriptSceneDetail,
  ManuscriptTreeItem,
  MentionInput
} from './modules/manuscript/contracts';

const ACTIVE_PROJECT_KEY = 'worldaltar.activeProject';
const TYPE_OPTIONS: Array<EntityType | 'all'> = ['all', 'character', 'location', 'region', 'event'];
const LENS_ITEMS = ['Wiki', 'Map', 'Timeline', 'Search', 'Manuscript', 'Canvas'] as const;
const MANUSCRIPT_MODES = ['Draft', 'Split', 'Book', 'Print'] as const;
const PRINT_TRIMS = ['A5', 'Trade', 'Royal'] as const;
const TIMELINE_VIEWS = ['List', 'Bands', 'Chains'] as const;
const CANVAS_VIEWS = ['Relation', 'Family', 'Event'] as const;
const TYPE_LABELS: Record<EntityType, string> = {
  character: 'Character',
  location: 'Location',
  region: 'Region',
  event: 'Event'
};
const TYPE_MONOGRAMS: Record<EntityType, string> = {
  character: 'C',
  location: 'L',
  region: 'R',
  event: 'E'
};

type ActiveLens = (typeof LENS_ITEMS)[number];
type ManuscriptMode = (typeof MANUSCRIPT_MODES)[number];
type PrintTrim = (typeof PRINT_TRIMS)[number];
type TimelineView = (typeof TIMELINE_VIEWS)[number];
type CanvasView = (typeof CANVAS_VIEWS)[number];

function readActiveProject() {
  if (typeof window === 'undefined') {
    return null;
  }

  const raw = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as WorldProject;
  } catch {
    return null;
  }
}

export function App() {
  const [activeLens, setActiveLens] = useState<ActiveLens>('Wiki');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [project, setProject] = useState<WorldProject | null>(readActiveProject);
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [isBootstrappingProject, setIsBootstrappingProject] = useState(false);
  const [isRefreshingEntities, setIsRefreshingEntities] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [dirty, setDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState('Idle');
  const [year, setYear] = useTimelineYear();
  const [theme, setTheme] = useTheme();
  const [manuscriptTree, setManuscriptTree] = useState<ManuscriptTreeItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [sceneDetail, setSceneDetail] = useState<ManuscriptSceneDetail | null>(null);
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneSummary, setSceneSummary] = useState('');
  const [sceneBody, setSceneBody] = useState('');
  const [sceneMentions, setSceneMentions] = useState<MentionInput[]>([]);
  const [sceneDirty, setSceneDirty] = useState(false);
  const [sceneAutosaveState, setSceneAutosaveState] = useState('Idle');
  const [entityBacklinks, setEntityBacklinks] = useState<EntityBacklink[]>([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [sceneCreateTitle, setSceneCreateTitle] = useState('');
  const [manuscriptMode, setManuscriptMode] = useState<ManuscriptMode>('Draft');
  const [printTrim, setPrintTrim] = useState<PrintTrim>('A5');
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [dragSceneId, setDragSceneId] = useState<string | null>(null);
  const [timelineView, setTimelineView] = useState<TimelineView>('List');
  const [canvasView, setCanvasView] = useState<CanvasView>('Relation');
  const [dragCanvasNodeId, setDragCanvasNodeId] = useState<string | null>(null);
  const [canvasNodeOrder, setCanvasNodeOrder] = useState<string[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportBusy, setExportBusy] = useState<ExportKind | null>(null);

  useEffect(() => {
    getBootstrapStatus()
      .then(setStatus)
      .catch((value: unknown) => setError(String(value)));
  }, []);

  useEffect(() => {
    if (project) {
      window.localStorage.setItem(ACTIVE_PROJECT_KEY, JSON.stringify(project));
    }
  }, [project]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setIsBootstrappingProject(true);
    setError('');

    Promise.all([recoverAutosave(project.databasePath), recoverManuscriptAutosave(project.databasePath)])
      .then(([entityReport, sceneReport]) => {
        if (
          entityReport.recoveredCount > 0 ||
          entityReport.discardedCount > 0 ||
          sceneReport.recoveredCount > 0 ||
          sceneReport.discardedCount > 0
        ) {
          setAutosaveState(
            `Recovered ${entityReport.recoveredCount + sceneReport.recoveredCount} / Dropped ${
              entityReport.discardedCount + sceneReport.discardedCount
            }`
          );
        }
        return Promise.all([listExportJobs(project.databasePath), listManuscriptTree(project.databasePath)]);
      })
      .then(([jobs, tree]) => {
        setManuscriptTree(tree);
        setExportJobs(jobs);
      })
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsBootstrappingProject(false));
  }, [project?.databasePath]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setIsRefreshingEntities(true);
    setError('');

    listEntities(project.databasePath, year)
      .then(setRecords)
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsRefreshingEntities(false));
  }, [project?.databasePath, year]);

  useEffect(() => {
    if (!project || !query.trim()) {
      setSearchIds(null);
      return;
    }

    searchEntities(project.databasePath, query, year)
      .then((hits) => setSearchIds(hits.map((hit) => hit.id)))
      .catch((value: unknown) => setError(String(value)));
  }, [project, query, year]);

  let filteredRecords = records;

  if (typeFilter !== 'all') {
    filteredRecords = filteredRecords.filter((record) => record.type === typeFilter);
  }

  if (searchIds) {
    filteredRecords = filteredRecords.filter((record) => searchIds.includes(record.common.id));
  }

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedEntityId(null);
      return;
    }

    if (!filteredRecords.some((record) => record.common.id === selectedEntityId)) {
      setSelectedEntityId(filteredRecords[0].common.id);
    }
  }, [filteredRecords, selectedEntityId]);

  useEffect(() => {
    if (!manuscriptTree.length) {
      setSelectedSceneId(null);
      return;
    }

    const allScenes = manuscriptTree.flatMap((chapter) => chapter.children);
    if (allScenes.length && !allScenes.some((scene) => scene.id === selectedSceneId)) {
      setSelectedSceneId(allScenes[0].id);
    }
  }, [manuscriptTree, selectedSceneId]);

  useEffect(() => {
    if (!project || !selectedSceneId) {
      setSceneDetail(null);
      return;
    }

    getManuscriptScene(project.databasePath, selectedSceneId)
      .then(setSceneDetail)
      .catch((value: unknown) => setError(String(value)));
  }, [project, selectedSceneId]);

  useEffect(() => {
    if (!project || !selectedEntityId) {
      setEntityBacklinks([]);
      return;
    }

    listManuscriptBacklinks(project.databasePath, selectedEntityId)
      .then(setEntityBacklinks)
      .catch((value: unknown) => setError(String(value)));
  }, [project, selectedEntityId]);

  const selectedEntity =
    filteredRecords.find((record) => record.common.id === selectedEntityId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const selectedVisual = selectedEntity ? resolveEntityVisual(selectedEntity) : null;
  const currentTheme = THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];
  const timelineRecords = [...filteredRecords].sort(
    (left, right) => (left.common.startYear ?? year) - (right.common.startYear ?? year)
  );
  const searchRecords = query.trim() ? filteredRecords : [];
  const hoveredEntity =
    filteredRecords.find((record) => record.common.id === hoveredEntityId) ??
    records.find((record) => record.common.id === hoveredEntityId) ??
    null;
  const scenePages = useMemo(
    () => buildBookPages(manuscriptTree, sceneDetail, sceneTitle, sceneSummary, sceneBody, printTrim),
    [manuscriptTree, sceneDetail, sceneTitle, sceneSummary, sceneBody, printTrim]
  );
  const timelineBands = useMemo(() => buildTimelineBands(timelineRecords), [timelineRecords]);
  const canvasBoards = useMemo(() => buildCanvasBoards(records, manuscriptTree), [records, manuscriptTree]);
  const activeCanvasBoard = canvasBoards[canvasView];
  const orderedCanvasNodes = useMemo(() => {
    if (!activeCanvasBoard) {
      return [];
    }

    const lookup = new Map(activeCanvasBoard.nodes.map((node) => [node.id, node]));
    const seeded = canvasNodeOrder.map((id) => lookup.get(id)).filter(Boolean);
    const missing = activeCanvasBoard.nodes.filter((node) => !canvasNodeOrder.includes(node.id));
    return [...seeded, ...missing] as CanvasNodeView[];
  }, [activeCanvasBoard, canvasNodeOrder]);

  useEffect(() => {
    if (!activeCanvasBoard) {
      setCanvasNodeOrder([]);
      return;
    }

    setCanvasNodeOrder(activeCanvasBoard.nodes.map((node) => node.id));
  }, [activeCanvasBoard?.id]);

  useEffect(() => {
    if (!selectedEntity) {
      setDraftTitle('');
      setDraftSummary('');
      setDraftBody('');
      setDirty(false);
      return;
    }

    setDraftTitle(selectedEntity.common.title);
    setDraftSummary(selectedEntity.common.summary);
    setDraftBody(selectedEntity.common.body);
    setDirty(false);
  }, [selectedEntity?.common.id]);

  useEffect(() => {
    if (!selectedEntity) {
      return;
    }

    const nextDirty =
      draftTitle !== selectedEntity.common.title ||
      draftSummary !== selectedEntity.common.summary ||
      draftBody !== selectedEntity.common.body;
    setDirty(nextDirty);
  }, [draftBody, draftSummary, draftTitle, selectedEntity]);

  useEffect(() => {
    if (!project || !selectedEntity || !dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAutosaveState('Saving');
      autosaveEntity(project.databasePath, {
        id: selectedEntity.common.id,
        title: draftTitle,
        summary: draftSummary,
        body: draftBody
      })
        .then((updated) => {
          setRecords((current) =>
            current.map((record) => (record.common.id === updated.common.id ? updated : record))
          );
          setAutosaveState(`Saved ${updated.common.updatedAt}`);
          setDirty(false);
        })
        .catch((value: unknown) => {
          setAutosaveState('Save failed');
          setError(String(value));
        });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [project, selectedEntity, dirty, draftTitle, draftSummary, draftBody]);

  useEffect(() => {
    if (!sceneDetail) {
      setSceneTitle('');
      setSceneSummary('');
      setSceneBody('');
      setSceneMentions([]);
      setSceneDirty(false);
      return;
    }

    setSceneTitle(sceneDetail.node.title);
    setSceneSummary(sceneDetail.node.summary);
    setSceneBody(sceneDetail.node.body);
    setSceneMentions(
      sceneDetail.mentions.map((mention) => ({
        entityId: mention.entityId,
        label: mention.label,
        startOffset: mention.startOffset,
        endOffset: mention.endOffset
      }))
    );
    setSceneDirty(false);
  }, [sceneDetail?.node.id]);

  useEffect(() => {
    if (!sceneDetail) {
      return;
    }

    const nextDirty =
      sceneTitle !== sceneDetail.node.title ||
      sceneSummary !== sceneDetail.node.summary ||
      sceneBody !== sceneDetail.node.body ||
      JSON.stringify(sceneMentions) !==
        JSON.stringify(
          sceneDetail.mentions.map((mention) => ({
            entityId: mention.entityId,
            label: mention.label,
            startOffset: mention.startOffset,
            endOffset: mention.endOffset
          }))
        );
    setSceneDirty(nextDirty);
  }, [sceneBody, sceneDetail, sceneMentions, sceneSummary, sceneTitle]);

  useEffect(() => {
    if (!project || !sceneDetail || !sceneDirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      setSceneAutosaveState('Saving');
      autosaveManuscriptScene(project.databasePath, {
        id: sceneDetail.node.id,
        title: sceneTitle,
        summary: sceneSummary,
        body: sceneBody,
        mentions: sceneMentions
      })
        .then((updated) => {
          setSceneDetail(updated);
          setSceneAutosaveState(`Saved ${updated.node.updatedAt}`);
          setSceneDirty(false);
          return listManuscriptTree(project.databasePath);
        })
        .then(setManuscriptTree)
        .catch((value: unknown) => {
          setSceneAutosaveState('Save failed');
          setError(String(value));
        });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [project, sceneBody, sceneDetail, sceneDirty, sceneMentions, sceneSummary, sceneTitle]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const nextProject = await createWorld(title);
      setProject(nextProject);
      setSelectedEntityId(null);
      setTitle('');
      const nextStatus = await getBootstrapStatus();
      setStatus(nextStatus);
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateChapter() {
    if (!project || !chapterTitle.trim()) {
      return;
    }

    try {
      await createManuscriptChapter(project.databasePath, { title: chapterTitle });
      setManuscriptTree(await listManuscriptTree(project.databasePath));
      setChapterTitle('');
    } catch (value) {
      setError(String(value));
    }
  }

  async function handleCreateScene(chapterId: string) {
    if (!project || !sceneCreateTitle.trim()) {
      return;
    }

    try {
      const detail = await createManuscriptScene(project.databasePath, {
        chapterId,
        title: sceneCreateTitle,
        mentions: selectedEntity
          ? [
              {
                entityId: selectedEntity.common.id,
                label: selectedEntity.common.title,
                startOffset: 0,
                endOffset: selectedEntity.common.title.length
              }
            ]
          : []
      });
      setSelectedSceneId(detail.node.id);
      setManuscriptTree(await listManuscriptTree(project.databasePath));
      setSceneCreateTitle('');
      setActiveLens('Manuscript');
    } catch (value) {
      setError(String(value));
    }
  }

  function handleLinkSelectedEntity() {
    if (!selectedEntity) {
      return;
    }

    setSceneMentions((current) => {
      if (current.some((mention) => mention.entityId === selectedEntity.common.id)) {
        return current;
      }

      return [
        ...current,
        {
          entityId: selectedEntity.common.id,
          label: selectedEntity.common.title,
          startOffset: 0,
          endOffset: selectedEntity.common.title.length
        }
      ];
    });
  }

  function handleSceneDrop(chapterId: string, targetSceneId: string) {
    if (!dragSceneId || dragSceneId === targetSceneId) {
      setDragSceneId(null);
      return;
    }

    setManuscriptTree((current) =>
      current.map((chapter) => {
        if (chapter.node.id !== chapterId) {
          return chapter;
        }

        const nextChildren = [...chapter.children];
        const dragIndex = nextChildren.findIndex((scene) => scene.id === dragSceneId);
        const targetIndex = nextChildren.findIndex((scene) => scene.id === targetSceneId);
        if (dragIndex < 0 || targetIndex < 0) {
          return chapter;
        }

        const [moved] = nextChildren.splice(dragIndex, 1);
        nextChildren.splice(targetIndex, 0, moved);
        return { ...chapter, children: nextChildren };
      })
    );

    setDragSceneId(null);
  }

  function handleCanvasDrop(targetNodeId: string) {
    if (!dragCanvasNodeId || dragCanvasNodeId === targetNodeId) {
      setDragCanvasNodeId(null);
      return;
    }

    setCanvasNodeOrder((current) => {
      const next = [...current];
      const dragIndex = next.indexOf(dragCanvasNodeId);
      const targetIndex = next.indexOf(targetNodeId);
      if (dragIndex < 0 || targetIndex < 0) {
        return current;
      }

      const [moved] = next.splice(dragIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });

    setDragCanvasNodeId(null);
  }

  async function handleQueueExport(kind: ExportKind) {
    if (!project) {
      return;
    }

    setExportBusy(kind);
    setError('');

    try {
      const job = await queueExport(project.databasePath, { kind });
      setExportJobs((current) => [job, ...current]);
    } catch (value) {
      setError(String(value));
    } finally {
      setExportBusy(null);
    }
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="shell">
        <header className="command-bar">
          <div>
            <p className="eyebrow">WorldAltar</p>
            <h1>Faz V1 deneyim iskeleti.</h1>
          </div>
          <div className="command-meta">
            <span className="command-chip">Lens {activeLens}</span>
            <button
              className="command-chip command-button"
              onClick={() => setTheme(theme === 'dusk' ? 'parchment' : 'dusk')}
              type="button"
            >
              Theme {currentTheme.label}
            </button>
            <span className="command-chip">{isBootstrappingProject ? 'Startup sync' : 'Startup ready'}</span>
            <span className="command-chip">Year {year}</span>
            <span className={`command-chip${dirty || sceneDirty ? ' is-dirty' : ''}`}>
              {sceneDirty ? sceneAutosaveState : dirty ? 'Dirty' : autosaveState}
            </span>
          </div>
        </header>

        <section className="shell-grid">
          <aside className="nav-rail">
            <div className="rail-block">
              <p className="eyebrow">Lenses</p>
              <nav className="lens-nav" aria-label="lens navigation">
                {LENS_ITEMS.map((item) => (
                  <button
                    key={item}
                    aria-pressed={item === activeLens}
                    className={`lens-link${item === activeLens ? ' is-active' : ''}`}
                    onClick={() => setActiveLens(item)}
                    type="button"
                  >
                    {item}
                  </button>
                ))}
              </nav>
            </div>

            <div className="rail-block">
              <p className="eyebrow">Bootstrap</p>
              <form className="form" onSubmit={handleSubmit}>
                <label className="label" htmlFor="world-title">
                  World title
                </label>
                <input
                  id="world-title"
                  className="input"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="New world"
                />
                <button className="button" disabled={busy} type="submit">
                  {busy ? 'Creating...' : 'Create world'}
                </button>
              </form>
            </div>

            {status ? (
              <dl className="meta rail-block">
                <div>
                  <dt>App root</dt>
                  <dd>{status.appRoot}</dd>
                </div>
                <div>
                  <dt>Worlds root</dt>
                  <dd>{status.worldsRoot}</dd>
                </div>
              </dl>
            ) : null}
          </aside>

          <section className="workspace">
            <div className="workspace-head">
              <div>
                <p className="eyebrow">{activeLens} Lens</p>
                <p className="copy">{getLensCopy(activeLens)}</p>
              </div>
              {(activeLens === 'Wiki' || activeLens === 'Search') && (
                <div className="toolbar toolbar-inline">
                  <input
                    aria-label="search query"
                    className="input"
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search"
                    value={query}
                  />
                  <select
                    aria-label="entity type"
                    className="input select"
                    onChange={(event) => setTypeFilter(event.target.value as EntityType | 'all')}
                    value={typeFilter}
                  >
                    {TYPE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {activeLens === 'Timeline' && (
                <div className="toolbar timeline-toolbar">
                  <div className="mode-strip" aria-label="timeline views">
                    {TIMELINE_VIEWS.map((view) => (
                      <button
                        key={view}
                        aria-pressed={view === timelineView}
                        className={`mode-chip${view === timelineView ? ' is-active' : ''}`}
                        onClick={() => setTimelineView(view)}
                        type="button"
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {activeLens === 'Manuscript' && (
                <div className="toolbar manuscript-toolbar">
                  <div className="mode-strip" aria-label="manuscript modes">
                    {MANUSCRIPT_MODES.map((mode) => (
                      <button
                        key={mode}
                        aria-pressed={mode === manuscriptMode}
                        className={`mode-chip${mode === manuscriptMode ? ' is-active' : ''}`}
                        onClick={() => setManuscriptMode(mode)}
                        type="button"
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <select
                    aria-label="print trim"
                    className="input select trim-select"
                    onChange={(event) => setPrintTrim(event.target.value as PrintTrim)}
                    value={printTrim}
                  >
                    {PRINT_TRIMS.map((trim) => (
                      <option key={trim} value={trim}>
                        {trim}
                      </option>
                    ))}
                  </select>
                  <div className="export-strip" aria-label="export actions">
                    <button
                      className="button ghost-button"
                      disabled={exportBusy !== null}
                      onClick={() => void handleQueueExport('manuscript_pdf')}
                      type="button"
                    >
                      {exportBusy === 'manuscript_pdf' ? 'Exporting...' : 'Manuscript PDF'}
                    </button>
                    <button
                      className="button ghost-button"
                      disabled={exportBusy !== null}
                      onClick={() => void handleQueueExport('pdf_dossier')}
                      type="button"
                    >
                      {exportBusy === 'pdf_dossier' ? 'Exporting...' : 'Dossier PDF'}
                    </button>
                  </div>
                </div>
              )}
              {activeLens === 'Canvas' && (
                <div className="toolbar timeline-toolbar">
                  <div className="mode-strip" aria-label="canvas views">
                    {CANVAS_VIEWS.map((view) => (
                      <button
                        key={view}
                        aria-pressed={view === canvasView}
                        className={`mode-chip${view === canvasView ? ' is-active' : ''}`}
                        onClick={() => setCanvasView(view)}
                        type="button"
                      >
                        {view}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {project ? (
              <>
                <dl className="meta workspace-meta">
                  <div>
                    <dt>Slug</dt>
                    <dd>{project.slug}</dd>
                  </div>
                  <div>
                    <dt>DB</dt>
                    <dd>{project.databasePath}</dd>
                  </div>
                  <div>
                    <dt>Visible</dt>
                    <dd>{filteredRecords.length}</dd>
                  </div>
                </dl>

                <section className="workspace-stage" data-lens={activeLens}>
                  {activeLens === 'Map' ? (
                    <div className="lens-frame">
                      <OfflineMap
                        onSelect={setSelectedEntityId}
                        records={filteredRecords}
                        selectedEntityId={selectedEntityId}
                      />
                    </div>
                  ) : null}

                  {activeLens === 'Timeline' ? (
                    timelineView === 'List' ? (
                      <section className="timeline-list" role="list">
                        {timelineRecords.map((record) => (
                          <button
                            key={record.common.id}
                            className={`timeline-row${record.common.id === selectedEntityId ? ' is-active' : ''}`}
                            onClick={() => setSelectedEntityId(record.common.id)}
                            role="listitem"
                            type="button"
                          >
                            <span className="timeline-year">{record.common.startYear ?? 'open'}</span>
                            <strong>{record.common.title}</strong>
                            <span>{TYPE_LABELS[record.type]}</span>
                          </button>
                        ))}
                        {!timelineRecords.length ? (
                          <p className="empty card-empty">{isRefreshingEntities ? 'Loading...' : 'No visible entity'}</p>
                        ) : null}
                      </section>
                    ) : timelineView === 'Bands' ? (
                      <section className="timeline-bands" aria-label="timeline bands">
                        {timelineBands.map((band) => (
                          <div key={band.label} className="timeline-band">
                            <div className="timeline-band-head">
                              <strong>{band.label}</strong>
                              <span>{band.items.length} items</span>
                            </div>
                            <div className="timeline-band-items">
                              {band.items.map((record) => (
                                <button
                                  key={record.common.id}
                                  className={`band-chip${record.common.id === selectedEntityId ? ' is-active' : ''}`}
                                  onClick={() => setSelectedEntityId(record.common.id)}
                                  type="button"
                                >
                                  {record.common.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </section>
                    ) : (
                      <section className="timeline-chain" aria-label="timeline chains">
                        {timelineRecords.map((record, index) => (
                          <div key={record.common.id} className="chain-row">
                            <span className="timeline-year">{record.common.startYear ?? 'open'}</span>
                            <button
                              className={`chain-node${record.common.id === selectedEntityId ? ' is-active' : ''}`}
                              onClick={() => setSelectedEntityId(record.common.id)}
                              type="button"
                            >
                              {record.common.title}
                            </button>
                            {index < timelineRecords.length - 1 ? <span className="chain-link" aria-hidden="true" /> : null}
                          </div>
                        ))}
                      </section>
                    )
                  ) : null}

                  {activeLens === 'Wiki'
                    ? renderCardGrid(filteredRecords, selectedEntityId, setSelectedEntityId, setHoveredEntityId)
                    : null}

                  {activeLens === 'Search' ? (
                    query.trim() ? (
                      renderCardGrid(searchRecords, selectedEntityId, setSelectedEntityId, setHoveredEntityId)
                    ) : (
                      <section className="empty-stage lens-empty">
                        <p className="eyebrow">Search</p>
                        <h2>Type query.</h2>
                        <p className="copy">FTS lens acik. Wiki ve map ile ayni visible set kullanir.</p>
                      </section>
                    )
                  ) : null}

                  {activeLens === 'Manuscript' ? (
                    <section className={`manuscript-shell mode-${manuscriptMode.toLowerCase()}`}>
                      <section className="manuscript-tree">
                        <div className="manuscript-create">
                          <input
                            aria-label="chapter title"
                            className="input"
                            onChange={(event) => setChapterTitle(event.target.value)}
                            placeholder="New chapter"
                            value={chapterTitle}
                          />
                          <button className="button" onClick={() => void handleCreateChapter()} type="button">
                            Add chapter
                          </button>
                        </div>
                        {manuscriptTree.map((chapter) => (
                          <div key={chapter.node.id} className="chapter-block">
                            <button className="chapter-row" type="button">
                              <strong>{chapter.node.title}</strong>
                              <span>{chapter.children.length} scenes</span>
                            </button>
                            <div className="scene-list">
                              {chapter.children.map((scene) => (
                                <button
                                  key={scene.id}
                                  className={`scene-row${scene.id === selectedSceneId ? ' is-active' : ''}`}
                                  draggable
                                  onDragOver={(event) => event.preventDefault()}
                                  onDragStart={() => setDragSceneId(scene.id)}
                                  onDrop={() => handleSceneDrop(chapter.node.id, scene.id)}
                                  onClick={() => setSelectedSceneId(scene.id)}
                                  type="button"
                                >
                                  {chapter.node.title} / {scene.title}
                                </button>
                              ))}
                            </div>
                            <div className="manuscript-create-inline">
                              <input
                                aria-label="scene title"
                                className="input"
                                onChange={(event) => setSceneCreateTitle(event.target.value)}
                                placeholder="New scene"
                                value={sceneCreateTitle}
                              />
                              <button className="button" onClick={() => void handleCreateScene(chapter.node.id)} type="button">
                                Add scene
                              </button>
                            </div>
                          </div>
                        ))}
                      </section>

                      {(manuscriptMode === 'Draft' || manuscriptMode === 'Split') && (
                        <section className="manuscript-editor premium-manuscript-editor" aria-label="premium manuscript editor">
                          {sceneDetail ? (
                            <>
                              <div className="manuscript-ornament" aria-hidden="true" />
                              <div className="manuscript-head">
                                <div>
                                  <p className="eyebrow">Scene</p>
                                  <strong>{sceneDetail.node.id}</strong>
                                </div>
                                <span className={`command-chip${sceneDirty ? ' is-dirty' : ''}`}>
                                  {sceneDirty ? 'Dirty' : sceneAutosaveState}
                                </span>
                              </div>
                              <label className="label" htmlFor="scene-editor-title">
                                Scene title
                              </label>
                              <input
                                id="scene-editor-title"
                                className="input"
                                onChange={(event) => setSceneTitle(event.target.value)}
                                value={sceneTitle}
                              />
                              <label className="label" htmlFor="scene-editor-summary">
                                Summary
                              </label>
                              <textarea
                                id="scene-editor-summary"
                                className="textarea"
                                onChange={(event) => setSceneSummary(event.target.value)}
                                value={sceneSummary}
                              />
                              <label className="label" htmlFor="scene-editor-body">
                                Body
                              </label>
                              <textarea
                                id="scene-editor-body"
                                className="textarea textarea-body manuscript-body"
                                onChange={(event) => setSceneBody(event.target.value)}
                                value={sceneBody}
                              />
                              <div className="manuscript-links">
                                <button className="button" onClick={handleLinkSelectedEntity} type="button">
                                  Link selected entity
                                </button>
                              </div>
                              <div className="mention-list">
                                {sceneMentions.map((mention) => (
                                  <button
                                    key={`${mention.entityId}-${mention.label}`}
                                    className="mention-chip"
                                    onClick={() => {
                                      setSelectedEntityId(mention.entityId);
                                      setActiveLens('Wiki');
                                    }}
                                    type="button"
                                  >
                                    {mention.label} -> {mention.entityId}
                                  </button>
                                ))}
                                {!sceneMentions.length ? <p className="empty">No mention</p> : null}
                              </div>
                            </>
                          ) : (
                            <section className="empty-stage lens-empty">
                              <p className="eyebrow">Manuscript</p>
                              <h2>Select scene.</h2>
                              <p className="copy">Chapter/scene agaci solda. Mention baglari id tabanli.</p>
                            </section>
                          )}
                        </section>
                      )}

                      {(manuscriptMode === 'Split' || manuscriptMode === 'Book' || manuscriptMode === 'Print') && (
                        <section
                          className={`book-preview premium-book-preview ${manuscriptMode === 'Print' ? 'is-print' : ''}`}
                          data-trim={printTrim}
                        >
                          <div className="book-aura" aria-hidden="true" />
                          <div className="book-toolbar">
                            <p className="eyebrow">
                              {manuscriptMode === 'Print' ? 'Print Preview' : manuscriptMode === 'Book' ? 'Book Spread' : 'Split Preview'}
                            </p>
                            <strong>{printTrim}</strong>
                          </div>
                          <div className="spread-shell premium-spread-shell" role="region" aria-label="book spread preview">
                            {scenePages.map((page, index) => (
                              <article
                                key={`${page.pageNumber}-${index}`}
                                className={`book-page${page.isChapterBreak ? ' is-chapter-break' : ''}`}
                              >
                                <div className="page-corner" aria-hidden="true" />
                                <div className="page-sheen" aria-hidden="true" />
                                <header className="book-running">
                                  <span>{page.runningHead}</span>
                                  <span>{page.pageNumber}</span>
                                </header>
                                {page.isChapterBreak ? (
                                  <div className="chapter-break">
                                    <p className="eyebrow">Chapter Break</p>
                                    <h2>{page.chapterTitle}</h2>
                                    <p>{page.sceneTitle}</p>
                                  </div>
                                ) : null}
                                {page.lede ? <p className="page-lede">{page.lede}</p> : null}
                                <div className="page-body">
                                  {page.paragraphs.map((paragraph, paragraphIndex) => (
                                    <p key={`${page.pageNumber}-${paragraphIndex}`}>{paragraph}</p>
                                  ))}
                                </div>
                                <footer className="book-foot">
                                  <span>{page.trimLabel}</span>
                                </footer>
                              </article>
                            ))}
                          </div>
                        </section>
                      )}
                    </section>
                  ) : null}

                  {activeLens === 'Canvas' ? (
                    <section className="canvas-board" aria-label="advanced canvas">
                      <div className="canvas-stage">
                        {orderedCanvasNodes.map((node) => (
                          <button
                            key={node.id}
                            className={`canvas-node${node.emphasis ? ' is-emphasis' : ''}`}
                            draggable
                            onDragOver={(event) => event.preventDefault()}
                            onDragStart={() => setDragCanvasNodeId(node.id)}
                            onDrop={() => handleCanvasDrop(node.id)}
                            onClick={() => {
                              if (node.entityId) {
                                setSelectedEntityId(node.entityId);
                                setActiveLens('Wiki');
                              }
                              if (node.sceneId) {
                                setSelectedSceneId(node.sceneId);
                                setActiveLens('Manuscript');
                              }
                            }}
                            type="button"
                          >
                            <strong>{node.label}</strong>
                            <span>{node.meta}</span>
                          </button>
                        ))}
                      </div>
                      <div className="canvas-relations">
                        {activeCanvasBoard?.edges.map((edge) => (
                          <div key={edge.id} className="relation-row">
                            <span>{edge.from}</span>
                            <strong>{edge.label}</strong>
                            <span>{edge.to}</span>
                          </div>
                        ))}
                        {!activeCanvasBoard?.edges.length ? <p className="empty">No board relation</p> : null}
                      </div>
                    </section>
                  ) : null}
                </section>
                {(activeLens === 'Wiki' || activeLens === 'Search') && hoveredEntity ? (
                  <aside className="hover-preview" aria-label="hover preview">
                    <img
                      alt={`${hoveredEntity.common.title} preview`}
                      className="hover-preview-image"
                      src={resolveEntityVisual(hoveredEntity).coverPath}
                    />
                    <div className="hover-preview-body">
                      <span className={`type-badge type-${hoveredEntity.type}`}>{TYPE_LABELS[hoveredEntity.type]}</span>
                      <strong>{hoveredEntity.common.title}</strong>
                      <span>{hoveredEntity.common.summary || 'No summary'}</span>
                      <div className="hover-actions">
                        <button className="button ghost-button" onClick={() => setActiveLens('Map')} type="button">
                          Open map
                        </button>
                        <button className="button ghost-button" onClick={() => setActiveLens('Manuscript')} type="button">
                          Open manuscript
                        </button>
                      </div>
                    </div>
                  </aside>
                ) : null}
              </>
            ) : (
              <section className="empty-stage">
                <p className="eyebrow">World</p>
                <h2>Create local world.</h2>
                <p className="copy">Seed data then fills wiki, map, detail.</p>
              </section>
            )}
          </section>

          <aside className="context-panel">
            <section className="timeline-panel timeline-sticky">
              <div className="timeline-head">
                <p className="eyebrow">Year Dock</p>
                <strong>{year}</strong>
              </div>
              <input
                aria-label="year slider"
                className="slider"
                max={1600}
                min={1100}
                onChange={(event) => setYear(Number(event.target.value))}
                type="range"
                value={year}
              />
            </section>

            {project ? (
              <>
                <section className="detail-panel">
                  <p className="eyebrow">Detail Panel</p>
                  {selectedEntity ? (
                    <>
                      <div className="detail-cover">
                        <span className={`type-badge type-${selectedEntity.type}`}>
                          <span className="type-icon" aria-hidden="true">
                            {TYPE_MONOGRAMS[selectedEntity.type]}
                          </span>
                          {TYPE_LABELS[selectedEntity.type]}
                        </span>
                        <span className="detail-code">{selectedEntity.common.id}</span>
                      </div>
                      <div className="detail-asset-shell premium-gallery-shell" aria-label="entity gallery panel">
                        <img
                          alt={`${selectedEntity.common.title} cover`}
                          className="detail-asset"
                          src={selectedVisual?.coverPath}
                        />
                        <img alt="" aria-hidden="true" className="detail-motif" src={selectedVisual?.motif.path} />
                        <div className="detail-gallery-rail" aria-hidden="true">
                          <span>{TYPE_LABELS[selectedEntity.type]}</span>
                          <span>{selectedEntity.common.startYear ?? 'open'}</span>
                          <span>{currentTheme.label}</span>
                        </div>
                      </div>
                      <h2>{selectedEntity.common.title}</h2>
                      <label className="label" htmlFor="entity-title">
                        Title
                      </label>
                      <input
                        id="entity-title"
                        className="input"
                        onChange={(event) => setDraftTitle(event.target.value)}
                        value={draftTitle}
                      />
                      <label className="label" htmlFor="entity-summary">
                        Summary
                      </label>
                      <textarea
                        id="entity-summary"
                        className="textarea"
                        onChange={(event) => setDraftSummary(event.target.value)}
                        value={draftSummary}
                      />
                      <label className="label" htmlFor="entity-body">
                        Body
                      </label>
                      <textarea
                        id="entity-body"
                        className="textarea textarea-body"
                        onChange={(event) => setDraftBody(event.target.value)}
                        value={draftBody}
                      />
                      <dl className="meta detail-grid">
                        <div>
                          <dt>Years</dt>
                          <dd>
                            {selectedEntity.common.startYear ?? 'open'} - {selectedEntity.common.endYear ?? 'open'}
                          </dd>
                        </div>
                        <div>
                          <dt>Location</dt>
                          <dd>
                            {selectedEntity.common.latitude ?? 'n/a'}, {selectedEntity.common.longitude ?? 'n/a'}
                          </dd>
                        </div>
                        <div>
                          <dt>Cover</dt>
                          <dd>{selectedVisual?.coverMode === 'entity' ? selectedEntity.common.coverImagePath : 'fallback asset'}</dd>
                        </div>
                        <div>
                          <dt>Theme</dt>
                          <dd>{currentTheme.label}</dd>
                        </div>
                      </dl>
                      <div className="backlink-panel">
                        <p className="eyebrow">Manuscript</p>
                        <div className="backlink-list">
                          {entityBacklinks.map((backlink) => (
                            <button
                              key={backlink.nodeId}
                              className="backlink-chip"
                              onClick={() => {
                                setSelectedSceneId(backlink.nodeId);
                                setActiveLens('Manuscript');
                              }}
                              type="button"
                            >
                              {backlink.chapterTitle ?? 'Chapter'} / {backlink.sceneTitle}
                            </button>
                          ))}
                          {!entityBacklinks.length ? <p className="empty">No scene mention</p> : null}
                        </div>
                      </div>
                      <div className="backlink-panel export-panel">
                        <p className="eyebrow">Export</p>
                        <button className="button ghost-button" onClick={() => void handleQueueExport('pdf_dossier')} type="button">
                          Export dossier
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="empty">Select entity</p>
                  )}
                </section>

                <section className="rail-block side-panel">
                  <p className="eyebrow">Theme</p>
                  <div className="theme-stack">
                    {THEME_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        aria-pressed={option.id === theme}
                        className={`theme-card${option.id === theme ? ' is-active' : ''}`}
                        onClick={() => setTheme(option.id)}
                        type="button"
                      >
                        <strong>{option.label}</strong>
                        <span>{option.summary}</span>
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rail-block side-panel">
                  <p className="eyebrow">Assets</p>
                  {selectedVisual ? (
                    <div className="asset-stack">
                      <img alt="WorldAltar logo" className="brand-logo" src={selectedVisual.logo.path} />
                      <div className="asset-meta">
                        <strong>{selectedVisual.coverMode === 'entity' ? 'Local cover' : 'Fallback cover'}</strong>
                        <span>{selectedVisual.coverPath}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="empty">Select entity</p>
                  )}
                </section>

                <section className="rail-block side-panel">
                  <p className="eyebrow">Export Queue</p>
                  <div className="export-job-list" aria-label="export queue">
                    {exportJobs.map((job) => (
                      <article key={job.id} className="export-job">
                        <strong>{job.kind}</strong>
                        <span>{job.status}</span>
                        <span>{job.targetPath}</span>
                      </article>
                    ))}
                    {!exportJobs.length ? <p className="empty">No export yet</p> : null}
                  </div>
                </section>
              </>
            ) : null}
          </aside>
        </section>

        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}

function getLensCopy(activeLens: ActiveLens) {
  if (activeLens === 'Map') {
    return 'Offline dunya katmani. Marker, focus, year sync.';
  }

  if (activeLens === 'Timeline') {
    return 'Secili yil gorunurlugu. Ayni veri, zaman ekseni sirasi.';
  }

  if (activeLens === 'Search') {
    return 'FTS arama lensi. Wiki ve map gecisine hazir.';
  }

  if (activeLens === 'Manuscript') {
    return 'Draft, split, book spread, print preview ayni scene govdesinden cikar.';
  }

  if (activeLens === 'Canvas') {
    return 'Relation board, family tree, event chain. Canonical kayittan turetilir.';
  }

  return 'Kart-first liste. Detail ve map ile bagli.';
}

function renderCardGrid(
  records: EntityRecord[],
  selectedEntityId: string | null,
  setSelectedEntityId: (id: string) => void,
  setHoveredEntityId: (id: string | null) => void
) {
  return (
    <section className="card-grid" role="list">
      {records.map((record) => {
        const visual = resolveEntityVisual(record);

        return (
          <button
            key={record.common.id}
            className={`wiki-card${record.common.id === selectedEntityId ? ' is-active' : ''}`}
            onFocus={() => setHoveredEntityId(record.common.id)}
            onMouseEnter={() => setHoveredEntityId(record.common.id)}
            onMouseLeave={() => setHoveredEntityId(null)}
            onClick={() => setSelectedEntityId(record.common.id)}
            role="listitem"
            type="button"
          >
            <div className={`card-cover card-cover-${record.type}`}>
              <img alt="" aria-hidden="true" className="card-image" src={visual.coverPath} />
              <div className="card-badge-row">
                <span className={`type-badge type-${record.type}`}>
                  <span className="type-icon" aria-hidden="true">
                    {TYPE_MONOGRAMS[record.type]}
                  </span>
                  {TYPE_LABELS[record.type]}
                </span>
              </div>
              <div className="placeholder-mark" aria-hidden="true">
                <span>{TYPE_MONOGRAMS[record.type]}</span>
              </div>
              <span className="card-year">
                {record.common.startYear ?? 'open'} - {record.common.endYear ?? 'open'}
              </span>
            </div>
            <div className="card-body">
              <strong>{record.common.title}</strong>
              <span>{record.common.summary || 'No summary'}</span>
            </div>
          </button>
        );
      })}
      {!records.length ? <p className="empty card-empty">No visible entity</p> : null}
    </section>
  );
}

type BookPage = {
  pageNumber: number;
  runningHead: string;
  trimLabel: string;
  chapterTitle: string;
  sceneTitle: string;
  isChapterBreak: boolean;
  lede: string | null;
  paragraphs: string[];
};

function buildBookPages(
  manuscriptTree: ManuscriptTreeItem[],
  sceneDetail: ManuscriptSceneDetail | null,
  sceneTitle: string,
  sceneSummary: string,
  sceneBody: string,
  printTrim: PrintTrim
) {
  const pages: BookPage[] = [];
  let pageNumber = 2;

  manuscriptTree.forEach((chapter) => {
    pages.push({
      pageNumber,
      runningHead: chapter.node.title.toUpperCase(),
      trimLabel: printTrim,
      chapterTitle: chapter.node.title,
      sceneTitle: chapter.children[0]?.title ?? chapter.node.title,
      isChapterBreak: true,
      lede: null,
      paragraphs: []
    });
    pageNumber += 1;

    chapter.children.forEach((scene) => {
      const isSelected = sceneDetail?.node.id === scene.id;
      const body = isSelected ? sceneBody : scene.body;
      const summary = isSelected ? sceneSummary : scene.summary;
      const title = isSelected ? sceneTitle : scene.title;
      const chunks = chunkText(body || summary || title, pageChunkSize(printTrim));

      chunks.forEach((chunk, index) => {
        pages.push({
          pageNumber,
          runningHead: index % 2 === 0 ? chapter.node.title : title,
          trimLabel: printTrim,
          chapterTitle: chapter.node.title,
          sceneTitle: title,
          isChapterBreak: false,
          lede: index === 0 ? summary || null : null,
          paragraphs: chunk
        });
        pageNumber += 1;
      });
    });
  });

  return pages.slice(0, 6);
}

function pageChunkSize(printTrim: PrintTrim) {
  if (printTrim === 'Royal') {
    return 4;
  }

  if (printTrim === 'Trade') {
    return 3;
  }

  return 2;
}

function chunkText(text: string, paragraphCount: number) {
  const normalized = (text || '').trim();
  const paragraphs = normalized
    ? normalized
        .split(/\n+/)
        .flatMap((part) => part.split(/(?<=[.!?])\s+/))
        .map((part) => part.trim())
        .filter(Boolean)
    : ['No manuscript body yet.'];

  const chunks: string[][] = [];
  for (let index = 0; index < paragraphs.length; index += paragraphCount) {
    chunks.push(paragraphs.slice(index, index + paragraphCount));
  }
  return chunks;
}

type TimelineBand = {
  label: string;
  items: EntityRecord[];
};

type CanvasNodeView = {
  id: string;
  label: string;
  meta: string;
  emphasis: boolean;
  entityId: string | null;
  sceneId: string | null;
};

type CanvasEdgeView = {
  id: string;
  from: string;
  label: string;
  to: string;
};

type CanvasBoardView = {
  id: string;
  nodes: CanvasNodeView[];
  edges: CanvasEdgeView[];
};

function buildTimelineBands(records: EntityRecord[]): TimelineBand[] {
  const bucket = new Map<string, EntityRecord[]>();

  records.forEach((record) => {
    const year = record.common.startYear ?? 0;
    const century = year <= 0 ? 'Open Range' : `${Math.floor(year / 100) * 100}s`;
    const current = bucket.get(century) ?? [];
    current.push(record);
    bucket.set(century, current);
  });

  return Array.from(bucket.entries()).map(([label, items]) => ({ label, items }));
}

function buildCanvasBoards(records: EntityRecord[], manuscriptTree: ManuscriptTreeItem[]): Record<CanvasView, CanvasBoardView> {
  const relationNodes = records.map((record) => ({
    id: record.common.id,
    label: record.common.title,
    meta: TYPE_LABELS[record.type],
    emphasis: record.type === 'event',
    entityId: record.common.id,
    sceneId: null
  }));

  const relationEdges: CanvasEdgeView[] = [];
  records.forEach((record) => {
    if (record.type === 'location' && record.fields.regionId) {
      relationEdges.push({
        id: `${record.common.id}-region`,
        from: record.common.title,
        label: 'located_in',
        to: record.fields.regionId
      });
    }
    if (record.type === 'event' && record.fields.locationId) {
      relationEdges.push({
        id: `${record.common.id}-location`,
        from: record.common.title,
        label: 'occurs_at',
        to: record.fields.locationId
      });
    }
  });

  const familyCharacters = records.filter(
    (record): record is Extract<EntityRecord, { type: 'character' }> => record.type === 'character'
  );
  const familyNodes = familyCharacters.map((record, index) => ({
    id: record.common.id,
    label: record.common.title,
    meta: record.fields.culture ?? 'Character',
    emphasis: index === 0,
    entityId: record.common.id,
    sceneId: null
  }));

  const eventNodes = manuscriptTree.flatMap((chapter) =>
    chapter.children.map((scene) => ({
      id: scene.id,
      label: scene.title,
      meta: chapter.node.title,
      emphasis: true,
      entityId: null,
      sceneId: scene.id
    }))
  );
  const eventEdges = eventNodes.slice(1).map((node, index) => ({
    id: `${eventNodes[index].id}-${node.id}`,
    from: eventNodes[index].label,
    label: 'next',
    to: node.label
  }));

  return {
    Relation: {
      id: 'relation-board',
      nodes: relationNodes,
      edges: relationEdges
    },
    Family: {
      id: 'family-tree',
      nodes: familyNodes,
      edges: familyNodes.slice(1).map((node, index) => ({
        id: `${familyNodes[index].id}-${node.id}`,
        from: familyNodes[index].label,
        label: 'lineage',
        to: node.label
      }))
    },
    Event: {
      id: 'event-chain',
      nodes: eventNodes,
      edges: eventEdges
    }
  };
}
