import type { ActiveLens } from '../../App';
import type { EntityRecord, EntityType } from '../../modules/entity-model/types';
import type { CreateEntityInput } from '../../modules/entity-model/api';
import type { ExportJob, ExportKind } from '../../modules/export/contracts';
import type {
  EntityBacklink,
  ManuscriptSceneDetail,
  ManuscriptTreeItem
} from '../../modules/manuscript/contracts';
import { OfflineMap } from '../../modules/map/OfflineMap';
import { CanvasLens } from '../CanvasLens';
import { CardGrid } from '../CardGrid';
import { CreateEntityStudio } from '../CreateEntityStudio';
import { ExportLens } from '../ExportLens';
import { ManuscriptLens } from '../ManuscriptLens';
import { RelationsLens } from '../RelationsLens';
import { TimelineLens } from '../TimelineLens';
import { DeferredFeaturePanel } from './DeferredFeaturePanel';

type QuickCreateKind =
  | 'event_from_location'
  | 'location_from_region'
  | 'region_from_region';

type CreateSceneInput = {
  chapterId: string;
  title: string;
  summary?: string;
  body?: string;
  seedEntityId?: string;
};

type WorkspaceStageProps = {
  activeLens: ActiveLens;
  backlinks: EntityBacklink[];
  busy: boolean;
  canvasEnabled: boolean;
  draftSceneBody: string;
  draftSceneSummary: string;
  draftSceneTitle: string;
  exportEnabled: boolean;
  exportJobs: ExportJob[];
  exportStatus: string;
  filteredRecords: EntityRecord[];
  isRefreshingEntities: boolean;
  manuscriptDirty: boolean;
  manuscriptEnabled: boolean;
  manuscriptStatus: string;
  manuscriptTree: ManuscriptTreeItem[];
  mentionOptions: EntityRecord[];
  onCreateEntity: (input: CreateEntityInput) => Promise<void>;
  onCreateLinkedEntity: (kind: QuickCreateKind) => void;
  onCreateManuscriptChapter: (title: string) => Promise<void>;
  onCreateManuscriptScene: (input: CreateSceneInput) => Promise<void>;
  onInsertSceneMention: (entityId?: string) => void;
  onMapJump: (lens: 'Wiki' | 'Timeline', entityId: string) => void;
  onMentionSelect: (entityId: string) => void;
  onOpenBacklink: (nodeId: string) => void;
  onQueueExport: (kind: ExportKind) => Promise<void>;
  onQuickJump: (lens: ActiveLens) => void;
  onTimelineEntityJump: (entityId: string) => void;
  query: string;
  records: EntityRecord[];
  relationsEnabled: boolean;
  searchRecords: EntityRecord[];
  selectedEntity: EntityRecord | null;
  selectedEntityId: string | null;
  selectedScene: ManuscriptSceneDetail | null;
  selectedSceneId: string | null;
  setDraftSceneBody: (value: string) => void;
  setDraftSceneSelectionEnd: (value: number | null) => void;
  setDraftSceneSelectionStart: (value: number | null) => void;
  setDraftSceneSummary: (value: string) => void;
  setDraftSceneTitle: (value: string) => void;
  setHoveredEntityId: (value: string | null) => void;
  setSelectedEntityId: (value: string | null) => void;
  setSelectedSceneId: (value: string) => void;
  timelineContext: EntityRecord[];
  timelineRecords: EntityRecord[];
  typeLabels: Record<EntityType, string>;
  typeMonograms: Record<EntityType, string>;
  year: number;
};

