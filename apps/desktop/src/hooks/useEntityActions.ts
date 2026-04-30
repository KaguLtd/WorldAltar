import {
  createEntity,
  importEntityMedia,
  updateEntityLinks,
  updateEntityMedia,
  type CreateEntityInput
} from '../modules/entity-model/api';
import type { EntityRecord } from '../modules/entity-model/types';
import type { Dispatch, SetStateAction } from 'react';

type LinkedEntityKind =
  | 'event_from_location'
  | 'location_from_region'
  | 'region_from_region';

type UseEntityActionsArgs = {
  databasePath: string | null;
  draftAssetSourcePath: string;
  draftCoverImagePath: string;
  draftLinkTargetId: string;
  draftThumbnailPath: string;
  selectedEntity: EntityRecord | null;
  setBusy: (value: boolean) => void;
  setDraftCoverImagePath: (value: string) => void;
  setDraftThumbnailPath: (value: string) => void;
  setError: (value: string) => void;
  setQuery: (value: string) => void;
  setRecords: Dispatch<SetStateAction<EntityRecord[]>>;
  setSelectedEntityId: (value: string | null) => void;
  setTypeFilter: (value: 'all' | EntityRecord['type']) => void;
};

export function useEntityActions({
  databasePath,
  draftAssetSourcePath,
  draftCoverImagePath,
  draftLinkTargetId,
  draftThumbnailPath,
  selectedEntity,
  setBusy,
  setDraftCoverImagePath,
  setDraftThumbnailPath,
  setError,
  setQuery,
  setRecords,
  setSelectedEntityId,
  setTypeFilter
}: UseEntityActionsArgs) {
  async function handleCreateEntity(input: CreateEntityInput) {
    if (!databasePath) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const created = await createEntity(databasePath, input);
      setRecords((current) => [...current, created]);
      setSelectedEntityId(created.common.id);
      setTypeFilter('all');
      setQuery('');
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateLinkedEntity(kind: LinkedEntityKind) {
    if (!databasePath || !selectedEntity) {
      return;
    }

    if (kind === 'event_from_location' && selectedEntity.type === 'location') {
      await handleCreateEntity({
        type: 'event',
        common: {
          title: `New ${selectedEntity.common.title} event`,
          summary: `Event linked to ${selectedEntity.common.title}`
        },
        fields: {
          locationId: selectedEntity.common.id
        }
      });
      return;
    }

    if (kind === 'location_from_region' && selectedEntity.type === 'region') {
      await handleCreateEntity({
        type: 'location',
        common: {
          title: `New ${selectedEntity.common.title} site`,
          summary: `Location linked to ${selectedEntity.common.title}`
        },
        fields: {
          regionId: selectedEntity.common.id,
          locationKind: 'settlement'
        }
      });
      return;
    }

    if (kind === 'region_from_region' && selectedEntity.type === 'region') {
      await handleCreateEntity({
        type: 'region',
        common: {
          title: `New ${selectedEntity.common.title} frontier`,
          summary: `Region linked to ${selectedEntity.common.title}`
        },
        fields: {
          parentRegionId: selectedEntity.common.id
        }
      });
    }
  }

  async function handleSaveEntityMedia() {
    if (!databasePath || !selectedEntity) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await updateEntityMedia(databasePath, {
        id: selectedEntity.common.id,
        coverImagePath: draftCoverImagePath.trim() || null,
        thumbnailPath: draftThumbnailPath.trim() || null
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  function handlePresetEntityMedia() {
    if (!selectedEntity) {
      return;
    }

    const base = `assets/entities/${selectedEntity.type}/${selectedEntity.common.slug}`;
    setDraftCoverImagePath(`${base}/cover.png`);
    setDraftThumbnailPath(`${base}/thumb.png`);
  }

  async function handleImportEntityMedia(variant: 'cover' | 'thumbnail') {
    if (!databasePath || !selectedEntity || !draftAssetSourcePath.trim()) {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await importEntityMedia(databasePath, {
        id: selectedEntity.common.id,
        sourcePath: draftAssetSourcePath.trim(),
        variant
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
      setDraftCoverImagePath(updated.common.coverImagePath ?? '');
      setDraftThumbnailPath(updated.common.thumbnailPath ?? '');
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveEntityLinks() {
    if (!databasePath || !selectedEntity || selectedEntity.type === 'character') {
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await updateEntityLinks(databasePath, {
        id: selectedEntity.common.id,
        regionId:
          selectedEntity.type === 'location' ? draftLinkTargetId || null : null,
        parentRegionId:
          selectedEntity.type === 'region' ? draftLinkTargetId || null : null,
        locationId:
          selectedEntity.type === 'event' ? draftLinkTargetId || null : null
      });
      setRecords((current) =>
        current.map((record) =>
          record.common.id === updated.common.id ? updated : record
        )
      );
      setSelectedEntityId(updated.common.id);
    } catch (value) {
      setError(String(value));
    } finally {
      setBusy(false);
    }
  }

  return {
    handleCreateEntity,
    handleCreateLinkedEntity,
    handleImportEntityMedia,
    handlePresetEntityMedia,
    handleSaveEntityLinks,
    handleSaveEntityMedia
  };
}
