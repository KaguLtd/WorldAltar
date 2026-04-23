import { resolveEntityVisual } from '../modules/assets/contracts';
import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type CardGridProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string) => void;
  setHoveredEntityId: (id: string | null) => void;
  typeLabels: Record<EntityType, string>;
  typeMonograms: Record<EntityType, string>;
};

export function CardGrid({
  records,
  selectedEntityId,
  setSelectedEntityId,
  setHoveredEntityId,
  typeLabels,
  typeMonograms
}: CardGridProps) {
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
              <img
                alt=""
                aria-hidden="true"
                className="card-image"
                src={visual.coverPath}
              />
              <div className="card-badge-row">
                <span className={`type-badge type-${record.type}`}>
                  <span className="type-icon" aria-hidden="true">
                    {typeMonograms[record.type]}
                  </span>
                  {typeLabels[record.type]}
                </span>
              </div>
            </div>
            <div className="card-copy">
              <strong>{record.common.title}</strong>
              <span>{record.common.summary || 'No summary'}</span>
              <span>
                {record.common.startYear ?? 'open'} -{' '}
                {record.common.endYear ?? 'open'}
              </span>
            </div>
          </button>
        );
      })}
      {!records.length ? (
        <p className="empty card-empty">No visible entity</p>
      ) : null}
    </section>
  );
}