export function WorkspaceStage({
  activeLens,
  backlinks,
  busy,
  canvasEnabled,
  draftSceneBody,
  draftSceneSummary,
  draftSceneTitle,
  exportEnabled,
  exportJobs,
  exportStatus,
  filteredRecords,
  isRefreshingEntities,
  manuscriptDirty,
  manuscriptEnabled,
  manuscriptStatus,
  manuscriptTree,
  mentionOptions,
  onCreateEntity,
  onCreateLinkedEntity,
  onCreateManuscriptChapter,
  onCreateManuscriptScene,
  onInsertSceneMention,
  onMapJump,
  onMentionSelect,
  onOpenBacklink,
  onQueueExport,
  onQuickJump,
  onTimelineEntityJump,
  query,
  records,
  relationsEnabled,
  searchRecords,
  selectedEntity,
  selectedEntityId,
  selectedScene,
  selectedSceneId,
  setDraftSceneBody,
  setDraftSceneSelectionEnd,
  setDraftSceneSelectionStart,
  setDraftSceneSummary,
  setDraftSceneTitle,
  setHoveredEntityId,
  setSelectedEntityId,
  setSelectedSceneId,
  timelineContext,
  timelineRecords,
  typeLabels,
  typeMonograms,
  year
}: WorkspaceStageProps) {
  return (
    <section className="workspace-stage" data-lens={activeLens}>
      {activeLens === 'Map' ? (
        <div className="lens-frame">
          <OfflineMap
            onJump={onMapJump}
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
          typeLabels={typeLabels}
        />
      ) : null}

      {activeLens === 'Wiki' ? (
        <div className="wiki-stage">
          <CreateEntityStudio
            busy={busy}
            onCreate={onCreateEntity}
            records={records}
            selectedEntity={selectedEntity}
          />
          <CardGrid
            onQuickCreate={onCreateLinkedEntity}
            records={filteredRecords}
            selectedEntityId={selectedEntityId}
            setHoveredEntityId={setHoveredEntityId}
            setSelectedEntityId={setSelectedEntityId}
            typeLabels={typeLabels}
            typeMonograms={typeMonograms}
          />
        </div>
      ) : null}

      {activeLens === 'Search' ? (
        query.trim() ? (
          <CardGrid
            onQuickCreate={onCreateLinkedEntity}
            records={searchRecords}
            selectedEntityId={selectedEntityId}
            setHoveredEntityId={setHoveredEntityId}
            setSelectedEntityId={setSelectedEntityId}
            typeLabels={typeLabels}
            typeMonograms={typeMonograms}
          />
        ) : (
          <section className="empty-stage lens-empty">
            <p className="eyebrow">Search</p>
            <h2>Type query.</h2>
            <p className="copy">
              FTS lens acik. Wiki ve map ile ayni visible set kullanir.
            </p>
          </section>
        )
      ) : null}

      <DeferredFeaturePanel
        active={activeLens === 'Manuscript' && manuscriptEnabled}
      >
        <ManuscriptLens
          backlinkCount={backlinks.length}
          draftBody={draftSceneBody}
          draftSummary={draftSceneSummary}
          draftTitle={draftSceneTitle}
          dirty={manuscriptDirty}
          latestBacklinkTitle={backlinks[0]?.sceneTitle ?? null}
          mentionOptions={mentionOptions}
          onCreateChapter={onCreateManuscriptChapter}
          onCreateScene={onCreateManuscriptScene}
          onInsertMention={onInsertSceneMention}
          onMentionSelect={onMentionSelect}
          onOpenTimelineEntity={onTimelineEntityJump}
          onOpenTimelineContext={() => onQuickJump('Timeline')}
          onOpenWikiContext={() => onQuickJump('Wiki')}
          onDraftBodyChange={setDraftSceneBody}
          onDraftBodyCursorChange={(selectionStart, selectionEnd) => {
            setDraftSceneSelectionStart(selectionStart);
            setDraftSceneSelectionEnd(selectionEnd);
          }}
          onDraftSummaryChange={setDraftSceneSummary}
          onDraftTitleChange={setDraftSceneTitle}
          scene={selectedScene}
          sceneContextBacklinks={backlinks}
          selectedEntity={selectedEntity}
          selectedSceneId={selectedSceneId}
          setSelectedSceneId={setSelectedSceneId}
          status={manuscriptStatus}
          tree={manuscriptTree}
          timelineContext={timelineContext}
          year={year}
        />
      </DeferredFeaturePanel>

      <DeferredFeaturePanel active={activeLens === 'Canvas' && canvasEnabled}>
        <CanvasLens
          records={filteredRecords}
          selectedEntityId={selectedEntityId}
          setSelectedEntityId={setSelectedEntityId}
          typeLabels={typeLabels}
          year={year}
        />
      </DeferredFeaturePanel>

      <DeferredFeaturePanel active={activeLens === 'Export' && exportEnabled}>
        <ExportLens
          jobs={exportJobs}
          onQueue={onQueueExport}
          status={exportStatus}
        />
      </DeferredFeaturePanel>

      <DeferredFeaturePanel
        active={activeLens === 'Relations' && relationsEnabled}
      >
        <RelationsLens
          backlinks={backlinks}
          onOpenBacklink={onOpenBacklink}
          selectedEntity={selectedEntity}
        />
      </DeferredFeaturePanel>
    </section>
  );
}
