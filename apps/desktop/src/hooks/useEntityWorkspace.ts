import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { searchEntities } from '../modules/search/api';
import { listEntities } from '../modules/wiki/api';
import type { EntityRecord, EntityType } from '../modules/entity-model/types';

type UseEntityWorkspaceArgs = {
  databasePath: string | null;
  setError: (value: string) => void;
  year: number;
};

export function useEntityWorkspace({
  databasePath,
  setError,
  year
}: UseEntityWorkspaceArgs) {
  const [records, setRecords] = useState<EntityRecord[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<EntityType | 'all'>('all');
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [searchIds, setSearchIds] = useState<string[] | null>(null);
  const [isRefreshingEntities, setIsRefreshingEntities] = useState(false);

  useEffect(() => {
    if (!databasePath) {
      setRecords([]);
      setSelectedEntityId(null);
      setSearchIds(null);
      return;
    }

    setIsRefreshingEntities(true);
    setError('');

    listEntities(databasePath, year)
      .then(setRecords)
      .catch((value: unknown) => setError(String(value)))
      .finally(() => setIsRefreshingEntities(false));
  }, [databasePath, setError, year]);

  useEffect(() => {
    if (!databasePath || !query.trim()) {
      setSearchIds(null);
      return;
    }

    searchEntities(
      databasePath,
      query,
      year,
      typeFilter === 'all' ? null : typeFilter
    )
      .then((hits) => setSearchIds(hits.map((hit) => hit.id)))
      .catch((value: unknown) => setError(String(value)));
  }, [databasePath, query, setError, typeFilter, year]);

  const filteredRecords = useMemo(() => {
    let nextRecords = records;

    if (typeFilter !== 'all') {
      nextRecords = nextRecords.filter((record) => record.type === typeFilter);
    }

    if (searchIds) {
      nextRecords = nextRecords.filter((record) =>
        searchIds.includes(record.common.id)
      );
    }

    return nextRecords;
  }, [records, searchIds, typeFilter]);

  useEffect(() => {
    if (!filteredRecords.length) {
      setSelectedEntityId(null);
      return;
    }

    if (
      !filteredRecords.some((record) => record.common.id === selectedEntityId)
    ) {
      setSelectedEntityId(filteredRecords[0].common.id);
    }
  }, [filteredRecords, selectedEntityId]);

  const selectedEntity =
    filteredRecords.find((record) => record.common.id === selectedEntityId) ??
    records.find((record) => record.common.id === selectedEntityId) ??
    null;

  const searchRecords = query.trim() ? filteredRecords : [];
  const timelineRecords = [...filteredRecords].sort(
    (left, right) =>
      (left.common.startYear ?? year) - (right.common.startYear ?? year)
  );
  const mentionOptions = filteredRecords.slice(0, 4);

  return {
    filteredRecords,
    isRefreshingEntities,
    mentionOptions,
    query,
    records,
    searchRecords,
    selectedEntity,
    selectedEntityId,
    setQuery,
    setRecords: setRecords as Dispatch<SetStateAction<EntityRecord[]>>,
    setSelectedEntityId,
    setTypeFilter,
    timelineRecords,
    typeFilter
  };
}
