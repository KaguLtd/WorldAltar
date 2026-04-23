import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type EntityDetailPanelProps = {
  selectedEntity: EntityRecord | null;
  selectedVisual:
    | {
        coverMode: 'entity' | 'fallback';
        coverPath: string;
        logo: { path: string };
        motif: { path: string };
      }
    | null;
  currentThemeLabel: string;
  draftTitle: string;
  draftSummary: string;
  draftBody: string;
  setDraftTitle: (value: string) => void;
  setDraftSummary: (value: string) => void;
  setDraftBody: (value: string) => void;
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
  setDraftTitle,
  setDraftSummary,
  setDraftBody,
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
          <div className="detail-asset-shell premium-gallery-shell" aria-label="entity gallery panel">
            <img
              alt={`${selectedEntity.common.title} cover`}
              className="detail-asset"
              src={selectedVisual?.coverPath}
            />
            <img alt="" aria-hidden="true" className="detail-motif" src={selectedVisual?.motif.path} />
            <div className="detail-gallery-rail" aria-hidden="true">
              <span>{typeLabels[selectedEntity.type]}</span>
              <span>{selectedEntity.common.startYear ?? 'open'}</span>
              <span>{currentThemeLabel}</span>
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
              <dd>{currentThemeLabel}</dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="empty">Select entity</p>
      )}
    </section>
  );
}
