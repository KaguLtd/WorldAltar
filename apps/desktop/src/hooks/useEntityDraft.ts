import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { autosaveEntity } from '../modules/entity-model/api';
import type { EntityRecord } from '../modules/entity-model/types';
import type { WorldProject } from '../modules/projects/api';

type UseEntityDraftArgs = {
  project: WorldProject | null;
  selectedEntity: EntityRecord | null;
  setError: (value: string) => void;
  setRecords: Dispatch<SetStateAction<EntityRecord[]>>;
};

export function useEntityDraft({
  project,
  selectedEntity,
  setError,
  setRecords
}: UseEntityDraftArgs) {
  const [draftTitle, setDraftTitle] = useState('');
  const [draftSummary, setDraftSummary] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftAssetSourcePath, setDraftAssetSourcePath] = useState('');
  const [draftCoverImagePath, setDraftCoverImagePath] = useState('');
  const [draftLinkTargetId, setDraftLinkTargetId] = useState('');
  const [draftThumbnailPath, setDraftThumbnailPath] = useState('');
  const [dirty, setDirty] = useState(false);
  const [autosaveState, setAutosaveState] = useState('Idle');

  useEffect(() => {
    if (!selectedEntity) {
      setDraftTitle('');
      setDraftSummary('');
      setDraftBody('');
      setDraftAssetSourcePath('');
      setDraftCoverImagePath('');
      setDraftLinkTargetId('');
      setDraftThumbnailPath('');
      setDirty(false);
      return;
    }

    setDraftTitle(selectedEntity.common.title);
    setDraftSummary(selectedEntity.common.summary);
    setDraftBody(selectedEntity.common.body);
    setDraftAssetSourcePath('');
    setDraftCoverImagePath(selectedEntity.common.coverImagePath ?? '');
    setDraftLinkTargetId(
      selectedEntity.type === 'location'
        ? selectedEntity.fields.regionId ?? ''
        : selectedEntity.type === 'region'
          ? selectedEntity.fields.parentRegionId ?? ''
          : selectedEntity.type === 'event'
            ? selectedEntity.fields.locationId ?? ''
            : ''
    );
    setDraftThumbnailPath(selectedEntity.common.thumbnailPath ?? '');
    setDirty(false);
  }, [selectedEntity]);

  useEffect(() => {
    if (!selectedEntity) {
      return;
    }

    const nextDirty =
      draftTitle !== selectedEntity.common.title ||
      draftSummary !== selectedEntity.common.summary ||
      draftBody !== selectedEntity.common.body;
    setDirty(nextDirty);
  }, [draftBody, draftSummary, draftTitle, selectedEntity]);

  useEffect(() => {
    if (!project || !selectedEntity || !dirty) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAutosaveState('Saving');
      autosaveEntity(project.databasePath, {
        id: selectedEntity.common.id,
        title: draftTitle,
        summary: draftSummary,
        body: draftBody
      })
        .then((updated) => {
          setRecords((current) =>
            current.map((record) =>
              record.common.id === updated.common.id ? updated : record
            )
          );
          setAutosaveState(`Saved ${updated.common.updatedAt}`);
          setDirty(false);
        })
        .catch((value: unknown) => {
          setAutosaveState('Save failed');
          setError(String(value));
        });
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [
    draftBody,
    draftSummary,
    draftTitle,
    dirty,
    project,
    selectedEntity,
    setError,
    setRecords
  ]);

  return {
    autosaveState,
    draftAssetSourcePath,
    draftBody,
    draftCoverImagePath,
    draftLinkTargetId,
    draftSummary,
    draftThumbnailPath,
    draftTitle,
    dirty,
    setDraftAssetSourcePath,
    setDraftBody,
    setDraftCoverImagePath,
    setDraftLinkTargetId,
    setDraftSummary,
    setDraftThumbnailPath,
    setDraftTitle
  };
}
