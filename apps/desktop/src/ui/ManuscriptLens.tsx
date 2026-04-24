import { useMemo, useState } from 'react';
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
  const activeChapter =
    tree.find((chapter) =>
      chapter.children.some((sceneNode) => sceneNode.id === selectedSceneId)
    ) ?? null;
  const wordCount = countWords(draftBody);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const activeSceneIndex = activeChapter
    ? activeChapter.children.findIndex(
        (sceneNode) => sceneNode.id === selectedSceneId
      ) + 1
    : 0;
  const [mode, setMode] = useState<'draft' | 'split' | 'book'>('draft');
  const bookPages = useMemo(
    () =>
      buildBookPages(
        activeChapter?.node.title ?? 'Loose scene',
        draftTitle,
        draftSummary,
        draftBody
      ),
    [activeChapter?.node.title, draftBody, draftSummary, draftTitle]
  );

  return (
    <section
      className={`manuscript-shell${mode === 'split' ? ' mode-split' : mode === 'book' ? ' mode-book' : ''}`}
      aria-label="manuscript lens"
    >
      <aside className="manuscript-tree premium-gallery-shell">
        <div className="manuscript-head">
          <div>
            <p className="eyebrow">Manuscript</p>
            <strong>{status}</strong>
          </div>
        </div>

        {tree.length ? (
          tree.map((chapter) => (
            <section
              key={chapter.node.id}
              className="manuscript-links"
              aria-label={`${chapter.node.title} chapter`}
            >
              <div className="chapter-head">
                <strong>{chapter.node.title}</strong>
                <span className="command-chip">
                  {chapter.children.length} scenes
                </span>
              </div>
              {chapter.children.map((sceneNode) => (
                <button
                  key={sceneNode.id}
                  className={`theme-card${sceneNode.id === selectedSceneId ? ' is-active' : ''}`}
                  onClick={() => setSelectedSceneId(sceneNode.id)}
                  type="button"
                >
                  <strong>{sceneNode.title}</strong>
                  <span>{sceneNode.summary || 'No summary'}</span>
                  <span className="scene-card-meta">
                    <span>{sceneNode.slug}</span>
                    <span>{sceneNode.updatedAt}</span>
                  </span>
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
              <div className="mode-strip" aria-label="manuscript modes">
                <button
                  className={`mode-chip${mode === 'draft' ? ' is-active' : ''}`}
                  onClick={() => setMode('draft')}
                  type="button"
                >
                  Draft
                </button>
                <button
                  className={`mode-chip${mode === 'split' ? ' is-active' : ''}`}
                  onClick={() => setMode('split')}
                  type="button"
                >
                  Split
                </button>
                <button
                  className={`mode-chip${mode === 'book' ? ' is-active' : ''}`}
                  onClick={() => setMode('book')}
                  type="button"
                >
                  Book
                </button>
              </div>
              <span className={`command-chip${dirty ? ' is-dirty' : ''}`}>
                {dirty ? 'Dirty' : status}
              </span>
            </div>
            <div className="manuscript-meta" aria-label="manuscript facts">
              <span className="command-chip">{scene.node.id}</span>
              <span className="command-chip">{scene.node.slug}</span>
              <span className="command-chip">
                Updated {scene.node.updatedAt}
              </span>
            </div>
            <div className="manuscript-studio" aria-label="manuscript studio">
              <div className="studio-card">
                <span>Chapter</span>
                <strong>{activeChapter?.node.title ?? 'Loose scene'}</strong>
              </div>
              <div className="studio-card">
                <span>Order</span>
                <strong>
                  {activeChapter
                    ? `${activeChapter.node.position}.${activeSceneIndex}`
                    : scene.node.position}
                </strong>
              </div>
              <div className="studio-card">
                <span>Words</span>
                <strong>{wordCount}</strong>
              </div>
              <div className="studio-card">
                <span>Read</span>
                <strong>{readingMinutes} min</strong>
              </div>
              <div className="studio-card">
                <span>Mentions</span>
                <strong>{scene.mentions.length}</strong>
              </div>
              <div className="studio-card">
                <span>Summary</span>
                <strong>{draftSummary.trim() ? 'set' : 'empty'}</strong>
              </div>
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
              <div
                className="manuscript-links"
                aria-label="manuscript mentions"
              >
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
      {scene && mode !== 'draft' ? (
        <aside
          className="book-preview premium-book-preview"
          aria-label="book preview"
        >
          <div className="book-aura" />
          <div className="book-toolbar">
            <p className="eyebrow">Book Preview</p>
            <span className="command-chip">{bookPages.length} pages</span>
          </div>
          <div className="spread-shell">
            {bookPages.slice(0, 2).map((page, index) => (
              <article
                key={`${page.title}-${index}`}
                className={`book-page${page.isChapterBreak ? ' is-chapter-break' : ''}`}
                aria-label={
                  page.isChapterBreak ? 'chapter break page' : 'book page'
                }
              >
                <span className="page-corner" aria-hidden="true" />
                <span className="page-sheen" aria-hidden="true" />
                <div className="book-running">
                  <span>{activeChapter?.node.title ?? 'Loose scene'}</span>
                  <span>{index + 1}</span>
                </div>
                {page.isChapterBreak ? (
                  <div className="chapter-break">
                    <p className="eyebrow">Chapter Break</p>
                    <h2>{page.title}</h2>
                    <p className="page-lede">{page.lede}</p>
                  </div>
                ) : (
                  <>
                    <h2>{page.title}</h2>
                    <p className="page-lede">{page.lede}</p>
                    <div className="page-body">
                      {page.paragraphs.map((paragraph) => (
                        <p key={paragraph}>{paragraph}</p>
                      ))}
                    </div>
                  </>
                )}
                <div className="book-foot">
                  <span>{mode === 'split' ? 'Split' : 'Book'}</span>
                  <span>{scene.node.slug}</span>
                </div>
              </article>
            ))}
          </div>
        </aside>
      ) : null}
    </section>
  );
}

function countWords(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/\s+/).length;
}

function buildBookPages(
  chapterTitle: string,
  sceneTitle: string,
  summary: string,
  body: string
) {
  const paragraphs = splitBody(body);

  return [
    {
      title: chapterTitle,
      lede: summary || 'Scene opens.',
      paragraphs: [] as string[],
      isChapterBreak: true
    },
    {
      title: sceneTitle,
      lede: summary || 'Scene draft.',
      paragraphs,
      isChapterBreak: false
    }
  ];
}

function splitBody(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return ['No scene body yet.'];
  }

  return trimmed
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}
