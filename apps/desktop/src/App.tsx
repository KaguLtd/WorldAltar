import { FormEvent, useEffect, useState } from 'react';
import {
  createDemoWorld,
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
import {
  DEFERRED_LENS_KEYS,
  DEFERRED_LENS_FLAGS,
  type DeferredLensFlag
} from './modules/features';
import {
  autosaveManuscriptScene,
  getManuscriptScene,
  listManuscriptBacklinks,
  listManuscriptTree,
  recoverManuscriptAutosave
} from './modules/manuscript/api';
import type {
  EntityBacklink,
  ManuscriptSceneDetail,
  ManuscriptTreeItem
} from './modules/manuscript/contracts';
import { listExportJobs, queueExport } from './modules/export/api';
import type { ExportJob, ExportKind } from './modules/export/contracts';
import { resolveEntityVisual } from './modules/assets/contracts';
import { THEME_OPTIONS } from './modules/theme/contracts';
import { useTheme } from './modules/theme/store';
import { CardGrid } from './ui/CardGrid';
import { CanvasLens } from './ui/CanvasLens';
import { EntityDetailPanel } from './ui/EntityDetailPanel';
import { ExportLens } from './ui/ExportLens';
import { LensRail } from './ui/LensRail';
import { ManuscriptLens } from './ui/ManuscriptLens';
import { RelationsLens } from './ui/RelationsLens';
import { TimelineLens } from './ui/TimelineLens';
import { YearDock } from './ui/YearDock';

const ACTIVE_PROJECT_KEY = 'worldaltar.activeProject';
const TYPE_OPTIONS: Array<EntityType | 'all'> = [
  'all',
  'character',
  'location',
  'region',
  'event'
];
const BASE_LENS_ITEMS = ['Wiki', 'Map', 'Timeline', 'Search'] as const;
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

export type ActiveLens =
  | (typeof BASE_LENS_ITEMS)[number]
  | 'Manuscript'
  | 'Canvas'
  | 'Export'
  | 'Relations';

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
  const [deferredLensFlags, setDeferredLensFlags] = useState<
    DeferredLensFlag[]
  >(() =>
    DEFERRED_LENS_FLAGS.map((flag) =>
      typeof window !== 'undefined'
        ? {
            ...flag,
            enabled:
              window.localStorage.getItem(DEFERRED_LENS_KEYS[flag.id]) ===
              'true'
          }
        : flag
    )
  );
  const [activeLens, setActiveLens] = useState<ActiveLens>('Wiki');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [project, setProject] = useState<WorldProject | null>(
    readActiveProject
  );
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
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [manuscriptTree, setManuscriptTree] = useState<ManuscriptTreeItem[]>(
    []
  );
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] =
    useState<ManuscriptSceneDetail | null>(null);
  const [backlinks, setBacklinks] = useState<EntityBacklink[]>([]);
  const [draftSceneTitle, setDraftSceneTitle] = useState('');
  const [draftSceneSummary, setDraftSceneSummary] = useState('');
  const [draftSceneBody, setDraftSceneBody] = useState('');
  const [manuscriptDirty, setManuscriptDirty] = useState(false);
  const [manuscriptStatus, setManuscriptStatus] = useState('Deferred off');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [exportStatus, setExportStatus] = useState('Deferred off');
  const databasePath = project?.databasePath ?? null;
  const manuscriptEnabled = isDeferredLensEnabled(
    deferredLensFlags,
    'manuscript'
  );
  const canvasEnabled = isDeferredLensEnabled(deferredLensFlags, 'canvas');
  const exportEnabled = isDeferredLensEnabled(deferredLensFlags, 'export');
  const relationsEnabled = isDeferredLensEnabled(
    deferredLensFlags,
    'relations'
  );
  const lensItems: ActiveLens[] = [...BASE_LENS_ITEMS];

  if (manuscriptEnabled) {
    lensItems.push('Manuscript');
  }

  if (canvasEnabled) {
    lensItems.push('Canvas');
  }

  if (exportEnabled) {
    lensItems.push('Export');
  }

  if (relationsEnabled) {
    lensItems.push('Relations');
  }

  const enabledDeferredLabels = deferredLensFlags
    .filter((flag) => flag.enabled)
    .map((flag) => flag.label);
  const optionalLensState = enabledDeferredLabels.length
    ? `Deferred on: ${enabledDeferredLabels.join(', ')}`
    : 'Deferred lenses flagged off';

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
    const activeBaseLens =
      activeLens === 'Wiki' ||
      activeLens === 'Map' ||
      activeLens === 'Timeline' ||
      activeLens === 'Search';
    const activeDeferredVisible =
      (activeLens === 'Manuscript' && manuscriptEnabled) ||
      (activeLens === 'Canvas' && canvasEnabled) ||
      (activeLens === 'Export' && exportEnabled) ||
      (activeLens === 'Relations' && relationsEnabled);

    if (!activeBaseLens && !activeDeferredVisible) {
      setActiveLens('Wiki');
    }
  }, [
    activeLens,
    canvasEnabled,
    exportEnabled,
    manuscriptEnabled,
    relationsEnabled
  ]);

  useEffect(() => {
    if (!databasePath) {
      return;
    }

    setIsBootstrappingProject(true);
    setError('');

    recoverAutosave(databasePath)
      .then((entityReport) => {
        if (
          entityReport.recoveredCount > 0 ||
          entityReport.conflictedCount > 0 ||
          entityReport.discardedCount > 0
        ) {
          setAutosaveState(
            `Recovered ${entityReport.recoveredCount} / Conflicts ${entityReport.conflictedCount} / Dropped ${entityReport.discardedCount}`
          );
        }
      })
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsBootstrappingProject(false));
  }, [databasePath]);

  useEffect(() => {
    if (!databasePath) {
      return;
    }

    setIsRefreshingEntities(true);
    setError('');

    listEntities(databasePath, year)
      .then(setRecords)
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsRefreshingEntities(false));
  }, [databasePath, year]);

  useEffect(() => {
    if (!databasePath || !query.trim()) {
      setSearchIds(null);
      return;
    }

    searchEntities(
      databasePath,
      query,
      year,
      typeFilter === 'all' ? null : typeFilter
    )
      .then((hits) => setSearchIds(hits.map((hit) => hit.id)))
      .catch((value: unknown) => setError(String(value)));
  }, [databasePath, query, year, typeFilter]);

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || activeLens !== 'Manuscript') {
      return;
    }

    setManuscriptStatus('Loading manuscript');
    recoverManuscriptAutosave(databasePath)
      .then(() => listManuscriptTree(databasePath))
      .then((tree) => {
        setManuscriptTree(tree);
        setSelectedSceneId(
          (current) => current ?? tree[0]?.children[0]?.id ?? null
        );
        setManuscriptStatus(
          tree.length ? 'Manuscript ready' : 'Manuscript empty'
        );
      })
      .catch((value: unknown) => {
        setManuscriptStatus('Manuscript failed');
        setError(String(value));
      });
  }, [activeLens, databasePath, manuscriptEnabled]);

  useEffect(() => {
    if (!databasePath || !exportEnabled || activeLens !== 'Export') {
      return;
    }

    setExportStatus('Loading export queue');
    listExportJobs(databasePath)
      .then((jobs) => {
        setExportJobs(jobs);
        setExportStatus(
          jobs.length ? 'Export queue ready' : 'Export queue empty'
        );
      })
      .catch((value: unknown) => {
        setExportStatus('Export failed');
        setError(String(value));
      });
  }, [activeLens, databasePath, exportEnabled]);

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || activeLens !== 'Manuscript') {
      return;
    }

    if (!selectedSceneId) {
      setSelectedScene(null);
      return;
    }

    getManuscriptScene(databasePath, selectedSceneId)
      .then((scene) => setSelectedScene(scene))
      .catch((value: unknown) => setError(String(value)));
  }, [activeLens, databasePath, manuscriptEnabled, selectedSceneId]);

  useEffect(() => {
    if (!selectedScene) {
      setDraftSceneTitle('');
      setDraftSceneSummary('');
      setDraftSceneBody('');
      setManuscriptDirty(false);
      return;
    }

    setDraftSceneTitle(selectedScene.node.title);
    setDraftSceneSummary(selectedScene.node.summary);
    setDraftSceneBody(selectedScene.node.body);
    setManuscriptDirty(false);
  }, [selectedScene]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    setManuscriptDirty(
      draftSceneTitle !== selectedScene.node.title ||
        draftSceneSummary !== selectedScene.node.summary ||
        draftSceneBody !== selectedScene.node.body
    );
  }, [draftSceneBody, draftSceneSummary, draftSceneTitle, selectedScene]);

  useEffect(() => {
    if (
      !databasePath ||
      !manuscriptEnabled ||
      activeLens !== 'Manuscript' ||
      !selectedScene ||
      !manuscriptDirty
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setManuscriptStatus('Saving manuscript');
      autosaveManuscriptScene(databasePath, {
        id: selectedScene.node.id,
        title: draftSceneTitle,
        summary: draftSceneSummary,
        body: draftSceneBody,
        mentions: selectedScene.mentions.map((mention) => ({
          entityId: mention.entityId,
          label: mention.label,
          startOffset: mention.startOffset,
          endOffset: mention.endOffset
        }))
      })
        .then((updated) => {
          setSelectedScene(updated);
          setManuscriptTree((current) =>
            current.map((chapter) => ({
              ...chapter,
              children: chapter.children.map((sceneNode) =>
                sceneNode.id === updated.node.id
                  ? {
                      ...sceneNode,
                      title: updated.node.title,
                      summary: updated.node.summary,
                      body: updated.node.body,
                      updatedAt: updated.node.updatedAt
                    }
                  : sceneNode
              )
            }))
          );
          setManuscriptStatus(`Saved manuscript ${updated.node.updatedAt}`);
          setManuscriptDirty(false);
        })
        .catch((value: unknown) => {
          setManuscriptStatus('Manuscript save failed');
          setError(String(value));
        });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [
    activeLens,
    databasePath,
    draftSceneBody,
    draftSceneSummary,
    draftSceneTitle,
    manuscriptDirty,
    manuscriptEnabled,
    selectedScene
  ]);

  let filteredRecords = records;

  if (typeFilter !== 'all') {
    filteredRecords = filteredRecords.filter(
      (record) => record.type === typeFilter
    );
  }

  if (searchIds) {
    filteredRecords = filteredRecords.filter((record) =>
      searchIds.includes(record.common.id)
    );
  }

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedEntityId(null);
      return;
    }

    if (
      !filteredRecords.some((record) => record.common.id === selectedEntityId)
    ) {
      setSelectedEntityId(filteredRecords[0].common.id);
    }
  }, [filteredRecords, selectedEntityId]);

  const selectedEntity =
    filteredRecords.find((record) => record.common.id === selectedEntityId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;
  const selectedVisual = selectedEntity
    ? resolveEntityVisual(selectedEntity)
    : null;
  const currentTheme =
    THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];
  const timelineRecords = [...filteredRecords].sort(
    (left, right) =>
      (left.common.startYear ?? year) - (right.common.startYear ?? year)
  );
  const searchRecords = query.trim() ? filteredRecords : [];
  const hoveredEntity =
    filteredRecords.find((record) => record.common.id === hoveredEntityId) ??
    records.find((record) => record.common.id === hoveredEntityId) ??
    null;

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || !selectedEntity) {
      setBacklinks([]);
      return;
    }

    listManuscriptBacklinks(databasePath, selectedEntity.common.id)
      .then(setBacklinks)
      .catch((value: unknown) => setError(String(value)));
  }, [databasePath, manuscriptEnabled, selectedEntity]);

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
  }, [selectedEntity]);

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
            current.map((record) =>
              record.common.id === updated.common.id ? updated : record
            )
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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await handleCreateWorld(false);
  }

  async function handleCreateDemoWorld() {
    await handleCreateWorld(true);
  }

  async function handleCreateWorld(seedDemo: boolean) {
    setBusy(true);
    setError('');

    try {
      const nextProject = seedDemo
        ? await createDemoWorld(title)
        : await createWorld(title);
      setProject(nextProject);
      setSelectedEntityId(null);
      setTitle('');
      setStatus(await getBootstrapStatus());
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  function handleDeferredLensToggle(id: DeferredLensFlag['id']) {
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

  function handleOpenBacklink(nodeId: string) {
    if (!manuscriptEnabled) {
      return;
    }

    setActiveLens('Manuscript');
    setSelectedSceneId(nodeId);
  }

  function handleMentionSelect(entityId: string) {
    setActiveLens('Wiki');
    setSelectedEntityId(entityId);
  }

  async function handleQueueExport(kind: ExportKind) {
    if (!databasePath || !exportEnabled) {
      return;
    }

    setExportStatus(`Queue ${kind}`);

    try {
      const job = await queueExport(databasePath, { kind });
      setExportJobs((current) => [job, ...current]);
      setExportStatus(`Queued ${job.kind}`);
    } catch (value) {
      setExportStatus('Export failed');
      setError(String(value));
    }
  }

  return (
    <main className="app-shell" data-theme={theme}>
      <section className="shell">
        <header className="command-bar">
          <div>
            <p className="eyebrow">WorldAltar</p>
            <h1>Dar MVP shell.</h1>
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
            <span className="command-chip">
              {isBootstrappingProject ? 'Startup sync' : 'Startup ready'}
            </span>
            <span className="command-chip">{optionalLensState}</span>
            <span className="command-chip">Year {year}</span>
            <span className={`command-chip${dirty ? ' is-dirty' : ''}`}>
              {dirty ? 'Dirty' : autosaveState}
            </span>
          </div>
        </header>

        <section className="shell-grid">
          <LensRail
            activeLens={activeLens}
            busy={busy}
            deferredLensFlags={deferredLensFlags}
            lensItems={lensItems}
            onDeferredLensToggle={handleDeferredLensToggle}
            onLensChange={setActiveLens}
            onCreateDemoWorld={handleCreateDemoWorld}
            onSubmit={handleSubmit}
            setTitle={setTitle}
            status={status}
            title={title}
          />

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
                    onChange={(event) =>
                      setTypeFilter(event.target.value as EntityType | 'all')
                    }
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
                    <TimelineLens
                      isRefreshingEntities={isRefreshingEntities}
                      records={timelineRecords}
                      selectedEntityId={selectedEntityId}
                      setSelectedEntityId={setSelectedEntityId}
                      typeLabels={TYPE_LABELS}
                    />
                  ) : null}

                  {activeLens === 'Wiki' ? (
                    <CardGrid
                      records={filteredRecords}
                      selectedEntityId={selectedEntityId}
                      setHoveredEntityId={setHoveredEntityId}
                      setSelectedEntityId={setSelectedEntityId}
                      typeLabels={TYPE_LABELS}
                      typeMonograms={TYPE_MONOGRAMS}
                    />
                  ) : null}

                  {activeLens === 'Search' ? (
                    query.trim() ? (
                      <CardGrid
                        records={searchRecords}
                        selectedEntityId={selectedEntityId}
                        setHoveredEntityId={setHoveredEntityId}
                        setSelectedEntityId={setSelectedEntityId}
                        typeLabels={TYPE_LABELS}
                        typeMonograms={TYPE_MONOGRAMS}
                      />
                    ) : (
                      <section className="empty-stage lens-empty">
                        <p className="eyebrow">Search</p>
                        <h2>Type query.</h2>
                        <p className="copy">
                          FTS lens acik. Wiki ve map ile ayni visible set
                          kullanir.
                        </p>
                      </section>
                    )
                  ) : null}

                  {activeLens === 'Manuscript' && manuscriptEnabled ? (
                    <ManuscriptLens
                      draftBody={draftSceneBody}
                      draftSummary={draftSceneSummary}
                      draftTitle={draftSceneTitle}
                      dirty={manuscriptDirty}
                      onMentionSelect={handleMentionSelect}
                      onDraftBodyChange={setDraftSceneBody}
                      onDraftSummaryChange={setDraftSceneSummary}
                      onDraftTitleChange={setDraftSceneTitle}
                      scene={selectedScene}
                      selectedSceneId={selectedSceneId}
                      setSelectedSceneId={setSelectedSceneId}
                      status={manuscriptStatus}
                      tree={manuscriptTree}
                    />
                  ) : null}

                  {activeLens === 'Canvas' && canvasEnabled ? (
                    <CanvasLens
                      records={filteredRecords}
                      selectedEntityId={selectedEntityId}
                      setSelectedEntityId={setSelectedEntityId}
                      typeLabels={TYPE_LABELS}
                      year={year}
                    />
                  ) : null}

                  {activeLens === 'Export' && exportEnabled ? (
                    <ExportLens
                      jobs={exportJobs}
                      onQueue={handleQueueExport}
                      status={exportStatus}
                    />
                  ) : null}

                  {activeLens === 'Relations' && relationsEnabled ? (
                    <RelationsLens
                      backlinks={backlinks}
                      onOpenBacklink={handleOpenBacklink}
                      selectedEntity={selectedEntity}
                    />
                  ) : null}
                </section>

                {(activeLens === 'Wiki' || activeLens === 'Search') &&
                hoveredEntity ? (
                  <aside className="hover-preview" aria-label="hover preview">
                    <img
                      alt={`${hoveredEntity.common.title} preview`}
                      className="hover-preview-image"
                      src={resolveEntityVisual(hoveredEntity).coverPath}
                    />
                    <div className="hover-preview-body">
                      <span className={`type-badge type-${hoveredEntity.type}`}>
                        {TYPE_LABELS[hoveredEntity.type]}
                      </span>
                      <strong>{hoveredEntity.common.title}</strong>
                      <span>
                        {hoveredEntity.common.summary || 'No summary'}
                      </span>
                      <div className="hover-actions">
                        <button
                          className="button ghost-button"
                          onClick={() => setActiveLens('Map')}
                          type="button"
                        >
                          Open map
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
                <p className="copy">
                  Normal world bos baslar. Demo world sample veri ile gelir.
                </p>
              </section>
            )}
          </section>

          <aside className="context-panel">
            <YearDock year={year} setYear={setYear} />
            {project ? (
              <>
                <EntityDetailPanel
                  backlinks={backlinks}
                  currentThemeLabel={currentTheme.label}
                  draftBody={draftBody}
                  draftSummary={draftSummary}
                  draftTitle={draftTitle}
                  onOpenBacklink={handleOpenBacklink}
                  selectedEntity={selectedEntity}
                  selectedVisual={selectedVisual}
                  setDraftBody={setDraftBody}
                  setDraftSummary={setDraftSummary}
                  setDraftTitle={setDraftTitle}
                  typeLabels={TYPE_LABELS}
                  typeMonograms={TYPE_MONOGRAMS}
                />

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
                      <img
                        alt="WorldAltar logo"
                        className="brand-logo"
                        src={selectedVisual.logo.path}
                      />
                      <div className="asset-meta">
                        <strong>
                          {selectedVisual.coverMode === 'entity'
                            ? 'Local cover'
                            : 'Fallback cover'}
                        </strong>
                        <span>{selectedVisual.coverPath}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="empty">Select entity</p>
                  )}
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

  if (activeLens === 'Canvas') {
    return 'Deferred board. Visible set uzerinden local derive.';
  }

  if (activeLens === 'Export') {
    return 'Deferred queue. Core boot disi, explicit run.';
  }

  if (activeLens === 'Relations') {
    return 'Stable-id reference seam. Canonical data disina cikmaz.';
  }

  if (activeLens === 'Timeline') {
    return 'Secili yil gorunurlugu. Ayni veri, zaman ekseni sirasi.';
  }

  if (activeLens === 'Search') {
    return 'FTS arama lensi. Wiki ve map gecisine hazir.';
  }

  return 'Kart-first liste. Detail ve map ile bagli.';
}

function isDeferredLensEnabled(
  flags: DeferredLensFlag[],
  id: DeferredLensFlag['id']
) {
  return flags.find((flag) => flag.id === id)?.enabled ?? false;
}
