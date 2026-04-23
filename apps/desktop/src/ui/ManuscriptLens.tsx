import type {
  ManuscriptSceneDetail,
  ManuscriptTreeItem
} from '../modules/manuscript/contracts';

type ManuscriptLensProps = {
  draftBody: string;
  draftSummary: string;
  draftTitle: string;
  dirty: boolean;
  onMentionSelect: (entityId: string) => void;
  onDraftBodyChange: (value: string) => void;
  onDraftSummaryChange: (value: string) => void;
  onDraftTitleChange: (value: string) => void;
  scene: ManuscriptSceneDetail | null;
  selectedSceneId: string | null;
  setSelectedSceneId: (id: string) => void;
  status: string;
  tree: ManuscriptTreeItem[];
};

export function ManuscriptLens({
  draftBody,
  draftSummary,
  draftTitle,
  dirty,
  onMentionSelect,
  onDraftBodyChange,
  onDraftSummaryChange,
  onDraftTitleChange,
  scene,
  selectedSceneId,
  setSelectedSceneId,
  status,
  tree
}: ManuscriptLensProps) {
  return (
    <section className="manuscript-shell" aria-label="manuscript lens">
      <aside className="manuscript-tree premium-gallery-shell">
        <div className="manuscript-head">
          <div>
            <p className="eyebrow">Manuscript</p>
            <strong>{status}</strong>
          </div>
        </div>

        {tree.length ? (
          tree.map((chapter) => (
            <section key={chapter.node.id} className="manuscript-links">
              <strong>{chapter.node.title}</strong>
              {chapter.children.map((sceneNode) => (
                <button
                  key={sceneNode.id}
                  className={`theme-card${sceneNode.id === selectedSceneId ? ' is-active' : ''}`}
                  onClick={() => setSelectedSceneId(sceneNode.id)}
                  type="button"
                >
                  <strong>{sceneNode.title}</strong>
                  <span>{sceneNode.summary || 'No summary'}</span>
                </button>
              ))}
            </section>
          ))
        ) : (
          <p className="empty">No manuscript data.</p>
        )}
      </aside>

      <article className="manuscript-editor premium-manuscript-editor">
        <div className="manuscript-ornament" />
        {scene ? (
          <>
            <div className="manuscript-head">
              <div>
                <p className="eyebrow">Scene</p>
                <input
                  aria-label="manuscript title"
                  className="input"
                  onChange={(event) => onDraftTitleChange(event.target.value)}
                  value={draftTitle}
                />
              </div>
              <span className={`command-chip${dirty ? ' is-dirty' : ''}`}>
                {dirty ? 'Dirty' : status}
              </span>
            </div>
            <textarea
              aria-label="manuscript summary"
              className="textarea"
              onChange={(event) => onDraftSummaryChange(event.target.value)}
              value={draftSummary}
            />
            <textarea
              aria-label="manuscript body"
              className="textarea manuscript-body"
              onChange={(event) => onDraftBodyChange(event.target.value)}
              value={draftBody}
            />
            {scene.mentions.length ? (
              <div className="manuscript-links">
                <strong>Mentions</strong>
                {scene.mentions.map((mention) => (
                  <button
                    key={mention.id}
                    className="button ghost-button"
                    onClick={() => onMentionSelect(mention.entityId)}
                    type="button"
                  >
                    {mention.label} [{mention.entityId}]
                  </button>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <section className="empty-stage lens-empty">
            <p className="eyebrow">Manuscript</p>
            <h2>Select scene.</h2>
            <p className="copy">Deferred lens. Explicit flag ile acildi.</p>
          </section>
        )}
      </article>
    </section>
  );
}
