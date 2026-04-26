import type { EntityRecord, EntityType } from '../modules/entity-model/types';
import type { EntityBacklink } from '../modules/manuscript/contracts';

type EntityDetailPanelProps = {
  selectedEntity: EntityRecord | null;
  selectedVisual: {
    coverMode: 'entity' | 'fallback';
    coverPath: string;
    logo: { path: string };
    motif: { path: string };
  } | null;
  currentThemeLabel: string;
  draftTitle: string;
  draftSummary: string;
  draftBody: string;
  draftAssetSourcePath: string;
  draftCoverImagePath: string;
  draftLinkTargetId: string;
  draftThumbnailPath: string;
  backlinks: EntityBacklink[];
  locationOptions: EntityRecord[];
  regionOptions: EntityRecord[];
  onOpenBacklink: (nodeId: string) => void;
  onOpenSceneContext: () => void;
  onCreateLinkedEntity: (kind: 'event_from_location' | 'location_from_region' | 'region_from_region') => void;
  onImportMedia: (variant: 'cover' | 'thumbnail') => void;
  onPresetMediaPaths: () => void;
  onSaveLinks: () => void;
  onSaveMedia: () => void;
  setDraftCoverImagePath: (value: string) => void;
  setDraftLinkTargetId: (value: string) => void;
  setDraftThumbnailPath: (value: string) => void;
  setDraftTitle: (value: string) => void;
  setDraftSummary: (value: string) => void;
  setDraftBody: (value: string) => void;
  setDraftAssetSourcePath: (value: string) => void;
  typeLabels: Record<EntityType, string>;
  typeMonograms: Record<EntityType, string>;
};

