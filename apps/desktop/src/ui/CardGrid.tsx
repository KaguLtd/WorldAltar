import { resolveEntityVisual } from '../modules/assets/contracts';
import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type CardGridProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string) => void;
  setHoveredEntityId: (id: string | null) => void;
  onQuickCreate: (
    kind: 'event_from_location' | 'location_from_region' | 'region_from_region'
  ) => void;
  typeLabels: Record<EntityType, string>;
  typeMonograms: Record<EntityType, string>;
};

export function CardGrid({
  records,
  selectedEntityId,
  setSelectedEntityId,
  setHoveredEntityId,
  onQuickCreate,
  typeLabels,
  typeMonograms
}: CardGridProps) {
  const selectedRecord =
    records.find((record) => record.common.id === selectedEntityId) ?? null;
  const groupedRecords = groupRecords(records);

  return (
    <section className="wiki-lens" aria-label="wiki lens">
      {selectedRecord ? (
        <article className="wiki-spotlight" aria-label="wiki spotlight">
          <div className="wiki-spotlight-copy">
            <p className="eyebrow">Selected Entity</p>
            <strong>{selectedRecord.common.title}</strong>
            <span>{selectedRecord.common.summary || 'No summary'}</span>
          </div>
          <dl className="wiki-facts">
            <div>
              <dt>Type</dt>
              <dd>{typeLabels[selectedRecord.type]}</dd>
            </div>
            <div>
              <dt>ID</dt>
              <dd>{selectedRecord.common.id}</dd>
            </div>
            <div>
              <dt>Years</dt>
              <dd>
                {selectedRecord.common.startYear ?? 'open'} -{' '}
                {selectedRecord.common.endYear ?? 'open'}
              </dd>
            </div>
          </dl>
          {selectedRecord.type === 'location' || selectedRecord.type === 'region' ? (
            <div className="spotlight-actions" aria-label="spotlight actions">
              {selectedRecord.type === 'location' ? (
                <button
                  className="button ghost-button"
                  onClick={() => onQuickCreate('event_from_location')}
                  type="button"
                >
                  New event here
                </button>
              ) : null}
              {selectedRecord.type === 'region' ? (
                <>
                  <button
                    className="button ghost-button"
                    onClick={() => onQuickCreate('location_from_region')}
                    type="button"
                  >
                    New location in region
                  </button>
                  <button
                    className="button ghost-button"
                    onClick={() => onQuickCreate('region_from_region')}
                    type="button"
                  >
                    New child region
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </article>
      ) : null}

      {groupedRecords.length ? (
        groupedRecords.map(([type, items]) => (
          <section
            key={type}
            className="card-group"
            aria-label={`${typeLabels[type]} group`}
          >
            <div className="card-group-head">
              <p className="eyebrow">{typeLabels[type]}</p>
              <span>{items.length}</span>
            </div>
            <section className="card-grid" role="list">
              {items.map((record) => {
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
                        <span className="card-code">{record.common.id}</span>
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
            </section>
          </section>
        ))
      ) : (
        <section className="card-grid" role="list">
          <p className="empty card-empty">No visible entity</p>
        </section>
      )}
    </section>
  );
}

const TYPE_ORDER: EntityType[] = ['character', 'location', 'region', 'event'];

function groupRecords(records: EntityRecord[]) {
  return TYPE_ORDER.map(
    (type) =>
      [
        type,
        records
          .filter((record) => record.type === type)
          .sort((left, right) =>
            left.common.title.localeCompare(right.common.title)
          )
      ] as const
  ).filter((entry) => entry[1].length);
}
