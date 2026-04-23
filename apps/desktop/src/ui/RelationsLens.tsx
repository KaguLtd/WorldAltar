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

          {backlinks.length ? (
            <div className="theme-stack">
              {backlinks.map((backlink) => (
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