export function EntityDetailPanel({
  selectedEntity,
  selectedVisual,
  currentThemeLabel,
  draftTitle,
  draftSummary,
  draftBody,
  draftAssetSourcePath,
  draftCoverImagePath,
  draftLinkTargetId,
  draftThumbnailPath,
  backlinks,
  locationOptions,
  regionOptions,
  onOpenBacklink,
  onOpenSceneContext,
  onCreateLinkedEntity,
  onImportMedia,
  onPresetMediaPaths,
  onSaveLinks,
  onSaveMedia,
  setDraftCoverImagePath,
  setDraftLinkTargetId,
  setDraftThumbnailPath,
  setDraftTitle,
  setDraftSummary,
  setDraftBody,
  setDraftAssetSourcePath,
  typeLabels,
  typeMonograms
}: EntityDetailPanelProps) {
  return (
    <section className="detail-panel">
      <p className="eyebrow">Detail Panel</p>
      {selectedEntity ? (
        <>
          <div className="detail-cover">
            <span className={`type-badge type-${selectedEntity.type}`}>
              <span className="type-icon" aria-hidden="true">
                {typeMonograms[selectedEntity.type]}
              </span>
              {typeLabels[selectedEntity.type]}
            </span>
            <span className="detail-code">{selectedEntity.common.id}</span>
          </div>
          <div
            className="detail-asset-shell premium-gallery-shell"
            aria-label="entity gallery panel"
          >
            <img
              alt={`${selectedEntity.common.title} cover`}
              className="detail-asset"
              src={selectedVisual?.coverPath}
            />
            <img
              alt=""
              aria-hidden="true"
              className="detail-motif"
              src={selectedVisual?.motif.path}
            />
            <div className="detail-gallery-rail" aria-hidden="true">
              <span>{typeLabels[selectedEntity.type]}</span>
              <span>{selectedEntity.common.startYear ?? 'open'}</span>
              <span>{currentThemeLabel}</span>
            </div>
          </div>
          <h2>{selectedEntity.common.title}</h2>
          <section className="detail-section" aria-label="detail editor">
            <p className="eyebrow">Editor</p>
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
          </section>
          <section className="detail-section" aria-label="detail facts">
            <p className="eyebrow">Facts</p>
            <dl className="meta detail-grid">
              <div>
                <dt>Years</dt>
                <dd>
                  {selectedEntity.common.startYear ?? 'open'} -{' '}
                  {selectedEntity.common.endYear ?? 'open'}
                </dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {selectedEntity.common.latitude ?? 'n/a'},{' '}
                  {selectedEntity.common.longitude ?? 'n/a'}
                </dd>
              </div>
              <div>
                <dt>Cover</dt>
                <dd>
                  {selectedVisual?.coverMode === 'entity'
                    ? selectedEntity.common.coverImagePath
                    : 'fallback asset'}
                </dd>
              </div>
              <div>
                <dt>Theme</dt>
                <dd>{currentThemeLabel}</dd>
              </div>
            </dl>
          </section>
          <section className="detail-section" aria-label="detail assets">
            <p className="eyebrow">Assets</p>
            <label className="label" htmlFor="entity-asset-source">
              Source path
            </label>
            <input
              id="entity-asset-source"
              className="input"
              onChange={(event) => setDraftAssetSourcePath(event.target.value)}
              value={draftAssetSourcePath}
            />
            <label className="label" htmlFor="entity-cover-path">
              Cover path
            </label>
            <input
              id="entity-cover-path"
              className="input"
              onChange={(event) => setDraftCoverImagePath(event.target.value)}
              value={draftCoverImagePath}
            />
            <label className="label" htmlFor="entity-thumbnail-path">
              Thumbnail path
            </label>
            <input
              id="entity-thumbnail-path"
              className="input"
              onChange={(event) => setDraftThumbnailPath(event.target.value)}
              value={draftThumbnailPath}
            />
            <button
              className="button ghost-button"
              onClick={onPresetMediaPaths}
              type="button"
            >
              Preset asset paths
            </button>
            <div className="detail-authoring-actions">
              <button
                className="button ghost-button"
                onClick={() => onImportMedia('cover')}
                type="button"
              >
                Import to cover
              </button>
              <button
                className="button ghost-button"
                onClick={() => onImportMedia('thumbnail')}
                type="button"
              >
                Import to thumbnail
              </button>
            </div>
            <button className="button ghost-button" onClick={onSaveMedia} type="button">
              Save asset paths
            </button>
          </section>
          {selectedEntity.type !== 'character' ? (
            <section className="detail-section" aria-label="detail relations">
              <p className="eyebrow">Relations</p>
              <label className="label" htmlFor="entity-link-target">
                {selectedEntity.type === 'location'
                  ? 'Region link'
                  : selectedEntity.type === 'region'
                    ? 'Parent region'
                    : 'Event location'}
              </label>
              <select
                id="entity-link-target"
                aria-label={
                  selectedEntity.type === 'location'
                    ? 'region link'
                    : selectedEntity.type === 'region'
                      ? 'parent region'
                      : 'event location'
                }
                className="input select"
                onChange={(event) => setDraftLinkTargetId(event.target.value)}
                value={draftLinkTargetId}
              >
                <option value="">None</option>
                {(selectedEntity.type === 'event'
                  ? locationOptions
                  : regionOptions
                ).map((record) => (
                  <option key={record.common.id} value={record.common.id}>
                    {record.common.title}
                  </option>
                ))}
              </select>
              <button className="button ghost-button" onClick={onSaveLinks} type="button">
                Save relation link
              </button>
            </section>
          ) : null}
          {selectedEntity.type === 'location' || selectedEntity.type === 'region' ? (
            <section className="detail-section" aria-label="detail authoring">
              <p className="eyebrow">Authoring</p>
              <strong>Quick linked create</strong>
              <div className="detail-authoring-actions">
                {selectedEntity.type === 'location' ? (
                  <button
                    className="button ghost-button"
                    onClick={() => onCreateLinkedEntity('event_from_location')}
                    type="button"
                  >
                    New event here
                  </button>
                ) : null}
                {selectedEntity.type === 'region' ? (
                  <>
                    <button
                      className="button ghost-button"
                      onClick={() => onCreateLinkedEntity('location_from_region')}
                      type="button"
                    >
                      New location in region
                    </button>
                    <button
                      className="button ghost-button"
                      onClick={() => onCreateLinkedEntity('region_from_region')}
                      type="button"
                    >
                      New child region
                    </button>
                  </>
                ) : null}
              </div>
            </section>
          ) : null}
          {backlinks.length ? (
            <section
              className="detail-section manuscript-links"
              aria-label="detail backlinks"
            >
              <p className="eyebrow">Backlinks</p>
              <strong>Manuscript backlinks</strong>
              {backlinks.map((backlink) => (
                <button
                  key={backlink.nodeId}
                  className="button ghost-button"
                  onClick={() => onOpenBacklink(backlink.nodeId)}
                  type="button"
                >
                  {backlink.sceneTitle}
                </button>
              ))}
            </section>
          ) : null}
          {backlinks.length ? (
            <section
              className="detail-section manuscript-links"
              aria-label="detail scene context"
            >
              <p className="eyebrow">Scene context</p>
              <strong>{backlinks.length} linked scenes</strong>
              <div className="manuscript-meta">
                <span className="command-chip">
                  {backlinks[0]?.chapterTitle ?? 'Loose scene'}
                </span>
                <span className="command-chip">
                  {selectedEntity.common.startYear ?? 'open'} start
                </span>
              </div>
              <div className="detail-authoring-actions">
                <button
                  className="button ghost-button"
                  onClick={() => onOpenBacklink(backlinks[0].nodeId)}
                  type="button"
                >
                  Open latest scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={onOpenSceneContext}
                  type="button"
                >
                  Open scene graph
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <p className="empty">Select entity</p>
      )}
    </section>
  );
}
