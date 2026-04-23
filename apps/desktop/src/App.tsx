import { FormEvent, useEffect, useState } from 'react';
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
import { CardGrid } from './ui/CardGrid';
import { EntityDetailPanel } from './ui/EntityDetailPanel';
import { LensRail } from './ui/LensRail';
import { TimelineLens } from './ui/TimelineLens';
import { YearDock } from './ui/YearDock';

const ACTIVE_PROJECT_KEY = 'worldaltar.activeProject';
const TYPE_OPTIONS: Array<EntityType | 'all'> = ['all', 'character', 'location', 'region', 'event'];
const LENS_ITEMS = ['Wiki', 'Map', 'Timeline', 'Search'] as const;
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

export type ActiveLens = (typeof LENS_ITEMS)[number];

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
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const [optionalLensState] = useState('Deferred lenses parked');

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

    recoverAutosave(project.databasePath)
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

    searchEntities(project.databasePath, query, year, typeFilter === 'all' ? null : typeFilter)
      .then((hits) => setSearchIds(hits.map((hit) => hit.id)))
      .catch((value: unknown) => setError(String(value)));
  }, [project, query, year, typeFilter]);

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const nextProject = await createWorld(title);
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
            <span className="command-chip">{isBootstrappingProject ? 'Startup sync' : 'Startup ready'}</span>
            <span className="command-chip">{optionalLensState}</span>
            <span className="command-chip">Year {year}</span>
            <span className={`command-chip${dirty ? ' is-dirty' : ''}`}>{dirty ? 'Dirty' : autosaveState}</span>
          </div>
        </header>

        <section className="shell-grid">
          <LensRail
            activeLens={activeLens}
            busy={busy}
            lensItems={LENS_ITEMS}
            onLensChange={setActiveLens}
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
                        <p className="copy">FTS lens acik. Wiki ve map ile ayni visible set kullanir.</p>
                      </section>
                    )
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
            <YearDock year={year} setYear={setYear} />
            {project ? (
              <>
                <EntityDetailPanel
                  currentThemeLabel={currentTheme.label}
                  draftBody={draftBody}
                  draftSummary={draftSummary}
                  draftTitle={draftTitle}
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

  return 'Kart-first liste. Detail ve map ile bagli.';
}
