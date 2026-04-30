import { FormEvent, useEffect, useState } from 'react';
import {
  createDemoWorld,
  createWorld,
  getBootstrapStatus,
  type BootstrapStatus
} from './modules/projects/api';
import { useTimelineYear } from './modules/timeline/store';
import type { EntityRecord, EntityType } from './modules/entity-model/types';
import {
} from './modules/entity-model/api';
import { createManuscriptChapter, createManuscriptScene } from './modules/manuscript/api';
import { queueExport } from './modules/export/api';
import type { ExportKind } from './modules/export/contracts';
import { resolveEntityVisual } from './modules/assets/contracts';
import { THEME_OPTIONS } from './modules/theme/contracts';
import { useTheme } from './modules/theme/store';
import { EntityDetailPanel } from './ui/EntityDetailPanel';
import { LensRail } from './ui/LensRail';
import { YearDock } from './ui/YearDock';
import { AppShell } from './ui/shell/AppShell';
import { AppSidebar } from './ui/shell/AppSidebar';
import { AppTopbar } from './ui/shell/AppTopbar';
import { DetailRail } from './ui/shell/DetailRail';
import { HoverPreview } from './ui/shell/HoverPreview';
import { MainWorkspace } from './ui/shell/MainWorkspace';
import { WorkspaceChrome } from './ui/shell/WorkspaceChrome';
import { WorkspaceStage } from './ui/shell/WorkspaceStage';
import { useDeferredLensFlags } from './hooks/useDeferredLensFlags';
import { useEntityActions } from './hooks/useEntityActions';
import { useEntityDraft } from './hooks/useEntityDraft';
import { useEntityWorkspace } from './hooks/useEntityWorkspace';
import { useExportWorkspace } from './hooks/useExportWorkspace';
import { useManuscriptBacklinks } from './hooks/useManuscriptBacklinks';
import { useManuscriptWorkspace } from './hooks/useManuscriptWorkspace';
import { useStartupRecovery } from './hooks/useStartupRecovery';
import { useStoredProject } from './hooks/useStoredProject';

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

