import { useMemo, useState } from 'react';
import type { EntityRecord } from '../modules/entity-model/types';
import type {
  EntityBacklink,
  ManuscriptSceneDetail,
  ManuscriptTreeItem
} from '../modules/manuscript/contracts';

type ManuscriptLensProps = {
  backlinkCount: number;
  draftBody: string;
  draftSummary: string;
  draftTitle: string;
  dirty: boolean;
  latestBacklinkTitle: string | null;
  mentionOptions: EntityRecord[];
  onCreateChapter: (title: string) => Promise<void>;
  onCreateScene: (input: {
    chapterId: string;
    title: string;
    summary?: string;
    body?: string;
    seedEntityId?: string;
  }) => Promise<void>;
  onInsertMention: (entityId?: string) => void;
  onMentionSelect: (entityId: string) => void;
  onOpenTimelineEntity: (entityId: string) => void;
  onOpenTimelineContext: () => void;
  onOpenWikiContext: () => void;
  onDraftBodyChange: (value: string) => void;
  onDraftBodyCursorChange: (start: number | null, end: number | null) => void;
  onDraftSummaryChange: (value: string) => void;
  onDraftTitleChange: (value: string) => void;
  scene: ManuscriptSceneDetail | null;
  sceneContextBacklinks: EntityBacklink[];
  selectedEntity: EntityRecord | null;
  selectedSceneId: string | null;
  setSelectedSceneId: (id: string) => void;
  status: string;
  tree: ManuscriptTreeItem[];
  timelineContext: EntityRecord[];
  year: number;
};

