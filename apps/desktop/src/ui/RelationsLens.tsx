import type { EntityRecord } from '../modules/entity-model/types';
import type { EntityBacklink } from '../modules/manuscript/contracts';

type RelationsLensProps = {
  backlinks: EntityBacklink[];
  selectedEntity: EntityRecord | null;
  onOpenBacklink: (nodeId: string) => void;
};

export function RelationsLens({
  backlinks,
  selectedEntity,
  onOpenBacklink
}: RelationsLensProps) {
  const chapterGroups = buildChapterGroups(backlinks);

  return (
    <section className="lens-frame" aria-label="relations lens">
      {selectedEntity ? (
        <>
          <div className="workspace-head">
            <div>
              <p className="eyebrow">Relations</p>
              <p className="copy">Stable-id seam. Canonical DB same source.</p>
            </div>
            <span className="command-chip">{selectedEntity.common.id}</span>
          </div>

          <article
            className="timeline-spotlight"
            aria-label="relations spotlight"
          >
            <div className="timeline-spotlight-copy">
              <p className="eyebrow">Relations Focus</p>
              <strong>{selectedEntity.common.title}</strong>
              <span>{backlinks.length} backlinks</span>
            </div>
            <div className="timeline-summary">
              <span className="command-chip">{selectedEntity.common.id}</span>
              <span className="command-chip">
                {chapterGroups.length} chapters
              </span>
            </div>
          </article>

          {backlinks.length ? (
            <div className="theme-stack" aria-label="relations groups">
              {chapterGroups.map((group) => (
                <section key={group.label} className="timeline-band">
                  <div className="timeline-band-head">
                    <strong>{group.label}</strong>
                    <span>{group.items.length} scenes</span>
                  </div>
                  <div className="theme-stack">
                    {group.items.map((backlink) => (
                      <button
                        key={backlink.nodeId}
                        className="theme-card"
                        onClick={() => onOpenBacklink(backlink.nodeId)}
                        type="button"
                      >
                        <strong>{backlink.sceneTitle}</strong>
                        <span>{backlink.chapterTitle}</span>
                        <span>{backlink.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <section className="empty-stage lens-empty">
              <p className="eyebrow">Relations</p>
              <h2>No backlinks.</h2>
              <p className="copy">
                Relation persistence park. Reference seam acik.
              </p>
            </section>
          )}
        </>
      ) : (
        <section className="empty-stage lens-empty">
          <p className="eyebrow">Relations</p>
          <h2>Select entity.</h2>
          <p className="copy">Stable-id odakli read path only.</p>
        </section>
      )}
    </section>
  );
}

function buildChapterGroups(backlinks: EntityBacklink[]) {
  const bucket = new Map<string, EntityBacklink[]>();

  backlinks.forEach((backlink) => {
    const label = backlink.chapterTitle ?? 'Loose scenes';
    const current = bucket.get(label) ?? [];
    current.push(backlink);
    bucket.set(label, current);
  });

  return [...bucket.entries()].map(([label, items]) => ({
    label,
    items
  }));
}
