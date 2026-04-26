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
import {
  autosaveEntity,
  createEntity,
  type CreateEntityInput,
  importEntityMedia,
  updateEntityLinks,
  updateEntityMedia,
  recoverAutosave
} from './modules/entity-model/api';
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
import { CreateEntityStudio } from './ui/CreateEntityStudio';
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
  const [draftAssetSourcePath, setDraftAssetSourcePath] = useState('');
  const [draftCoverImagePath, setDraftCoverImagePath] = useState('');
  const [draftLinkTargetId, setDraftLinkTargetId] = useState('');
  const [draftThumbnailPath, setDraftThumbnailPath] = useState('');
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
  const [draftSceneSelectionStart, setDraftSceneSelectionStart] = useState<
    number | null
  >(null);
  const [draftSceneSelectionEnd, setDraftSceneSelectionEnd] = useState<
    number | null
  >(null);
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
      setDraftSceneSelectionStart(null);
      setDraftSceneSelectionEnd(null);
      setManuscriptDirty(false);
      return;
    }

    setDraftSceneTitle(selectedScene.node.title);
    setDraftSceneSummary(selectedScene.node.summary);
    setDraftSceneBody(selectedScene.node.body);
    setDraftSceneSelectionStart(null);
    setDraftSceneSelectionEnd(null);
    setManuscriptDirty(false);
  }, [
    selectedScene?.node.body,
    selectedScene?.node.id,
    selectedScene?.node.summary,
    selectedScene?.node.title
  ]);

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
  const mentionOptions = filteredRecords.slice(0, 4);
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
      setDraftAssetSourcePath('');
      setDraftCoverImagePath('');
      setDraftLinkTargetId('');
      setDraftThumbnailPath('');
      setDirty(false);
      return;
    }

    setDraftTitle(selectedEntity.common.title);
    setDraftSummary(selectedEntity.common.summary);
    setDraftBody(selectedEntity.common.body);
    setDraftAssetSourcePath('');
    setDraftCoverImagePath(selectedEntity.common.coverImagePath ?? '');
    setDraftLinkTargetId(
      selectedEntity.type === 'location'
        ? selectedEntity.fields.regionId ?? ''
        : selectedEntity.type === 'region'
          ? selectedEntity.fields.parentRegionId ?? ''
          : selectedEntity.type === 'event'
            ? selectedEntity.fields.locationId ?? ''
            : ''
    );
    setDraftThumbnailPath(selectedEntity.common.thumbnailPath ?? '');
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

  function handleOpenSceneContext() {
    if (relationsEnabled) {
      setActiveLens('Relations');
      return;
    }

    if (manuscriptEnabled && backlinks[0]) {
      handleOpenBacklink(backlinks[0].nodeId);
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

  async function handleCreateEntity(input: CreateEntityInput) {
    if (!databasePath) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const created = await createEntity(databasePath, input);
      setRecords((current) => [...current, created]);
      setSelectedEntityId(created.common.id);
      setTypeFilter('all');
      setQuery('');
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateLinkedEntity(
    kind: 'event_from_location' | 'location_from_region' | 'region_from_region'
  ) {
    if (!databasePath || !selectedEntity) {
      return;
    }

    if (kind === 'event_from_location' && selectedEntity.type === 'location') {
      await handleCreateEntity({
        type: 'event',
        common: {
          title: `New ${selectedEntity.common.title} event`,
          summary: `Event linked to ${selectedEntity.common.title}`
        },
        fields: {
          locationId: selectedEntity.common.id
        }
      });
      return;
    }

    if (kind === 'location_from_region' && selectedEntity.type === 'region') {
      await handleCreateEntity({
        type: 'location',
        common: {
          title: `New ${selectedEntity.common.title} site`,
          summary: `Location linked to ${selectedEntity.common.title}`
        },
        fields: {
          regionId: selectedEntity.common.id,
          locationKind: 'settlement'
        }
      });
      return;
    }

    if (kind === 'region_from_region' && selectedEntity.type === 'region') {
      await handleCreateEntity({
        type: 'region',
        common: {
          title: `New ${selectedEntity.common.title} frontier`,
          summary: `Region linked to ${selectedEntity.common.title}`
        },
        fields: {
          parentRegionId: selectedEntity.common.id
        }
      });
    }
  }

  async function handleSaveEntityMedia() {
    if (!databasePath || !selectedEntity) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await updateEntityMedia(databasePath, {
        id: selectedEntity.common.id,
        coverImagePath: draftCoverImagePath.trim() || null,
        thumbnailPath: draftThumbnailPath.trim() || null
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  function handlePresetEntityMedia() {
    if (!selectedEntity) {
      return;
    }

    const base = `assets/entities/${selectedEntity.type}/${selectedEntity.common.slug}`;
    setDraftCoverImagePath(`${base}/cover.png`);
    setDraftThumbnailPath(`${base}/thumb.png`);
  }

  async function handleImportEntityMedia(variant: 'cover' | 'thumbnail') {
    if (!databasePath || !selectedEntity || !draftAssetSourcePath.trim()) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await importEntityMedia(databasePath, {
        id: selectedEntity.common.id,
        sourcePath: draftAssetSourcePath.trim(),
        variant
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
      setDraftCoverImagePath(updated.common.coverImagePath ?? '');
      setDraftThumbnailPath(updated.common.thumbnailPath ?? '');
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEntityLinks() {
    if (!databasePath || !selectedEntity || selectedEntity.type === 'character') {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await updateEntityLinks(databasePath, {
        id: selectedEntity.common.id,
        regionId:
          selectedEntity.type === 'location' ? draftLinkTargetId || null : null,
        parentRegionId:
          selectedEntity.type === 'region' ? draftLinkTargetId || null : null,
        locationId:
          selectedEntity.type === 'event' ? draftLinkTargetId || null : null
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
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
                        onJump={handleMapJump}
                        onSelect={setSelectedEntityId}
                        records={filteredRecords}
                        selectedEntityId={selectedEntityId}
                        year={year}
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
                    <div className="wiki-stage">
                      <CreateEntityStudio
                        busy={busy}
                        onCreate={handleCreateEntity}
                        records={records}
                        selectedEntity={selectedEntity}
                      />
                      <CardGrid
                        onQuickCreate={handleCreateLinkedEntity}
                        records={filteredRecords}
                        selectedEntityId={selectedEntityId}
                        setHoveredEntityId={setHoveredEntityId}
                        setSelectedEntityId={setSelectedEntityId}
                        typeLabels={TYPE_LABELS}
                        typeMonograms={TYPE_MONOGRAMS}
                      />
                    </div>
                  ) : null}

                  {activeLens === 'Search' ? (
                    query.trim() ? (
                      <CardGrid
                        onQuickCreate={handleCreateLinkedEntity}
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
                      backlinkCount={backlinks.length}
                      draftBody={draftSceneBody}
                      draftSummary={draftSceneSummary}
                      draftTitle={draftSceneTitle}
                      dirty={manuscriptDirty}
                      mentionOptions={mentionOptions}
                      onInsertMention={handleInsertSceneMention}
                      onMentionSelect={handleMentionSelect}
                      onOpenTimelineEntity={handleTimelineEntityJump}
                      onOpenTimelineContext={() => handleQuickJump('Timeline')}
                      onOpenWikiContext={() => handleQuickJump('Wiki')}
                      onDraftBodyChange={setDraftSceneBody}
                      onDraftBodyCursorChange={(
                        selectionStart,
                        selectionEnd
                      ) => {
                        setDraftSceneSelectionStart(selectionStart);
                        setDraftSceneSelectionEnd(selectionEnd);
                      }}
                      onDraftSummaryChange={setDraftSceneSummary}
                      onDraftTitleChange={setDraftSceneTitle}
                      scene={selectedScene}
                      selectedEntity={selectedEntity}
                      selectedSceneId={selectedSceneId}
                      setSelectedSceneId={setSelectedSceneId}
                      status={manuscriptStatus}
                      tree={manuscriptTree}
                      timelineContext={timelineContext}
                      year={year}
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
                          onClick={() => handleQuickJump('Wiki')}
                          type="button"
                        >
                          Open wiki
                        </button>
                        <button
                          className="button ghost-button"
                          onClick={() => handleQuickJump('Timeline')}
                          type="button"
                        >
                          Open timeline
                        </button>
                        <button
                          className="button ghost-button"
                          onClick={() => handleQuickJump('Map')}
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
                  draftAssetSourcePath={draftAssetSourcePath}
                  draftBody={draftBody}
                  draftCoverImagePath={draftCoverImagePath}
                  draftLinkTargetId={draftLinkTargetId}
                  draftSummary={draftSummary}
                  draftThumbnailPath={draftThumbnailPath}
                  draftTitle={draftTitle}
                  locationOptions={locationOptions}
                  onCreateLinkedEntity={handleCreateLinkedEntity}
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
                      <ul
                        className="asset-manifest"
                        aria-label="asset manifest"
                      >
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