export function ManuscriptLens({
  backlinkCount,
  draftBody,
  draftSummary,
  draftTitle,
  dirty,
  latestBacklinkTitle,
  mentionOptions,
  onCreateChapter,
  onCreateScene,
  onInsertMention,
  onMentionSelect,
  onOpenTimelineEntity,
  onOpenTimelineContext,
  onOpenWikiContext,
  onDraftBodyChange,
  onDraftBodyCursorChange,
  onDraftSummaryChange,
  onDraftTitleChange,
  scene,
  sceneContextBacklinks,
  selectedEntity,
  selectedSceneId,
  setSelectedSceneId,
  status,
  tree,
  timelineContext,
  year
}: ManuscriptLensProps) {
  const backlinkLookup = useMemo(
    () =>
      new Map(
        sceneContextBacklinks.map((backlink) => [backlink.nodeId, backlink])
      ),
    [sceneContextBacklinks]
  );
  const chapterBacklinkCounts = useMemo(() => {
    const counts = new Map<string, number>();

    sceneContextBacklinks.forEach((backlink) => {
      counts.set(
        backlink.chapterId,
        (counts.get(backlink.chapterId) ?? 0) + 1
      );
    });

    return counts;
  }, [sceneContextBacklinks]);
  const continuityChapters = useMemo(() => {
    const seen = new Set<string>();

    return sceneContextBacklinks.filter((backlink) => {
      if (seen.has(backlink.chapterId)) {
        return false;
      }

      seen.add(backlink.chapterId);
      return true;
    });
  }, [sceneContextBacklinks]);
  const activeChapter =
    tree.find((chapter) =>
      chapter.children.some((sceneNode) => sceneNode.id === selectedSceneId)
    ) ?? null;
  const [mode, setMode] = useState<'draft' | 'split' | 'book'>('draft');
  const [chapterTitle, setChapterTitle] = useState('');
  const [sceneChapterId, setSceneChapterId] = useState('');
  const [sceneTitle, setSceneTitle] = useState('');
  const [sceneSummary, setSceneSummary] = useState('');
  const [sceneBody, setSceneBody] = useState('');
  const [seedSceneContext, setSeedSceneContext] = useState(true);
  const [compositionMode, setCompositionMode] = useState<
    'free' | 'opening' | 'continuation'
  >('free');
  const [sceneLaunchReceipt, setSceneLaunchReceipt] = useState<{
    chapterId: string;
    chapterTitle: string;
    mode: 'free' | 'opening' | 'continuation';
    seeded: boolean;
    title: string;
  } | null>(null);
  const selectedCreateChapter =
    tree.find(
      (chapter) =>
        chapter.node.id ===
        (sceneChapterId || activeChapter?.node.id || tree[0]?.node.id || '')
    ) ?? null;
  const launchedSceneMatch = sceneLaunchReceipt
    ? tree
        .find((chapter) => chapter.node.id === sceneLaunchReceipt.chapterId)
        ?.children.find((sceneNode) => sceneNode.title === sceneLaunchReceipt.title) ??
      null
    : null;
  const selectedCreateChapterNextScene =
    (selectedCreateChapter?.children.length ?? 0) + 1;
  const wordCount = countWords(draftBody);
  const readingMinutes = Math.max(1, Math.ceil(wordCount / 180));
  const activeSceneIndex = activeChapter
    ? activeChapter.children.findIndex(
        (sceneNode) => sceneNode.id === selectedSceneId
      ) + 1
    : 0;
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
  const createScaffold = selectedEntity
    ? buildSceneScaffold(selectedEntity, latestBacklinkTitle)
    : null;
  const compositionGuide = buildCompositionGuide(
    compositionMode,
    selectedEntity,
    selectedCreateChapter?.node.title ?? 'Loose scene'
  );
  const compositionBeats = buildCompositionBeats(
    compositionMode,
    selectedEntity?.common.title ?? 'Scene',
    selectedCreateChapter?.node.title ?? 'Loose scene',
    latestBacklinkTitle
  );
  const compositionBlocks = buildCompositionBlocks(
    compositionMode,
    selectedEntity?.common.title ?? 'Scene',
    selectedCreateChapter?.node.title ?? 'Loose scene',
    latestBacklinkTitle
  );
  const compositionQueue = buildCompositionQueue(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapterNextScene,
    chapterBacklinkCounts.get(selectedCreateChapter?.node.id ?? '') ?? 0,
    latestBacklinkTitle
  );
  const compositionLanes = buildCompositionLanes(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const chapterOrdering = buildChapterOrdering(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const sceneLaneCards = buildSceneLaneCards(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const sceneSequence = buildSceneSequence(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const sceneOutline = buildSceneOutline(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const sceneStoryboard = buildSceneStoryboard(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const scenePlanningStrip = buildScenePlanningStrip(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const scenePlanningDesk = buildScenePlanningDesk(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const scenePlanningHud = buildScenePlanningHud(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    selectedCreateChapter?.children.map((sceneNode) => sceneNode.title) ?? [],
    selectedCreateChapterNextScene,
    latestBacklinkTitle
  );
  const scenePlanningCommands = buildScenePlanningCommands(
    selectedCreateChapter?.node.title ?? 'Loose scene',
    latestBacklinkTitle
  );
  const sceneLaunchBar = buildSceneLaunchBar(
    sceneChapterId || activeChapter?.node.id || tree[0]?.node.id || '',
    selectedCreateChapter?.node.title ?? activeChapter?.node.title ?? 'Loose scene',
    sceneTitle.trim(),
    sceneSummary.trim(),
    sceneBody.trim(),
    compositionMode,
    seedSceneContext && Boolean(selectedEntity)
  );
  const sceneHandoffQueue = scene
    ? buildSceneHandoffQueue(
        activeChapter?.node.title ?? 'Loose scene',
        scene.node.title,
        activeSceneIndex > 0 ? activeSceneIndex + 1 : 1
      )
    : [];

  const applyQueueChapterOpener = () => {
    if (!selectedEntity || !selectedCreateChapter) {
      return;
    }

    setCompositionMode('opening');
    setSceneTitle(
      `${selectedCreateChapter.node.title} scene ${selectedCreateChapterNextScene}`
    );
    setSceneSummary(
      `Open ${selectedCreateChapter.node.title} with ${selectedEntity.common.title} in motion.`
    );
    setSceneBody(
      `${selectedEntity.common.title}\n\nChapter lane: ${selectedCreateChapter.node.title}\nScene slot: ${selectedCreateChapterNextScene}\nOpening image:\nPressure introduced:\nWhy this slot matters now:`
    );
  };

  const applyQueueReserveSlot = () => {
    if (!selectedEntity || !selectedCreateChapter) {
      return;
    }

    setCompositionMode('free');
    setSceneTitle(
      `${selectedCreateChapter.node.title} reserve scene ${selectedCreateChapterNextScene}`
    );
    setSceneSummary(
      `Hold a flexible slot inside ${selectedCreateChapter.node.title}.`
    );
    setSceneBody(
      `${selectedEntity.common.title}\n\nChapter lane: ${selectedCreateChapter.node.title}\nReserve slot: ${selectedCreateChapterNextScene}\nPressure frame:\nResponse beat:\nVisible change:`
    );
  };

  const applyQueueClosingBeat = () => {
    if (!selectedEntity || !selectedCreateChapter) {
      return;
    }

    setCompositionMode('free');
    setSceneTitle(
      `${selectedCreateChapter.node.title} closing scene ${selectedCreateChapterNextScene}`
    );
    setSceneSummary(
      `Close the active pressure inside ${selectedCreateChapter.node.title}.`
    );
    setSceneBody(
      `${selectedEntity.common.title}\n\nChapter lane: ${selectedCreateChapter.node.title}\nClosing slot: ${selectedCreateChapterNextScene}\nPressure to close:\nVisible cost:\nWhat settles and what remains open:`
    );
  };

  const applyQueueFollowUp = () => {
    if (!selectedEntity || !latestBacklinkTitle) {
      return;
    }

    setCompositionMode('continuation');
    setSceneTitle(`${selectedEntity.common.title} after ${latestBacklinkTitle}`);
    setSceneSummary(
      `Follow the visible consequence after ${latestBacklinkTitle}.`
    );
    setSceneBody(
      `${selectedEntity.common.title}\n\nPrior beat: ${latestBacklinkTitle}\nCarry-over consequence:\nEscalation lane:\nNext scene slot after ${latestBacklinkTitle}:`
    );
  };
  const applySceneLaunchReceiptToCreate = () => {
    if (!sceneLaunchReceipt) {
      return;
    }

    const receiptEntityTitle = selectedEntity?.common.title ?? sceneLaunchReceipt.title;
    setSceneChapterId(sceneLaunchReceipt.chapterId);
    setCompositionMode(sceneLaunchReceipt.mode);
    setSeedSceneContext(sceneLaunchReceipt.seeded);
    setSceneTitle(sceneLaunchReceipt.title);
    setSceneSummary(
      `Resume ${sceneLaunchReceipt.title} inside ${sceneLaunchReceipt.chapterTitle}.`
    );
    setSceneBody(
      `${receiptEntityTitle}\n\nLaunch replay: ${sceneLaunchReceipt.title}\nChapter lane: ${sceneLaunchReceipt.chapterTitle}\nCarry-over pressure:\nWhat shifts immediately:\nWhat must happen next:`
    );
  };
  const applySelectedSceneFollowUp = () => {
    if (!scene) {
      return;
    }

    const currentSceneTitle = scene.node.title;
    const followUpAnchor = selectedEntity?.common.title ?? currentSceneTitle;
    const followUpChapterId = activeChapter?.node.id ?? scene.chapterId;
    const followUpChapterTitle =
      activeChapter?.node.title ?? 'Loose scene';

    setSceneChapterId(followUpChapterId);
    setCompositionMode('continuation');
    setSeedSceneContext(Boolean(selectedEntity));
    setSceneTitle(`${followUpAnchor} after ${currentSceneTitle}`);
    setSceneSummary(`Continue the thread after ${currentSceneTitle}.`);
    setSceneBody(
      `${followUpAnchor}\n\nPrevious scene: ${currentSceneTitle}\nChapter anchor: ${followUpChapterTitle}\nCarry-over tension:\nWhat changes now:\nNext irreversible beat:`
    );
  };
  const applySelectedSceneNextSlot = () => {
    if (!scene) {
      return;
    }

    const currentSceneTitle = scene.node.title;
    const nextSlotChapterId = activeChapter?.node.id ?? scene.chapterId;
    const nextSlotChapterTitle = activeChapter?.node.title ?? 'Loose scene';
    const nextSlotNumber = activeSceneIndex > 0 ? activeSceneIndex + 1 : 1;
    const nextSlotAnchor = selectedEntity?.common.title ?? currentSceneTitle;

    setSceneChapterId(nextSlotChapterId);
    setCompositionMode('continuation');
    setSeedSceneContext(Boolean(selectedEntity));
    setSceneTitle(`${nextSlotChapterTitle} scene ${nextSlotNumber}`);
    setSceneSummary(
      `Carry ${currentSceneTitle} into ${nextSlotChapterTitle} slot ${nextSlotNumber}.`
    );
    setSceneBody(
      `${nextSlotAnchor}\n\nPrevious scene: ${currentSceneTitle}\nChapter lane: ${nextSlotChapterTitle}\nNext slot: ${nextSlotNumber}\nCarry-over pressure:\nNew turn in this slot:\nWhat the reader takes forward:`
    );
  };
  const applySelectedSceneClosingSlot = () => {
    if (!scene) {
      return;
    }

    const currentSceneTitle = scene.node.title;
    const closingChapterId = activeChapter?.node.id ?? scene.chapterId;
    const closingChapterTitle = activeChapter?.node.title ?? 'Loose scene';
    const closingSlotNumber = activeSceneIndex > 0 ? activeSceneIndex + 1 : 1;
    const closingAnchor = selectedEntity?.common.title ?? currentSceneTitle;

    setSceneChapterId(closingChapterId);
    setCompositionMode('free');
    setSeedSceneContext(Boolean(selectedEntity));
    setSceneTitle(`${closingChapterTitle} closing scene ${closingSlotNumber}`);
    setSceneSummary(
      `Close the pressure that follows ${currentSceneTitle} in ${closingChapterTitle}.`
    );
    setSceneBody(
      `${closingAnchor}\n\nPrevious scene: ${currentSceneTitle}\nChapter lane: ${closingChapterTitle}\nClosing slot: ${closingSlotNumber}\nPressure to settle:\nVisible cost:\nWhat closes and what remains open:`
    );
  };
  const applySelectedSceneOpeningSlot = () => {
    if (!scene) {
      return;
    }

    const currentSceneTitle = scene.node.title;
    const openingChapterId = activeChapter?.node.id ?? scene.chapterId;
    const openingChapterTitle = activeChapter?.node.title ?? 'Loose scene';
    const openingAnchor = selectedEntity?.common.title ?? currentSceneTitle;

    setSceneChapterId(openingChapterId);
    setCompositionMode('opening');
    setSeedSceneContext(Boolean(selectedEntity));
    setSceneTitle(`${openingChapterTitle} scene 1`);
    setSceneSummary(
      `Open ${openingChapterTitle} through the fallout of ${currentSceneTitle}.`
    );
    setSceneBody(
      `${openingAnchor}\n\nPrevious scene: ${currentSceneTitle}\nChapter opening: ${openingChapterTitle}\nOpening image:\nPressure introduced:\nWhy this chapter begins here:`
    );
  };

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

        <section className="manuscript-links" aria-label="manuscript create chapter">
          <strong>New chapter</strong>
          <input
            aria-label="create manuscript chapter title"
            className="input"
            onChange={(event) => setChapterTitle(event.target.value)}
            placeholder="Chapter title"
            value={chapterTitle}
          />
          <button
            className="button ghost-button"
            disabled={!chapterTitle.trim()}
            onClick={async () => {
              const nextTitle = chapterTitle.trim();
              if (!nextTitle) {
                return;
              }

              await onCreateChapter(nextTitle);
              setChapterTitle('');
            }}
            type="button"
          >
            Create chapter
          </button>
        </section>

        <section className="manuscript-links" aria-label="manuscript create scene">
          <strong>New scene</strong>
          {selectedEntity ? (
            <div className="manuscript-meta" aria-label="create manuscript scene context">
              <span className="command-chip">{selectedEntity.type}</span>
              <span className="command-chip">{selectedEntity.common.id}</span>
              <button
                className="button ghost-button"
                onClick={() => {
                  setSceneTitle(`${selectedEntity.common.title} scene`);
                  setSceneSummary(
                    selectedEntity.common.summary ||
                      `Scene seeded from ${selectedEntity.common.title}`
                  );
                  setSceneBody(
                    `${selectedEntity.common.title}\n\n${selectedEntity.common.summary || 'Write the immediate dramatic turn here.'}`
                  );
                }}
                type="button"
              >
                Seed scene draft
              </button>
              <button
                className={`button ghost-button${seedSceneContext ? ' is-active' : ''}`}
                onClick={() => setSeedSceneContext((current) => !current)}
                type="button"
              >
                {seedSceneContext ? 'Seed selected context on' : 'Seed selected context off'}
              </button>
            </div>
          ) : null}
          {createScaffold ? (
            <div
              className="detail-authoring-actions"
              aria-label="manuscript scene scaffolds"
            >
              <button
                className="button ghost-button"
                onClick={() => {
                  setCompositionMode('free');
                  setSceneTitle(`${selectedEntity.common.title} scene`);
                  setSceneSummary(createScaffold.summary);
                  setSceneBody(createScaffold.body);
                }}
                type="button"
              >
                Use scene scaffold
              </button>
              {createScaffold.continuation ? (
                <button
                  className="button ghost-button"
                  onClick={() => {
                    setCompositionMode('continuation');
                    setSceneTitle(`${selectedEntity.common.title} aftermath`);
                    setSceneSummary(createScaffold.continuation.summary);
                    setSceneBody(createScaffold.continuation.body);
                  }}
                  type="button"
                >
                  Continue linked thread
                </button>
              ) : null}
            </div>
          ) : null}
          {selectedEntity && sceneContextBacklinks.length ? (
            <div
              className="manuscript-links"
              aria-label="manuscript scene continuity"
            >
              <strong>Scene continuity</strong>
              <div className="detail-authoring-actions mention-picker">
                {sceneContextBacklinks.slice(0, 3).map((backlink) => (
                  <button
                    key={backlink.nodeId}
                    className="button ghost-button"
                    onClick={() => {
                      setCompositionMode('continuation');
                      setSceneTitle(
                        `${selectedEntity.common.title} after ${backlink.sceneTitle}`
                      );
                      setSceneSummary(
                        `Continue the thread after ${backlink.sceneTitle}.`
                      );
                      setSceneBody(
                        `${selectedEntity.common.title}\n\nPrevious scene: ${backlink.sceneTitle}\nChapter anchor: ${backlink.chapterTitle}\nCarry-over tension:\nWhat changes now:\nNext irreversible beat:`
                      );
                    }}
                    type="button"
                  >
                    {backlink.sceneTitle}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {selectedEntity && continuityChapters.length ? (
            <div
              className="manuscript-links"
              aria-label="manuscript chapter affinity"
            >
              <strong>Chapter affinity</strong>
              <div className="detail-authoring-actions mention-picker">
                {continuityChapters.map((backlink) => (
                  <button
                    key={backlink.chapterId}
                    className={`button ghost-button${
                      (sceneChapterId || activeChapter?.node.id || tree[0]?.node.id || '') ===
                      backlink.chapterId
                        ? ' is-active'
                        : ''
                    }`}
                    onClick={() => {
                      setCompositionMode('opening');
                      setSceneChapterId(backlink.chapterId);
                    }}
                    type="button"
                  >
                    {backlink.chapterTitle}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          {selectedCreateChapter ? (
            <div
              className="manuscript-links"
              aria-label="manuscript chapter rhythm"
            >
              <strong>Chapter rhythm</strong>
              <div className="manuscript-meta">
                <span className="command-chip">
                  {selectedCreateChapter.node.title}
                </span>
                <span className="command-chip">
                  Next scene {selectedCreateChapterNextScene}
                </span>
                <span className="command-chip">
                  {chapterBacklinkCounts.get(selectedCreateChapter.node.id) ?? 0} linked
                </span>
                <span className="command-chip">
                  Mode {compositionMode}
                </span>
              </div>
              {selectedEntity ? (
                <div className="detail-authoring-actions">
                  <button
                    className="button ghost-button"
                    onClick={() => {
                      setCompositionMode('opening');
                      setSceneTitle(
                        `${selectedCreateChapter.node.title} scene ${selectedCreateChapterNextScene}`
                      );
                      setSceneSummary(
                        `Place ${selectedEntity.common.title} into ${selectedCreateChapter.node.title}.`
                      );
                      setSceneBody(
                        `${selectedEntity.common.title}\n\nChapter lane: ${selectedCreateChapter.node.title}\nScene slot: ${selectedCreateChapterNextScene}\nOpening beat:\nPressure carried in:\nWhat changes by the end:`
                      );
                    }}
                    type="button"
                  >
                    Seed chapter beat
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          {selectedEntity && selectedCreateChapter ? (
            <div
              className="manuscript-links"
              aria-label="manuscript composition queue"
            >
              <strong>Composition queue</strong>
              <div className="theme-stack">
                {compositionQueue.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.value}</span>
                    <span>{entry.tone}</span>
                  </article>
                ))}
              </div>
              <div className="theme-stack" aria-label="manuscript queue lanes">
                {compositionLanes.map((lane) => (
                  <article key={lane.label} className="theme-card is-active">
                    <strong>{lane.label}</strong>
                    <span>{lane.slot}</span>
                    <span>{lane.note}</span>
                    <span>{lane.tone}</span>
                  </article>
                ))}
              </div>
              <div
                className="theme-stack"
                aria-label="manuscript chapter ordering"
              >
                {chapterOrdering.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.value}</span>
                    <span>{entry.note}</span>
                  </article>
                ))}
              </div>
              <div className="theme-stack" aria-label="manuscript scene lanes">
                {sceneLaneCards.map((lane) => (
                  <article key={lane.label} className="theme-card is-active">
                    <strong>{lane.label}</strong>
                    <span>{lane.slot}</span>
                    <span>{lane.note}</span>
                    <span>{lane.status}</span>
                    <button
                      className="button ghost-button"
                      disabled={lane.key === 'followup' && !latestBacklinkTitle}
                      onClick={() => {
                        if (lane.key === 'opening') {
                          applyQueueChapterOpener();
                          return;
                        }

                        if (lane.key === 'reserve') {
                          applyQueueReserveSlot();
                          return;
                        }

                        if (lane.key === 'closing') {
                          applyQueueClosingBeat();
                          return;
                        }

                        applyQueueFollowUp();
                      }}
                      type="button"
                    >
                      Use lane
                    </button>
                  </article>
                ))}
              </div>
              <div
                className="theme-stack"
                aria-label="manuscript scene sequence"
              >
                {sceneSequence.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.slot}</span>
                    <span>{entry.note}</span>
                    <button
                      className="button ghost-button"
                      disabled={entry.key === 'followup' && !latestBacklinkTitle}
                      onClick={() => {
                        if (entry.key === 'next') {
                          applyQueueChapterOpener();
                          return;
                        }

                        if (entry.key === 'closing') {
                          applyQueueClosingBeat();
                          return;
                        }

                        applyQueueFollowUp();
                      }}
                      type="button"
                    >
                      Use sequence
                    </button>
                  </article>
                ))}
              </div>
              <div className="theme-stack" aria-label="manuscript scene outline">
                {sceneOutline.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.slot}</span>
                    <span>{entry.note}</span>
                    <button
                      className="button ghost-button"
                      disabled={entry.key === 'previous'}
                      onClick={() => {
                        if (entry.key === 'next') {
                          applyQueueChapterOpener();
                          return;
                        }

                        applyQueueFollowUp();
                      }}
                      type="button"
                    >
                      Use outline
                    </button>
                  </article>
                ))}
              </div>
              <div
                className="theme-stack"
                aria-label="manuscript scene storyboard"
              >
                {sceneStoryboard.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.slot}</span>
                    <span>{entry.note}</span>
                    <span>{entry.status}</span>
                    <button
                      className="button ghost-button"
                      disabled={entry.key === 'previous'}
                      onClick={() => {
                        if (entry.key === 'current') {
                          applyQueueChapterOpener();
                          return;
                        }

                        applyQueueFollowUp();
                      }}
                      type="button"
                    >
                      Use storyboard
                    </button>
                  </article>
                ))}
              </div>
              <div
                className="manuscript-meta"
                aria-label="manuscript scene planning strip"
              >
                {scenePlanningStrip.map((entry) => (
                  <button
                    key={entry.label}
                    className="button ghost-button"
                    disabled={entry.key === 'previous'}
                    onClick={() => {
                      if (entry.key === 'current') {
                        applyQueueChapterOpener();
                        return;
                      }

                      applyQueueFollowUp();
                    }}
                    type="button"
                  >
                    {entry.label} {entry.value}
                  </button>
                ))}
              </div>
              <div className="theme-stack" aria-label="manuscript scene planning desk">
                {scenePlanningDesk.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.value}</span>
                    <span>{entry.note}</span>
                    <button
                      className="button ghost-button"
                      disabled={entry.key === 'previous'}
                      onClick={() => {
                        if (entry.key === 'current') {
                          applyQueueChapterOpener();
                          return;
                        }

                        applyQueueFollowUp();
                      }}
                      type="button"
                    >
                      Use desk
                    </button>
                  </article>
                ))}
              </div>
              <div className="manuscript-meta" aria-label="manuscript scene planning hud">
                {scenePlanningHud.map((entry) => (
                  <button
                    key={entry.label}
                    className="button ghost-button"
                    disabled={entry.key === 'previous'}
                    onClick={() => {
                      if (entry.key === 'current') {
                        applyQueueChapterOpener();
                        return;
                      }

                      applyQueueFollowUp();
                    }}
                    type="button"
                  >
                    {entry.label} {entry.value}
                  </button>
                ))}
              </div>
              <div
                className="manuscript-meta"
                aria-label="manuscript scene planning commands"
              >
                {scenePlanningCommands.map((entry) => (
                  <button
                    key={entry.label}
                    className="button ghost-button"
                    disabled={entry.key === 'after' && !latestBacklinkTitle}
                    onClick={() => {
                      if (entry.key === 'open') {
                        applyQueueChapterOpener();
                        return;
                      }

                      if (entry.key === 'reserve') {
                        applyQueueReserveSlot();
                        return;
                      }

                      if (entry.key === 'close') {
                        applyQueueClosingBeat();
                        return;
                      }

                      applyQueueFollowUp();
                    }}
                    type="button"
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
              <div className="detail-authoring-actions">
                <button
                  className="button ghost-button"
                  onClick={applyQueueChapterOpener}
                  type="button"
                >
                  Queue chapter opener
                  </button>
                <button
                  className="button ghost-button"
                  onClick={applyQueueReserveSlot}
                  type="button"
                >
                  Queue reserve slot
                </button>
                <button
                  className="button ghost-button"
                  onClick={applyQueueClosingBeat}
                  type="button"
                >
                  Queue closing beat
                </button>
                {latestBacklinkTitle ? (
                  <button
                    className="button ghost-button"
                    onClick={applyQueueFollowUp}
                    type="button"
                  >
                    Queue follow-up
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}
          <div
            className="manuscript-links"
            aria-label="manuscript composition guide"
          >
            <strong>{compositionGuide.title}</strong>
            <div className="theme-stack">
              {compositionGuide.prompts.map((prompt) => (
                <article key={prompt} className="theme-card is-active">
                  <span>{prompt}</span>
                </article>
              ))}
            </div>
            <div
              className="detail-authoring-actions"
              aria-label="manuscript composition beats"
            >
              {compositionBeats.map((beat) => (
                <button
                  key={beat.label}
                  className="button ghost-button"
                  onClick={() => {
                    if (sceneBody.includes(beat.text)) {
                      return;
                    }

                    const nextBody = sceneBody.trim()
                      ? `${sceneBody.trim()}\n${beat.text}`
                      : beat.text;
                    setSceneBody(nextBody);
                  }}
                  type="button"
                >
                  {beat.label}
                </button>
              ))}
            </div>
            <div
              className="theme-stack"
              aria-label="manuscript composition blocks"
            >
              {compositionBlocks.map((block) => {
                const active = sceneBody.includes(block.text);

                return (
                  <article key={block.label} className="theme-card is-active">
                    <strong>{block.label}</strong>
                    <span>{active ? 'ready' : 'pending'}</span>
                    <button
                      className="button ghost-button"
                      onClick={() => {
                        if (active) {
                          return;
                        }

                        const nextBody = sceneBody.trim()
                          ? `${sceneBody.trim()}\n${block.text}`
                          : block.text;
                        setSceneBody(nextBody);
                      }}
                      type="button"
                    >
                      Add block
                    </button>
                  </article>
                );
              })}
            </div>
            {selectedEntity ? (
              <div
                className="detail-authoring-actions"
                aria-label="manuscript composition deck"
              >
                <button
                  className="button ghost-button"
                  onClick={() => {
                    setCompositionMode('free');
                    setSceneTitle(`${selectedEntity.common.title} scene`);
                    setSceneSummary(
                      `Frame ${selectedEntity.common.title} through one clear pressure.`
                    );
                    setSceneBody(
                      `${selectedEntity.common.title}\n\nPressure frame:\nResponse beat:\nVisible change:`
                    );
                  }}
                  type="button"
                >
                  Apply free scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={() => {
                    setCompositionMode('opening');
                    const chapterName =
                      selectedCreateChapter?.node.title ?? 'Loose scene';
                    const nextSceneNumber =
                      (selectedCreateChapter?.children.length ?? 0) + 1;
                    setSceneTitle(`${chapterName} scene ${nextSceneNumber}`);
                    setSceneSummary(
                      `Open ${chapterName} through ${selectedEntity.common.title}.`
                    );
                    setSceneBody(
                      `${selectedEntity.common.title}\n\nChapter opening:\nFirst impression of ${chapterName}:\nPressure introduced:\nWhat the reader should carry forward:`
                    );
                  }}
                  type="button"
                >
                  Apply opening scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={() => {
                    setCompositionMode('continuation');
                    const previousScene = latestBacklinkTitle ?? 'prior scene';
                    setSceneTitle(
                      `${selectedEntity.common.title} after ${previousScene}`
                    );
                    setSceneSummary(
                      `Continue the fallout after ${previousScene}.`
                    );
                    setSceneBody(
                      `${selectedEntity.common.title}\n\nPrior beat: ${previousScene}\nCarry-over consequence:\nEscalation:\nIrreversible turn:`
                    );
                  }}
                  type="button"
                >
                  Apply continuation
                </button>
              </div>
            ) : null}
            <div
              className="manuscript-meta"
              aria-label="manuscript composition ledger"
            >
              <span className="command-chip">Mode {compositionMode}</span>
              <span className="command-chip">
                Chapter {selectedCreateChapter?.node.title ?? 'Loose scene'}
              </span>
              <span className="command-chip">
                Anchor {latestBacklinkTitle ?? 'none'}
              </span>
              <span className="command-chip">
                Entity {selectedEntity?.common.id ?? 'none'}
              </span>
            </div>
          </div>
          <select
            aria-label="create manuscript scene chapter"
            className="input select"
            onChange={(event) => setSceneChapterId(event.target.value)}
            value={sceneChapterId || activeChapter?.node.id || tree[0]?.node.id || ''}
          >
            <option value="">Select chapter</option>
            {tree.map((chapter) => (
              <option key={chapter.node.id} value={chapter.node.id}>
                {chapter.node.title}
              </option>
            ))}
          </select>
          <input
            aria-label="create manuscript scene title"
            className="input"
            onChange={(event) => setSceneTitle(event.target.value)}
            placeholder="Scene title"
            value={sceneTitle}
          />
          <textarea
            aria-label="create manuscript scene summary"
            className="textarea"
            onChange={(event) => setSceneSummary(event.target.value)}
            placeholder="Scene summary"
            value={sceneSummary}
          />
          <textarea
            aria-label="create manuscript scene body"
            className="textarea"
            onChange={(event) => setSceneBody(event.target.value)}
            placeholder="Scene body"
            value={sceneBody}
          />
          <div className="manuscript-meta" aria-label="manuscript scene launch bar">
            {sceneLaunchBar.map((entry) => (
              <span key={entry.label} className="command-chip">
                {entry.label} {entry.value}
              </span>
            ))}
          </div>
          {sceneLaunchReceipt ? (
            <div aria-label="manuscript scene launch receipt">
              <div className="manuscript-meta">
                <span className="command-chip">
                  Launched {sceneLaunchReceipt.title}
                </span>
                <span className="command-chip">
                  Chapter {sceneLaunchReceipt.chapterTitle}
                </span>
                <span className="command-chip">
                  Mode {sceneLaunchReceipt.mode}
                </span>
                <span className="command-chip">
                  Seed {sceneLaunchReceipt.seeded ? 'on' : 'off'}
                </span>
              </div>
              {launchedSceneMatch ? (
                <div className="detail-authoring-actions">
                  <button
                    className="button ghost-button"
                    onClick={() => setSelectedSceneId(launchedSceneMatch.id)}
                    type="button"
                  >
                    Focus launched scene
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
          <button
            className="button ghost-button"
            disabled={
              !(
                (sceneChapterId || activeChapter?.node.id || tree[0]?.node.id) &&
                sceneTitle.trim()
              )
            }
            onClick={async () => {
              const chapterId =
                sceneChapterId || activeChapter?.node.id || tree[0]?.node.id;
              const nextTitle = sceneTitle.trim();

              if (!chapterId || !nextTitle) {
                return;
              }

              const launchChapterTitle =
                tree.find((chapter) => chapter.node.id === chapterId)?.node.title ??
                activeChapter?.node.title ??
                'Loose scene';
              const launchSeeded = seedSceneContext && Boolean(selectedEntity);

              await onCreateScene({
                chapterId,
                title: nextTitle,
                summary: sceneSummary.trim() || undefined,
                body: sceneBody.trim() || undefined,
                seedEntityId:
                  launchSeeded && selectedEntity
                    ? selectedEntity.common.id
                    : undefined
              });
              setSceneLaunchReceipt({
                chapterId,
                chapterTitle: launchChapterTitle,
                mode: compositionMode,
                seeded: launchSeeded,
                title: nextTitle
              });
              setSceneChapterId('');
              setSceneTitle('');
              setSceneSummary('');
              setSceneBody('');
              setCompositionMode('free');
            }}
            type="button"
          >
            Create scene
          </button>
        </section>

        {tree.length ? (
          tree.map((chapter) => (
            <section
              key={chapter.node.id}
              className="manuscript-links"
              aria-label={`${chapter.node.title} chapter`}
            >
              <div className="chapter-head">
                <strong>{chapter.node.title}</strong>
                <div className="manuscript-meta">
                  <span className="command-chip">
                    {chapter.children.length} scenes
                  </span>
                  {chapterBacklinkCounts.get(chapter.node.id) ? (
                    <span className="command-chip">
                      {chapterBacklinkCounts.get(chapter.node.id)} linked
                    </span>
                  ) : null}
                  {sceneLaunchReceipt?.chapterTitle === chapter.node.title ? (
                    <span className="command-chip">
                      Recent launch {sceneLaunchReceipt.title}
                    </span>
                  ) : null}
                </div>
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
                  {sceneLaunchReceipt?.chapterTitle === chapter.node.title &&
                  sceneLaunchReceipt.title === sceneNode.title ? (
                    <span
                      className="manuscript-meta"
                      aria-label={`${sceneNode.title} launch badge`}
                    >
                      <span className="command-chip">Recent launch</span>
                      <span className="command-chip">
                        Mode {sceneLaunchReceipt.mode}
                      </span>
                    </span>
                  ) : null}
                  {backlinkLookup.get(sceneNode.id) ? (
                    <span
                      className="manuscript-meta"
                      aria-label={`${sceneNode.title} continuity badge`}
                    >
                      <span className="command-chip">Linked scene</span>
                      <span className="command-chip">
                        {backlinkLookup.get(sceneNode.id)?.label}
                      </span>
                    </span>
                  ) : null}
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
            <section className="manuscript-links" aria-label="manuscript bridge">
              <strong>World link</strong>
              {sceneLaunchReceipt ? (
                <div className="manuscript-meta">
                  <span className="command-chip">
                    Last launch {sceneLaunchReceipt.title}
                  </span>
                  <span className="command-chip">
                    Chapter {sceneLaunchReceipt.chapterTitle}
                  </span>
                </div>
              ) : null}
              {selectedEntity ? (
                <>
                  <div className="manuscript-meta">
                    <span className="command-chip">{selectedEntity.type}</span>
                    <span className="command-chip">
                      {selectedEntity.common.id}
                    </span>
                    <span className="command-chip">Visible at {year}</span>
                    <span className="command-chip">
                      Backlinks {backlinkCount}
                    </span>
                  </div>
                  <p className="copy">{selectedEntity.common.title}</p>
                  <div className="detail-authoring-actions">
                    <button
                      className="button ghost-button"
                      onClick={() => onInsertMention()}
                      type="button"
                    >
                      Insert mention
                    </button>
                    <button
                      className="button ghost-button"
                      onClick={onOpenWikiContext}
                      type="button"
                    >
                      Open wiki
                    </button>
                    <button
                      className="button ghost-button"
                      onClick={onOpenTimelineContext}
                      type="button"
                    >
                      Open timeline
                    </button>
                  </div>
                </>
              ) : (
                <p className="empty">Select entity for scene bridge.</p>
              )}
            </section>
            {mentionOptions.length ? (
              <section
                className="manuscript-links"
                aria-label="manuscript mention picker"
              >
                <strong>Quick mentions</strong>
                <div className="detail-authoring-actions mention-picker">
                  {mentionOptions.map((record) => (
                    <button
                      key={record.common.id}
                      className="button ghost-button"
                      onClick={() => onInsertMention(record.common.id)}
                      type="button"
                    >
                      {record.common.title}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            {timelineContext.length ? (
              <section
                className="manuscript-links"
                aria-label="manuscript timeline context"
              >
                <strong>Timeline context</strong>
                <div className="detail-authoring-actions mention-picker">
                  {timelineContext.map((record) => (
                    <button
                      key={record.common.id}
                      className="button ghost-button"
                      onClick={() => onOpenTimelineEntity(record.common.id)}
                      type="button"
                    >
                      {record.common.title} @ {record.common.startYear ?? year}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            <section
              className="manuscript-links"
              aria-label="manuscript scene handoff"
            >
              <strong>Scene handoff</strong>
              <div className="manuscript-meta">
                <span className="command-chip">{scene.node.title}</span>
                <span className="command-chip">
                  Chapter {activeChapter?.node.title ?? 'Loose scene'}
                </span>
                <span className="command-chip">
                  Next slot {activeSceneIndex > 0 ? activeSceneIndex + 1 : 1}
                </span>
              </div>
              <div className="theme-stack" aria-label="manuscript scene handoff rhythm">
                {sceneHandoffQueue.map((entry) => (
                  <article key={entry.label} className="theme-card is-active">
                    <strong>{entry.label}</strong>
                    <span>{entry.text}</span>
                  </article>
                ))}
              </div>
              <div className="detail-authoring-actions">
                <button
                  className="button ghost-button"
                  onClick={applySelectedSceneFollowUp}
                  type="button"
                >
                  Draft follow-up from scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={applySelectedSceneOpeningSlot}
                  type="button"
                >
                  Queue opening from scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={applySelectedSceneNextSlot}
                  type="button"
                >
                  Queue next slot from scene
                </button>
                <button
                  className="button ghost-button"
                  onClick={applySelectedSceneClosingSlot}
                  type="button"
                >
                  Queue closing from scene
                </button>
              </div>
            </section>
            {sceneLaunchReceipt && sceneLaunchReceipt.title === scene.title ? (
              <section
                className="manuscript-links"
                aria-label="manuscript selected launch"
              >
                <strong>Last launch</strong>
                <div className="manuscript-meta">
                  <span className="command-chip">
                    {sceneLaunchReceipt.title}
                  </span>
                  <span className="command-chip">
                    Chapter {sceneLaunchReceipt.chapterTitle}
                  </span>
                  <span className="command-chip">
                    Mode {sceneLaunchReceipt.mode}
                  </span>
                  <span className="command-chip">
                    Seed {sceneLaunchReceipt.seeded ? 'on' : 'off'}
                  </span>
                </div>
                <div className="detail-authoring-actions">
                  <button
                    className="button ghost-button"
                    onClick={applySceneLaunchReceiptToCreate}
                    type="button"
                  >
                    Reuse launch setup
                  </button>
                </div>
              </section>
            ) : null}
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
              onClick={(event) =>
                onDraftBodyCursorChange(
                  event.currentTarget.selectionStart,
                  event.currentTarget.selectionEnd
                )
              }
              onKeyUp={(event) =>
                onDraftBodyCursorChange(
                  event.currentTarget.selectionStart,
                  event.currentTarget.selectionEnd
                )
              }
              onSelect={(event) =>
                onDraftBodyCursorChange(
                  event.currentTarget.selectionStart,
                  event.currentTarget.selectionEnd
                )
              }
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
          <div className="folio-strip" aria-label="folio strip">
            <span className="command-chip">
              Folio {mode === 'split' ? 'Desk' : 'Book'}
            </span>
            <span className="command-chip">
              Chapter {activeChapter?.node.position ?? scene.node.position}
            </span>
            <span className="command-chip">{readingMinutes} min read</span>
            <span className="command-chip">{scene.mentions.length} mentions</span>
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
                <span className="folio-ribbon" aria-hidden="true">
                  {page.isChapterBreak ? 'Chapter' : 'Scene'}
                </span>
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

function buildSceneScaffold(
  entity: EntityRecord,
  latestBacklinkTitle: string | null
) {
  const summary =
    entity.type === 'character'
      ? `Track ${entity.common.title} under pressure.`
      : entity.type === 'location'
        ? `Stage the scene around ${entity.common.title}.`
        : entity.type === 'region'
          ? `Show ${entity.common.title} through active pressure lines.`
          : `Follow the immediate fallout of ${entity.common.title}.`;
  const body =
    entity.type === 'character'
      ? `${entity.common.title}\n\nEntrance beat:\nPressure in the room:\nDecision point:\nExit change:`
      : entity.type === 'location'
        ? `${entity.common.title}\n\nArrival image:\nSpatial obstacle:\nWho uses this place:\nWhat changes by scene end:`
        : entity.type === 'region'
          ? `${entity.common.title}\n\nBorder pressure:\nPower center in focus:\nLocal witness:\nStrategic shift:`
          : `${entity.common.title}\n\nImmediate fallout:\nWho responds first:\nEscalation beat:\nWhat the world now knows:`;

  return {
    summary,
    body,
    continuation: latestBacklinkTitle
      ? {
          summary: `Continue the thread after ${latestBacklinkTitle}.`,
          body: `${entity.common.title}\n\nPrevious scene: ${latestBacklinkTitle}\nCarry-over tension:\nWhat has changed since then:\nNext irreversible beat:`
        }
      : null
  };
}

function buildCompositionGuide(
  mode: 'free' | 'opening' | 'continuation',
  entity: EntityRecord | null,
  chapterTitle: string
) {
  if (mode === 'opening') {
    return {
      title: 'Opening guide',
      prompts: [
        `Establish the lane for ${chapterTitle}.`,
        `Introduce ${entity?.common.title ?? 'the focal thread'} in active motion.`,
        'Leave one unresolved pressure for the next scene.'
      ]
    };
  }

  if (mode === 'continuation') {
    return {
      title: 'Continuation guide',
      prompts: [
        'Carry one concrete consequence from the prior scene.',
        `Escalate ${entity?.common.title ?? 'the focal thread'} instead of reintroducing it.`,
        'End with an irreversible turn.'
      ]
    };
  }

  return {
    title: 'Free scene guide',
    prompts: [
      `Pick the clearest lens on ${entity?.common.title ?? 'the world context'}.`,
      'Stage one pressure, one response, and one visible change.',
      'Keep the summary line specific enough to reuse later.'
    ]
  };
}

function buildCompositionBeats(
  mode: 'free' | 'opening' | 'continuation',
  entityTitle: string,
  chapterTitle: string,
  latestBacklinkTitle: string | null
) {
  if (mode === 'opening') {
    return [
      {
        label: 'Add opening image',
        text: `Opening image: ${chapterTitle} appears through ${entityTitle}.`
      },
      {
        label: 'Add lane pressure',
        text: `Lane pressure: what immediately destabilizes ${chapterTitle}?`
      }
    ];
  }

  if (mode === 'continuation') {
    return [
      {
        label: 'Add consequence',
        text: `Consequence carried from ${latestBacklinkTitle ?? 'the prior scene'}:`
      },
      {
        label: 'Add irreversible turn',
        text: 'Irreversible turn:'
      }
    ];
  }

  return [
    {
      label: 'Add pressure beat',
      text: `Pressure beat for ${entityTitle}:`
    },
    {
      label: 'Add visible change',
      text: 'Visible change by scene end:'
    }
  ];
}

function buildCompositionBlocks(
  mode: 'free' | 'opening' | 'continuation',
  entityTitle: string,
  chapterTitle: string,
  latestBacklinkTitle: string | null
) {
  if (mode === 'opening') {
    return [
      {
        label: 'Chapter opening',
        text: 'Chapter opening:'
      },
      {
        label: 'Chapter threshold',
        text: `First impression of ${chapterTitle}:`
      },
      {
        label: 'Pressure introduced',
        text: 'Pressure introduced:'
      }
    ];
  }

  if (mode === 'continuation') {
    return [
      {
        label: 'Prior beat',
        text: `Prior beat: ${latestBacklinkTitle ?? 'the prior scene'}`
      },
      {
        label: 'Carry-over consequence',
        text: 'Carry-over consequence:'
      },
      {
        label: 'Irreversible turn',
        text: 'Irreversible turn:'
      }
    ];
  }

  return [
    {
      label: 'Pressure frame',
      text: 'Pressure frame:'
    },
    {
      label: 'Response beat',
      text: 'Response beat:'
    },
    {
      label: 'Visible change',
      text: 'Visible change:'
    }
  ];
}

function buildCompositionQueue(
  chapterTitle: string,
  nextSceneNumber: number,
  linkedCount: number,
  latestBacklinkTitle: string | null
) {
  return [
    {
      label: 'Opening slot',
      value: `scene ${nextSceneNumber}`,
      tone: 'active'
    },
    {
      label: 'Continuation anchor',
      value: latestBacklinkTitle ?? 'none',
      tone: latestBacklinkTitle ? 'ready' : 'waiting'
    },
    {
      label: 'Linked load',
      value: `${linkedCount} linked in ${chapterTitle}`,
      tone: linkedCount > 0 ? 'watch' : 'clear'
    }
  ];
}

function buildSceneHandoffQueue(
  chapterTitle: string,
  sceneTitle: string,
  nextSlotNumber: number
) {
  return [
    {
      label: 'Opening handoff',
      text: `Re-open ${chapterTitle} from ${sceneTitle}.`
    },
    {
      label: 'Next slot',
      text: `Carry ${sceneTitle} into slot ${nextSlotNumber}.`
    },
    {
      label: 'Closing handoff',
      text: `Settle the pressure after ${sceneTitle}.`
    },
    {
      label: 'Follow-up',
      text: `Continue directly after ${sceneTitle}.`
    }
  ];
}

function buildCompositionLanes(
  chapterTitle: string,
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  return [
    {
      label: 'Opening lane',
      slot: `scene ${nextSceneNumber}`,
      note: `open ${chapterTitle} with a decisive beat`,
      tone: 'ready'
    },
    {
      label: 'Reserve lane',
      slot: `scene ${nextSceneNumber}`,
      note: `hold a flexible slot inside ${chapterTitle}`,
      tone: 'floating'
    },
    {
      label: 'Follow-up lane',
      slot: latestBacklinkTitle ?? 'no anchor',
      note: latestBacklinkTitle
        ? `continue fallout after ${latestBacklinkTitle}`
        : 'wait for a prior scene anchor',
      tone: latestBacklinkTitle ? 'ready' : 'waiting'
    }
  ];
}

function buildChapterOrdering(
  chapterTitle: string,
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  return [
    {
      label: 'Current slot',
      value: `scene ${nextSceneNumber}`,
      note: `next placement inside ${chapterTitle}`
    },
    {
      label: 'Closing pressure',
      value: latestBacklinkTitle ?? 'open pressure',
      note: latestBacklinkTitle
        ? `can close fallout from ${latestBacklinkTitle}`
        : 'prepare one pressure to close later'
    },
    {
      label: 'After slot',
      value: `scene ${nextSceneNumber + 1}`,
      note: 'leave one lane available after this beat'
    }
  ];
}

function buildSceneLaneCards(
  chapterTitle: string,
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  return [
    {
      key: 'opening',
      label: 'Opening lane card',
      slot: `scene ${nextSceneNumber}`,
      note: `launch ${chapterTitle} in visible motion`,
      status: 'active'
    },
    {
      key: 'reserve',
      label: 'Reserve lane card',
      slot: `scene ${nextSceneNumber}`,
      note: `keep ${chapterTitle} flexible for discovery`,
      status: 'floating'
    },
    {
      key: 'closing',
      label: 'Closing lane card',
      slot: `scene ${nextSceneNumber}`,
      note: `shape one cost before scene ${nextSceneNumber + 1}`,
      status: 'watch'
    },
    {
      key: 'followup',
      label: 'Follow-up lane card',
      slot: latestBacklinkTitle ?? 'no anchor',
      note: latestBacklinkTitle
        ? `carry fallout from ${latestBacklinkTitle}`
        : 'await a prior scene anchor',
      status: latestBacklinkTitle ? 'ready' : 'waiting'
    }
  ] as const;
}

function buildSceneSequence(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';

  return [
    {
      key: 'next',
      label: 'Next sequence slot',
      slot: `scene ${nextSceneNumber}`,
      note: `${chapterTitle} follows ${latestScene}`
    },
    {
      key: 'closing',
      label: 'Closing sequence slot',
      slot: `scene ${nextSceneNumber}`,
      note: `close pressure before scene ${nextSceneNumber + 1}`
    },
    {
      key: 'followup',
      label: 'Aftermath sequence slot',
      slot: latestBacklinkTitle ?? 'no anchor',
      note: latestBacklinkTitle
        ? `continue from ${latestBacklinkTitle}`
        : 'wait for a scene anchor'
    }
  ] as const;
}

function buildSceneOutline(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';
  const previousScene = sceneTitles.at(-2) ?? latestScene;

  return [
    {
      key: 'previous',
      label: 'Previous scene',
      slot: previousScene,
      note: `already anchors ${chapterTitle}`
    },
    {
      key: 'next',
      label: 'Next scene',
      slot: `scene ${nextSceneNumber}`,
      note: `${chapterTitle} advances after ${latestScene}`
    },
    {
      key: 'aftermath',
      label: 'Aftermath scene',
      slot: latestBacklinkTitle ?? 'no anchor',
      note: latestBacklinkTitle
        ? `write the consequence after ${latestBacklinkTitle}`
        : 'wait for a consequence anchor'
    }
  ] as const;
}

function buildSceneStoryboard(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';
  const previousScene = sceneTitles.at(-2) ?? latestScene;

  return [
    {
      key: 'previous',
      label: 'Previous frame',
      slot: previousScene,
      note: `${chapterTitle} came through this beat`,
      status: 'locked'
    },
    {
      key: 'current',
      label: 'Current frame',
      slot: `scene ${nextSceneNumber}`,
      note: `open the next visible turn after ${latestScene}`,
      status: 'active'
    },
    {
      key: 'after',
      label: 'Aftermath frame',
      slot: latestBacklinkTitle ?? 'no anchor',
      note: latestBacklinkTitle
        ? `carry consequence from ${latestBacklinkTitle}`
        : 'wait for an aftermath anchor',
      status: latestBacklinkTitle ? 'ready' : 'waiting'
    }
  ] as const;
}

function buildScenePlanningStrip(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';

  return [
    {
      key: 'previous',
      label: 'Previous',
      value: latestScene
    },
    {
      key: 'current',
      label: 'Current',
      value: `${chapterTitle} scene ${nextSceneNumber}`
    },
    {
      key: 'aftermath',
      label: 'Aftermath',
      value: latestBacklinkTitle ?? 'pending'
    }
  ] as const;
}

function buildScenePlanningDesk(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';

  return [
    {
      key: 'previous',
      label: 'Previous lane',
      value: latestScene,
      note: `${chapterTitle} currently rests on this scene`
    },
    {
      key: 'current',
      label: 'Current lane',
      value: `scene ${nextSceneNumber}`,
      note: `advance ${chapterTitle} with the next visible turn`
    },
    {
      key: 'aftermath',
      label: 'Aftermath lane',
      value: latestBacklinkTitle ?? 'pending',
      note: latestBacklinkTitle
        ? `continue consequence from ${latestBacklinkTitle}`
        : 'wait for a continuity anchor'
    }
  ] as const;
}

function buildScenePlanningHud(
  chapterTitle: string,
  sceneTitles: string[],
  nextSceneNumber: number,
  latestBacklinkTitle: string | null
) {
  const latestScene = sceneTitles.at(-1) ?? 'No prior scene';

  return [
    {
      key: 'previous',
      label: 'Prev',
      value: latestScene
    },
    {
      key: 'current',
      label: 'Now',
      value: `${chapterTitle} ${nextSceneNumber}`
    },
    {
      key: 'aftermath',
      label: 'After',
      value: latestBacklinkTitle ?? 'pending'
    }
  ] as const;
}

function buildScenePlanningCommands(
  chapterTitle: string,
  latestBacklinkTitle: string | null
) {
  return [
    {
      key: 'open',
      label: `Open ${chapterTitle}`
    },
    {
      key: 'reserve',
      label: 'Reserve slot'
    },
    {
      key: 'close',
      label: 'Close pressure'
    },
    {
      key: 'after',
      label: latestBacklinkTitle ? `After ${latestBacklinkTitle}` : 'After pending'
    }
  ] as const;
}

function buildSceneLaunchBar(
  chapterId: string,
  chapterTitle: string,
  sceneTitle: string,
  sceneSummary: string,
  sceneBody: string,
  mode: 'free' | 'opening' | 'continuation',
  seeded: boolean
) {
  return [
    {
      label: 'Chapter',
      value: chapterId ? chapterTitle : 'unselected'
    },
    {
      label: 'Title',
      value: sceneTitle ? 'ready' : 'missing'
    },
    {
      label: 'Summary',
      value: sceneSummary ? 'ready' : 'light'
    },
    {
      label: 'Body',
      value: sceneBody ? 'ready' : 'pending'
    },
    {
      label: 'Mode',
      value: mode
    },
    {
      label: 'Seed',
      value: seeded ? 'on' : 'off'
    }
  ] as const;
}
