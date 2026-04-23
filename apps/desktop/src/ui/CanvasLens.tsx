import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type CanvasLensProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string) => void;
  typeLabels: Record<EntityType, string>;
  year: number;
};

export function CanvasLens({
  records,
  selectedEntityId,
  setSelectedEntityId,
  typeLabels,
  year
}: CanvasLensProps) {
  return (
    <section className="lens-frame" aria-label="canvas lens">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Canvas</p>
          <p className="copy">Deferred lens. Local derived board only.</p>
        </div>
        <span className="command-chip">Year {year}</span>
      </div>

      <div className="card-grid">
        {records.length ? (
          records.map((record, index) => (
            <button
              key={record.common.id}
              className={`wiki-card${record.common.id === selectedEntityId ? ' is-active' : ''}`}
              onClick={() => setSelectedEntityId(record.common.id)}
              style={{
                transform: `translate(${(index % 3) * 6}px, ${Math.floor(index / 3) * 4}px)`
              }}
              type="button"
            >
              <span className={`type-badge type-${record.type}`}>
                {typeLabels[record.type]}
              </span>
              <strong>{record.common.title}</strong>
              <span>{record.common.summary || 'No summary'}</span>
            </button>
          ))
        ) : (
          <section className="empty-stage lens-empty">
            <p className="eyebrow">Canvas</p>
            <h2>No visible nodes.</h2>
            <p className="copy">Year filter same visible set kullanir.</p>
          </section>
        )}
      </div>
    </section>
  );
}
