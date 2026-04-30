import { useEffect, useState } from 'react';
import {
  autosaveManuscriptScene,
  getManuscriptScene,
  listManuscriptTree,
  recoverManuscriptAutosave
} from '../modules/manuscript/api';
import type {
  ManuscriptSceneDetail,
  ManuscriptTreeItem
} from '../modules/manuscript/contracts';
import type { ActiveLens } from '../App';

type UseManuscriptWorkspaceArgs = {
  activeLens: ActiveLens;
  databasePath: string | null;
  manuscriptEnabled: boolean;
  setError: (value: string) => void;
};

export function useManuscriptWorkspace({
  activeLens,
  databasePath,
  manuscriptEnabled,
  setError
}: UseManuscriptWorkspaceArgs) {
  const [manuscriptTree, setManuscriptTree] = useState<ManuscriptTreeItem[]>([]);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedScene, setSelectedScene] =
    useState<ManuscriptSceneDetail | null>(null);
  const [draftSceneTitle, setDraftSceneTitle] = useState('');
  const [draftSceneSummary, setDraftSceneSummary] = useState('');
  const [draftSceneBody, setDraftSceneBody] = useState('');
  const [draftSceneSelectionStart, setDraftSceneSelectionStart] = useState<
    number | null
  >(null);
  const [draftSceneSelectionEnd, setDraftSceneSelectionEnd] = useState<
    number | null
  >(null);
  const [manuscriptDirty, setManuscriptDirty] = useState(false);
  const [manuscriptStatus, setManuscriptStatus] = useState('Deferred off');

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || activeLens !== 'Manuscript') {
      return;
    }

    setManuscriptStatus('Loading manuscript');
    recoverManuscriptAutosave(databasePath)
      .then(() => listManuscriptTree(databasePath))
      .then((tree) => {
        setManuscriptTree(tree);
        setSelectedSceneId((current) => current ?? tree[0]?.children[0]?.id ?? null);
        setManuscriptStatus(tree.length ? 'Manuscript ready' : 'Manuscript empty');
      })
      .catch((value: unknown) => {
        setManuscriptStatus('Manuscript failed');
        setError(String(value));
      });
  }, [activeLens, databasePath, manuscriptEnabled, setError]);

  useEffect(() => {
    if (!databasePath || !manuscriptEnabled || activeLens !== 'Manuscript') {
      return;
    }

    if (!selectedSceneId) {
      setSelectedScene(null);
      return;
    }

    getManuscriptScene(databasePath, selectedSceneId)
      .then((scene) => setSelectedScene(scene))
      .catch((value: unknown) => setError(String(value)));
  }, [activeLens, databasePath, manuscriptEnabled, selectedSceneId, setError]);

  useEffect(() => {
    const sceneNode = selectedScene?.node ?? null;

    if (!sceneNode) {
      setDraftSceneTitle('');
      setDraftSceneSummary('');
      setDraftSceneBody('');
      setDraftSceneSelectionStart(null);
      setDraftSceneSelectionEnd(null);
      setManuscriptDirty(false);
      return;
    }

    setDraftSceneTitle(sceneNode.title);
    setDraftSceneSummary(sceneNode.summary);
    setDraftSceneBody(sceneNode.body);
    setDraftSceneSelectionStart(null);
    setDraftSceneSelectionEnd(null);
    setManuscriptDirty(false);
  }, [selectedScene?.node]);

  useEffect(() => {
    if (!selectedScene) {
      return;
    }

    setManuscriptDirty(
      draftSceneTitle !== selectedScene.node.title ||
        draftSceneSummary !== selectedScene.node.summary ||
        draftSceneBody !== selectedScene.node.body
    );
  }, [draftSceneBody, draftSceneSummary, draftSceneTitle, selectedScene]);

  useEffect(() => {
    if (
      !databasePath ||
      !manuscriptEnabled ||
      activeLens !== 'Manuscript' ||
      !selectedScene ||
      !manuscriptDirty
    ) {
      return;
    }

    const timer = window.setTimeout(() => {
      setManuscriptStatus('Saving manuscript');
      autosaveManuscriptScene(databasePath, {
        id: selectedScene.node.id,
        title: draftSceneTitle,
        summary: draftSceneSummary,
        body: draftSceneBody,
        mentions: selectedScene.mentions.map((mention) => ({
          entityId: mention.entityId,
          label: mention.label,
          startOffset: mention.startOffset,
          endOffset: mention.endOffset
        }))
      })
        .then((updated) => {
          setSelectedScene(updated);
          setManuscriptTree((current) =>
            current.map((chapter) => ({
              ...chapter,
              children: chapter.children.map((sceneNode) =>
                sceneNode.id === updated.node.id
                  ? {
                      ...sceneNode,
                      title: updated.node.title,
                      summary: updated.node.summary,
                      body: updated.node.body,
                      updatedAt: updated.node.updatedAt
                    }
                  : sceneNode
              )
            }))
          );
          setManuscriptStatus(`Saved manuscript ${updated.node.updatedAt}`);
          setManuscriptDirty(false);
        })
        .catch((value: unknown) => {
          setManuscriptStatus('Manuscript save failed');
          setError(String(value));
        });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [
    activeLens,
    databasePath,
    draftSceneBody,
    draftSceneSummary,
    draftSceneTitle,
    manuscriptDirty,
    manuscriptEnabled,
    selectedScene,
    setError
  ]);

  return {
    draftSceneBody,
    draftSceneSelectionEnd,
    draftSceneSelectionStart,
    draftSceneSummary,
    draftSceneTitle,
    manuscriptDirty,
    manuscriptStatus,
    manuscriptTree,
    selectedScene,
    selectedSceneId,
    setDraftSceneBody,
    setDraftSceneSelectionEnd,
    setDraftSceneSelectionStart,
    setDraftSceneSummary,
    setDraftSceneTitle,
    setManuscriptStatus,
    setManuscriptTree,
    setSelectedScene,
    setSelectedSceneId
  };
}