export function App() {
  const {
    deferredLensFlags,
    enabledDeferredLabels,
    isDeferredLensEnabled: isDeferredLensFlagEnabled,
    toggleDeferredLensFlag
  } = useDeferredLensFlags();
  const [activeLens, setActiveLens] = useState<ActiveLens>('Wiki');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<BootstrapStatus | null>(null);
  const [project, setProject] = useStoredProject(ACTIVE_PROJECT_KEY);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [year, setYear] = useTimelineYear();
  const [theme, setTheme] = useTheme();
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const databasePath = project?.databasePath ?? null;
  const manuscriptEnabled = isDeferredLensFlagEnabled('manuscript');
  const canvasEnabled = isDeferredLensFlagEnabled('canvas');
  const exportEnabled = isDeferredLensFlagEnabled('export');
  const relationsEnabled = isDeferredLensFlagEnabled('relations');
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

  const optionalLensState = enabledDeferredLabels.length
    ? `Deferred on: ${enabledDeferredLabels.join(', ')}`
    : 'Deferred lenses flagged off';
  const { isBootstrappingProject, recoveryState } = useStartupRecovery({
    databasePath,
    setError
  });
  const {
    filteredRecords,
    isRefreshingEntities,
    mentionOptions,
    query,
    records,
    searchRecords,
    selectedEntity,
    selectedEntityId,
    setQuery,
    setRecords,
    setSelectedEntityId,
    setTypeFilter,
    timelineRecords,
    typeFilter
  } = useEntityWorkspace({
    databasePath,
    setError,
    year
  });
  const backlinks = useManuscriptBacklinks({
    databasePath,
    manuscriptEnabled,
    selectedEntity,
    setError
  });
  const {
    draftSceneBody,
    draftSceneSelectionEnd,
    draftSceneSelectionStart,
    draftSceneSummary,
    draftSceneTitle,
    manuscriptDirty,
    manuscriptStatus,
    manuscriptTree,
    selectedScene,
    selectedSceneId,
    setDraftSceneBody,
    setDraftSceneSelectionEnd,
    setDraftSceneSelectionStart,
    setDraftSceneSummary,
    setDraftSceneTitle,
    setManuscriptStatus,
    setManuscriptTree,
    setSelectedScene,
    setSelectedSceneId
  } = useManuscriptWorkspace({
    activeLens,
    databasePath,
    manuscriptEnabled,
    setError
  });
  const { exportJobs, exportStatus, setExportJobs, setExportStatus } =
    useExportWorkspace({
      activeLens,
      databasePath,
      exportEnabled,
      setError
    });

  useEffect(() => {
    getBootstrapStatus()
      .then(setStatus)
      .catch((value: unknown) => setError(String(value)));
  }, []);

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

  const selectedVisual = selectedEntity
    ? resolveEntityVisual(selectedEntity)
    : null;
  const currentTheme =
    THEME_OPTIONS.find((option) => option.id === theme) ?? THEME_OPTIONS[0];
  const {
    autosaveState,
    draftAssetSourcePath,
    draftBody,
    draftCoverImagePath,
    draftLinkTargetId,
    draftSummary,
    draftThumbnailPath,
    draftTitle,
    dirty,
    setDraftAssetSourcePath,
    setDraftBody,
    setDraftCoverImagePath,
    setDraftLinkTargetId,
    setDraftSummary,
    setDraftThumbnailPath,
    setDraftTitle
  } = useEntityDraft({
    project,
    selectedEntity,
    setError,
    setRecords
  });
  const {
    handleCreateEntity,
    handleCreateLinkedEntity,
    handleImportEntityMedia,
    handlePresetEntityMedia,
    handleSaveEntityLinks,
    handleSaveEntityMedia
  } = useEntityActions({
    databasePath,
    draftAssetSourcePath,
    draftCoverImagePath,
    draftLinkTargetId,
    draftThumbnailPath,
    selectedEntity,
    setBusy,
    setDraftCoverImagePath,
    setDraftThumbnailPath,
    setError,
    setQuery,
    setRecords,
    setSelectedEntityId,
    setTypeFilter
  });
  const shellFolio = [
    `World ${project?.slug ?? 'none'}`,
    `Lens ${activeLens}`,
    `Focus ${selectedEntity?.common.title ?? 'none'}`,
    `Theme ${currentTheme.label}`,
    enabledDeferredLabels.length
      ? `Deferred ${enabledDeferredLabels.length}`
      : 'Deferred core only'
  ];
  const workspaceFolio = [
    `Project ${project?.slug ?? 'none'}`,
    `Visible ${filteredRecords.length}`,
    `Type ${selectedEntity ? TYPE_LABELS[selectedEntity.type] : 'None'}`,
    `Year ${year}`,
    `Theme ${currentTheme.label}`
  ];
  const workspaceCollector = [
    `Characters ${filteredRecords.filter((record) => record.type === 'character').length}`,
    `Regions ${filteredRecords.filter((record) => record.type === 'region').length}`,
    `Events ${filteredRecords.filter((record) => record.type === 'event').length}`,
    `Places ${filteredRecords.filter((record) => record.type === 'location').length}`,
    `Focus ${selectedEntity ? 'tracked' : 'open'}`
  ];
  const workspaceProvenance = [
    `Slug ${project?.slug ?? 'none'}`,
    `DB ${project ? 'ready' : 'missing'}`,
    `Selected ${selectedEntity ? TYPE_LABELS[selectedEntity.type] : 'None'}`,
    `Autosave ${dirty ? 'dirty' : 'steady'}`
  ];
  const workspaceSpotlight = [
    `Lens ${activeLens}`,
    selectedEntity?.common.title ?? 'No focus selected',
    `${filteredRecords.length} visible records`,
    getLensCopy(activeLens)
  ];
  const workspaceMood = [
    `Mode ${activeLens}`,
    activeLens === 'Wiki'
      ? 'Curate canon'
      : activeLens === 'Map'
        ? 'Trace geography'
        : activeLens === 'Timeline'
          ? 'Read chronology'
          : activeLens === 'Search'
            ? 'Scan recall'
            : activeLens === 'Manuscript'
              ? 'Shape scenes'
              : activeLens === 'Canvas'
                ? 'Arrange relations'
                : activeLens === 'Export'
                  ? 'Package delivery'
                  : 'Group references',
    selectedEntity ? `Focus ${TYPE_LABELS[selectedEntity.type]}` : 'Focus open'
  ];
  const workspaceEditorial = [
    `Focus ${selectedEntity?.common.title ?? 'Open desk'}`,
    selectedEntity
      ? `${TYPE_LABELS[selectedEntity.type]} ${selectedEntity.common.startYear ?? year}`
      : `Year ${year}`,
    selectedVisual?.coverMode === 'entity' ? 'Cover linked' : 'Cover fallback',
    enabledDeferredLabels.length
      ? `Deferred ${enabledDeferredLabels.join(' / ')}`
      : 'Deferred core'
  ];
  const workspaceCurationRail = [
    `Lens ${activeLens}`,
    selectedEntity ? `Anchor ${TYPE_LABELS[selectedEntity.type]}` : 'Anchor open',
    filteredRecords.length > 0 ? `Shelf ${filteredRecords.length}` : 'Shelf empty',
    query.trim() ? `Query ${query.trim()}` : 'Query clear'
  ];
  const workspaceStateBoard = [
    isBootstrappingProject ? 'Startup sync' : 'Startup ready',
    dirty ? 'Draft dirty' : 'Draft steady',
    typeFilter === 'all' ? 'Filter all' : `Filter ${typeFilter}`,
    query.trim() ? 'Search active' : 'Search idle'
  ];
  const workspaceShellDigest = [
    `Shell ${activeLens}`,
    project ? 'World mounted' : 'World idle',
    selectedEntity ? 'Focus locked' : 'Focus roaming',
    enabledDeferredLabels.length ? 'Deferred live' : 'Deferred core'
  ];
  const workspaceSessionStrip = [
    `Session ${currentTheme.label}`,
    `Year ${year}`,
    `${filteredRecords.length} records`,
    dirty ? 'Autosave pending' : 'Autosave ready'
  ];
  const workspaceDeskAtlas = [
    `Atlas ${activeLens}`,
    selectedEntity ? `Focus ${selectedEntity.common.title}` : 'Focus open',
    typeFilter === 'all' ? 'All shelves' : `${typeFilter} shelf`,
    dirty ? 'Draft in motion' : 'Draft settled'
  ];
  const topbarAutosaveState =
    autosaveState !== 'Idle' ? autosaveState : recoveryState || autosaveState;
  const timelineContext = selectedScene
    ? [...new Set(selectedScene.mentions.map((mention) => mention.entityId))]
        .map((entityId) =>
          records.find((record) => record.common.id === entityId) ?? null
        )
        .filter((record): record is EntityRecord => record !== null)
    : [];
  const hoveredEntity =
    filteredRecords.find((record) => record.common.id === hoveredEntityId) ??
    records.find((record) => record.common.id === hoveredEntityId) ??
    null;
  const regionOptions = records.filter(
    (record) =>
      record.type === 'region' &&
      record.common.id !== selectedEntity?.common.id
  );
  const locationOptions = records.filter((record) => record.type === 'location');

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

  function handleOpenBacklink(nodeId: string) {
    if (!manuscriptEnabled) {
      return;
    }

    setActiveLens('Manuscript');
    setSelectedSceneId(nodeId);
  }

  function handleOpenSceneContext() {
    if (relationsEnabled) {
      setActiveLens('Relations');
      return;
    }

    if (manuscriptEnabled && backlinks[0]) {
      handleOpenBacklink(backlinks[0].nodeId);
    }
  }

  async function handleCreateSceneFromEntity(backlinkNodeId?: string) {
    if (!databasePath || !manuscriptEnabled || !selectedEntity) {
      return;
    }

    const continuityBacklink = backlinkNodeId
      ? backlinks.find((backlink) => backlink.nodeId === backlinkNodeId) ?? null
      : null;

    let chapterId =
      (continuityBacklink
        ? manuscriptTree.find(
            (chapter) => chapter.node.id === continuityBacklink.chapterId
          )?.node.id
        : null) ??
      manuscriptTree.find((chapter) =>
        chapter.children.some((sceneNode) => sceneNode.id === selectedSceneId)
      )?.node.id ??
      manuscriptTree[0]?.node.id ??
      null;

    setBusy(true);
    setError('');

    try {
      if (!chapterId) {
        const chapter = await createManuscriptChapter(databasePath, {
          title: 'World notes'
        });
        setManuscriptTree((current) => [...current, { node: chapter, children: [] }]);
        chapterId = chapter.id;
      }

      await handleCreateManuscriptScene({
        chapterId,
        title: continuityBacklink
          ? `${selectedEntity.common.title} after ${continuityBacklink.sceneTitle}`
          : `${selectedEntity.common.title} note`,
        summary: continuityBacklink
          ? `Continue the thread after ${continuityBacklink.sceneTitle}.`
          : `Scene seeded from ${selectedEntity.common.title}`,
        body: continuityBacklink
          ? `${selectedEntity.common.title}\n\nPrevious scene: ${continuityBacklink.sceneTitle}\nChapter anchor: ${continuityBacklink.chapterTitle}\nCarry-over tension:\nWhat changes now:\nNext irreversible beat:`
          : `${selectedEntity.common.title}\n\nWrite the immediate scene pressure here.`,
        seedEntityId: selectedEntity.common.id
      });
      setActiveLens('Manuscript');
    } finally {
      setBusy(false);
    }
  }

  function handleMentionSelect(entityId: string) {
    setActiveLens('Wiki');
    setSelectedEntityId(entityId);
  }

  function handleInsertSceneMention(entityId?: string) {
    if (!selectedScene) {
      return;
    }

    const mentionEntity = entityId
      ? records.find((record) => record.common.id === entityId) ?? null
      : selectedEntity;

    if (!mentionEntity) {
      return;
    }

    const label = mentionEntity.common.title;
    const rawStart = draftSceneSelectionStart ?? draftSceneBody.length;
    const rawEnd = draftSceneSelectionEnd ?? rawStart;
    const selectionStart = Math.min(rawStart, rawEnd);
    const selectionEnd = Math.max(rawStart, rawEnd);
    const prefix = draftSceneBody.slice(0, selectionStart);
    const suffix = draftSceneBody.slice(selectionEnd);
    const leftSpacer =
      prefix && !/\s$/.test(prefix) ? ' ' : '';
    const rightSpacer =
      suffix && !/^\s/.test(suffix) ? ' ' : '';
    const insertion = `${leftSpacer}${label}${rightSpacer}`;
    const nextBody = `${prefix}${insertion}${suffix}`;
    const startOffset = selectionStart + leftSpacer.length;
    const nextMentionCount =
      selectedScene.mentions.filter(
        (mention) => mention.entityId === mentionEntity.common.id
      ).length + 1;

    setDraftSceneBody(nextBody);
    setSelectedScene((current) =>
      current
        ? {
            ...current,
            mentions: current.mentions.concat({
              id: `draft_${mentionEntity.common.id}_${nextMentionCount}`,
              nodeId: current.node.id,
              entityId: mentionEntity.common.id,
              label,
              startOffset,
              endOffset: startOffset + label.length
            })
          }
        : current
    );
    setManuscriptStatus(`Mention staged ${label}`);
    setDraftSceneSelectionStart(startOffset + label.length + rightSpacer.length);
    setDraftSceneSelectionEnd(startOffset + label.length + rightSpacer.length);
  }

  function handleQuickJump(lens: ActiveLens) {
    setActiveLens(lens);
  }

  function handleMapJump(lens: 'Wiki' | 'Timeline', entityId: string) {
    setSelectedEntityId(entityId);
    setActiveLens(lens);
  }

  function handleTimelineEntityJump(entityId: string) {
    setSelectedEntityId(entityId);
    setActiveLens('Timeline');
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

  async function handleCreateManuscriptChapter(title: string) {
    if (!databasePath || !manuscriptEnabled) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const chapter = await createManuscriptChapter(databasePath, { title });
      setManuscriptTree((current) => [...current, { node: chapter, children: [] }]);
      setSelectedSceneId(null);
      setManuscriptStatus('Chapter created');
    } catch (value) {
      setManuscriptStatus('Chapter create failed');
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateManuscriptScene(input: {
    chapterId: string;
    title: string;
    summary?: string;
    body?: string;
    seedEntityId?: string;
  }) {
    if (!databasePath || !manuscriptEnabled) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const seedMention =
        input.seedEntityId
          ? records.find((record) => record.common.id === input.seedEntityId) ?? null
          : null;
      const scene = await createManuscriptScene(databasePath, {
        chapterId: input.chapterId,
        title: input.title,
        summary: input.summary,
        body: input.body,
        mentions: seedMention
          ? [
              {
                entityId: seedMention.common.id,
                label: seedMention.common.title,
                startOffset: 0,
                endOffset: seedMention.common.title.length
              }
            ]
          : []
      });
      setManuscriptTree((current) =>
        current.map((chapter) =>
          chapter.node.id === input.chapterId
            ? { ...chapter, children: [...chapter.children, scene.node] }
            : chapter
        )
      );
      setSelectedSceneId(scene.node.id);
      setSelectedScene(scene);
      setManuscriptStatus('Scene created');
    } catch (value) {
      setManuscriptStatus('Scene create failed');
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell
      detailRail={
        <DetailRail>
          <YearDock year={year} setYear={setYear} />
          {project ? (
            <>
              <EntityDetailPanel
                  backlinks={backlinks}
                  currentThemeLabel={currentTheme.label}
                  draftAssetSourcePath={draftAssetSourcePath}
                  draftBody={draftBody}
                  draftCoverImagePath={draftCoverImagePath}
                  draftLinkTargetId={draftLinkTargetId}
                  draftSummary={draftSummary}
                  draftThumbnailPath={draftThumbnailPath}
                  draftTitle={draftTitle}
                  locationOptions={locationOptions}
                  onCreateLinkedEntity={handleCreateLinkedEntity}
                  onCreateSceneFromEntity={handleCreateSceneFromEntity}
                  onImportMedia={handleImportEntityMedia}
                  onOpenBacklink={handleOpenBacklink}
                  onOpenSceneContext={handleOpenSceneContext}
                  onPresetMediaPaths={handlePresetEntityMedia}
                  onSaveLinks={handleSaveEntityLinks}
                  onSaveMedia={handleSaveEntityMedia}
                  regionOptions={regionOptions}
                  selectedEntity={selectedEntity}
                  selectedVisual={selectedVisual}
                  setDraftBody={setDraftBody}
                  setDraftAssetSourcePath={setDraftAssetSourcePath}
                  setDraftCoverImagePath={setDraftCoverImagePath}
                  setDraftLinkTargetId={setDraftLinkTargetId}
                  setDraftSummary={setDraftSummary}
                  setDraftThumbnailPath={setDraftThumbnailPath}
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
                      <span className="theme-tones" aria-hidden="true">
                        {option.tones.map((tone) => (
                          <span
                            key={tone}
                            className="theme-tone"
                            style={{ backgroundColor: tone }}
                          />
                        ))}
                      </span>
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
                    <ul className="asset-manifest" aria-label="asset manifest">
                      <li>
                        <span>Cover</span>
                        <strong>{selectedVisual.coverMode}</strong>
                      </li>
                      <li>
                        <span>Logo</span>
                        <strong>{selectedVisual.logo.kind}</strong>
                      </li>
                      <li>
                        <span>Motif</span>
                        <strong>{selectedVisual.motif.kind}</strong>
                      </li>
                    </ul>
                  </div>
                ) : (
                  <p className="empty">Select entity</p>
                )}
              </section>
            </>
          ) : null}
        </DetailRail>
      }
      error={error}
      gridFolio={
        <div className="shell-folio-strip" aria-label="shell summary strip">
          {shellFolio.map((entry) => (
            <span key={entry} className="command-chip shell-ribbon-chip">
              {entry}
            </span>
          ))}
        </div>
      }
      sidebar={
        <AppSidebar>
          <LensRail
            activeLens={activeLens}
            busy={busy}
            deferredLensFlags={deferredLensFlags}
            lensItems={lensItems}
            onDeferredLensToggle={toggleDeferredLensFlag}
            onLensChange={setActiveLens}
            onCreateDemoWorld={handleCreateDemoWorld}
            onSubmit={handleSubmit}
            setTitle={setTitle}
            status={status}
            title={title}
          />
        </AppSidebar>
      }
      theme={theme}
      topbar={
        <AppTopbar
          activeLens={activeLens}
          autosaveState={topbarAutosaveState}
          currentThemeLabel={currentTheme.label}
          dirty={dirty}
          isBootstrappingProject={isBootstrappingProject}
          onToggleTheme={() =>
            setTheme(theme === 'dusk' ? 'parchment' : 'dusk')
          }
          optionalLensState={optionalLensState}
          year={year}
        />
      }
      workspace={
        <MainWorkspace
          body={
            project ? (
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
                <div
                  className="workspace-collector-strip"
                  aria-label="workspace collector strip"
                >
                  {workspaceCollector.map((entry) => (
                    <span key={entry} className="command-chip shell-ribbon-chip">
                      {entry}
                    </span>
                  ))}
                </div>
                <div
                  className="workspace-provenance-strip"
                  aria-label="workspace provenance strip"
                >
                  {workspaceProvenance.map((entry) => (
                    <span key={entry} className="command-chip shell-ribbon-chip">
                      {entry}
                    </span>
                  ))}
                </div>

                <WorkspaceStage
                  activeLens={activeLens}
                  backlinks={backlinks}
                  busy={busy}
                  canvasEnabled={canvasEnabled}
                  draftSceneBody={draftSceneBody}
                  draftSceneSummary={draftSceneSummary}
                  draftSceneTitle={draftSceneTitle}
                  exportEnabled={exportEnabled}
                  exportJobs={exportJobs}
                  exportStatus={exportStatus}
                  filteredRecords={filteredRecords}
                  isRefreshingEntities={isRefreshingEntities}
                  manuscriptDirty={manuscriptDirty}
                  manuscriptEnabled={manuscriptEnabled}
                  manuscriptStatus={manuscriptStatus}
                  manuscriptTree={manuscriptTree}
                  mentionOptions={mentionOptions}
                  onCreateEntity={handleCreateEntity}
                  onCreateLinkedEntity={handleCreateLinkedEntity}
                  onCreateManuscriptChapter={handleCreateManuscriptChapter}
                  onCreateManuscriptScene={handleCreateManuscriptScene}
                  onInsertSceneMention={handleInsertSceneMention}
                  onMapJump={handleMapJump}
                  onMentionSelect={handleMentionSelect}
                  onOpenBacklink={handleOpenBacklink}
                  onQueueExport={handleQueueExport}
                  onQuickJump={handleQuickJump}
                  onTimelineEntityJump={handleTimelineEntityJump}
                  query={query}
                  records={records}
                  relationsEnabled={relationsEnabled}
                  searchRecords={searchRecords}
                  selectedEntity={selectedEntity}
                  selectedEntityId={selectedEntityId}
                  selectedScene={selectedScene}
                  selectedSceneId={selectedSceneId}
                  setDraftSceneBody={setDraftSceneBody}
                  setDraftSceneSelectionEnd={setDraftSceneSelectionEnd}
                  setDraftSceneSelectionStart={setDraftSceneSelectionStart}
                  setDraftSceneSummary={setDraftSceneSummary}
                  setDraftSceneTitle={setDraftSceneTitle}
                  setHoveredEntityId={setHoveredEntityId}
                  setSelectedEntityId={setSelectedEntityId}
                  setSelectedSceneId={setSelectedSceneId}
                  timelineContext={timelineContext}
                  timelineRecords={timelineRecords}
                  typeLabels={TYPE_LABELS}
                  typeMonograms={TYPE_MONOGRAMS}
                  year={year}
                />
              </>
            ) : (
              <section className="empty-stage">
                <p className="eyebrow">World</p>
                <h2>Create local world.</h2>
                <p className="copy">
                  Normal world bos baslar. Demo world sample veri ile gelir.
                </p>
              </section>
            )
          }
          chrome={
            <WorkspaceChrome
              workspaceCurationRail={workspaceCurationRail}
              workspaceDeskAtlas={workspaceDeskAtlas}
              workspaceEditorial={workspaceEditorial}
              workspaceFolio={workspaceFolio}
              workspaceMood={workspaceMood}
              workspaceSessionStrip={workspaceSessionStrip}
              workspaceShellDigest={workspaceShellDigest}
              workspaceSpotlight={workspaceSpotlight}
              workspaceStateBoard={workspaceStateBoard}
            />
          }
          hoverPreview={
            <HoverPreview
              entity={hoveredEntity}
              onOpenMap={() => handleQuickJump('Map')}
              onOpenTimeline={() => handleQuickJump('Timeline')}
              onOpenWiki={() => handleQuickJump('Wiki')}
              typeLabels={TYPE_LABELS}
              visible={activeLens === 'Wiki' || activeLens === 'Search'}
            />
          }
          lensCopy={getLensCopy(activeLens)}
          lensName={activeLens}
          toolbar={
            activeLens === 'Wiki' || activeLens === 'Search' ? (
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
            ) : null
          }
        />
      }
    />
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
