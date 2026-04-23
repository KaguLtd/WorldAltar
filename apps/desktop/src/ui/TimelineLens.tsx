import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type TimelineLensProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string) => void;
  typeLabels: Record<EntityType, string>;
  isRefreshingEntities: boolean;
};

type TimelineBand = {
  label: string;
  items: EntityRecord[];
};

export function TimelineLens({
  records,
  selectedEntityId,
  setSelectedEntityId,
  typeLabels,
  isRefreshingEntities
}: TimelineLensProps) {
  const timelineBands = buildTimelineBands(records);

  return (
    <>
      <section className="timeline-list" role="list">
        {records.map((record) => (
          <button
            key={record.common.id}
            className={`timeline-row${record.common.id === selectedEntityId ? ' is-active' : ''}`}
            onClick={() => setSelectedEntityId(record.common.id)}
            role="listitem"
            type="button"
          >
            <span className="timeline-year">
              {record.common.startYear ?? 'open'}
            </span>
            <strong>{record.common.title}</strong>
            <span>{typeLabels[record.type]}</span>
          </button>
        ))}
        {!records.length ? (
          <p className="empty card-empty">
            {isRefreshingEntities ? 'Loading...' : 'No visible entity'}
          </p>
        ) : null}
      </section>

      <section className="timeline-bands" aria-label="timeline bands">
        {timelineBands.map((band) => (
          <div key={band.label} className="timeline-band">
            <div className="timeline-band-head">
              <strong>{band.label}</strong>
              <span>{band.items.length} items</span>
            </div>
            <div className="timeline-band-items">
              {band.items.map((record) => (
                <button
                  key={record.common.id}
                  className={`band-chip${record.common.id === selectedEntityId ? ' is-active' : ''}`}
                  onClick={() => setSelectedEntityId(record.common.id)}
                  type="button"
                >
                  {record.common.title}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  );
}

function buildTimelineBands(records: EntityRecord[]): TimelineBand[] {
  const bucket = new Map<string, EntityRecord[]>();

  records.forEach((record) => {
    const year = record.common.startYear ?? 0;
    const century =
      year <= 0 ? 'Open Range' : `${Math.floor(year / 100) * 100}s`;
    const current = bucket.get(century) ?? [];
    current.push(record);
    bucket.set(century, current);
  });

  return [...bucket.entries()].map(([label, items]) => ({ label, items }));
}
