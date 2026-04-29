import type { EntityRecord } from '../entity-model/types';

export function buildTerritoryBands(
  scopedRecords: EntityRecord[],
  records: EntityRecord[],
  selectedRecord: EntityRecord | null
) {
  if (selectedRecord?.type === 'region') {
    const anchoredLocations = records.filter(
      (record) =>
        record.type === 'location' &&
        record.fields.regionId === selectedRecord.common.id
    );
    const anchoredEvents = records.filter((record) => {
      if (record.type !== 'event' || !record.fields.locationId) {
        return false;
      }

      const hostLocation = records.find(
        (candidate) => candidate.common.id === record.fields.locationId
      );

      return (
        hostLocation?.type === 'location' &&
        hostLocation.fields.regionId === selectedRecord.common.id
      );
    });

    return [
      {
        label: 'Territory core',
        value: selectedRecord.common.title,
        note: 'selected region anchor',
        targetId: selectedRecord.common.id
      },
      {
        label: 'Settlement spread',
        value: `${anchoredLocations.length} places`,
        note: 'region -> location seam',
        targetId: anchoredLocations[0]?.common.id ?? null
      },
      {
        label: 'Pressure events',
        value: `${anchoredEvents.length} events`,
        note: 'events hosted in this territory',
        targetId: anchoredEvents[0]?.common.id ?? null
      }
    ];
  }

  const regions = scopedRecords.filter((record) => record.type === 'region');
  if (!regions.length) {
    return [];
  }

  const regionLoads = regions
    .map((region) => {
      const placeCount = records.filter(
        (record) =>
          record.type === 'location' &&
          record.fields.regionId === region.common.id
      ).length;
      const eventCount = records.filter((record) => {
        if (record.type !== 'event' || !record.fields.locationId) {
          return false;
        }

        const hostLocation = records.find(
          (candidate) => candidate.common.id === record.fields.locationId
        );

        return (
          hostLocation?.type === 'location' &&
          hostLocation.fields.regionId === region.common.id
        );
      }).length;

      return {
        region,
        pressure: placeCount + eventCount,
        placeCount,
        eventCount
      };
    })
    .sort((left, right) => right.pressure - left.pressure)
    .slice(0, 3);

  return regionLoads.map((entry) => ({
    label: entry.region.common.title,
    value: `${entry.pressure} pressure`,
    note: `${entry.placeCount} places / ${entry.eventCount} events`,
    targetId: entry.region.common.id
  }));
}

export function buildTerritoryFocus(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  if (selectedRecord.type === 'region') {
    return [
      {
        label: 'Territory focus',
        value: selectedRecord.common.title,
        note: 'selected region seam',
        targetId: selectedRecord.common.id
      }
    ];
  }

  if (selectedRecord.type === 'location') {
    const region =
      selectedRecord.fields.regionId
        ? records.find((record) => record.common.id === selectedRecord.fields.regionId) ??
          null
        : null;

    return [
      {
        label: 'Host territory',
        value: region?.common.title ?? 'No host region',
        note: 'location -> region seam',
        targetId: region?.common.id ?? null
      }
    ];
  }

  if (selectedRecord.type === 'event') {
    const location =
      selectedRecord.fields.locationId
        ? records.find((record) => record.common.id === selectedRecord.fields.locationId) ??
          null
        : null;
    const region =
      location?.type === 'location' && location.fields.regionId
        ? records.find((record) => record.common.id === location.fields.regionId) ??
          null
        : null;

    return [
      {
        label: 'Event site',
        value: location?.common.title ?? 'No host place',
        note: 'event -> location seam',
        targetId: location?.common.id ?? null
      },
      {
        label: 'Host territory',
        value: region?.common.title ?? 'No host region',
        note: 'event -> region seam',
        targetId: region?.common.id ?? null
      }
    ];
  }

  return [];
}

export function buildTerritoryHorizon(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  const focus = buildTerritoryFocus(selectedRecord, records);
  if (!focus.length) {
    return [];
  }

  return focus.map((entry) => ({
    label:
      entry.label === 'Host territory'
        ? 'T'
        : entry.label === 'Event site'
          ? 'S'
          : 'Core',
    value: entry.value,
    targetId: entry.targetId
  }));
}

export function buildTerritoryStatus(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  if (selectedRecord.type === 'location') {
    const region =
      selectedRecord.fields.regionId
        ? records.find((record) => record.common.id === selectedRecord.fields.regionId) ??
          null
        : null;

    return [
      {
        label: 'Territory path',
        value: region
          ? `${region.common.title} -> ${selectedRecord.common.title}`
          : selectedRecord.common.title
      }
    ];
  }

  if (selectedRecord.type === 'event') {
    const location =
      selectedRecord.fields.locationId
        ? records.find((record) => record.common.id === selectedRecord.fields.locationId) ??
          null
        : null;
    const region =
      location?.type === 'location' && location.fields.regionId
        ? records.find((record) => record.common.id === location.fields.regionId) ??
          null
        : null;

    return [
      {
        label: 'Territory path',
        value: region
          ? `${region.common.title} -> ${location?.common.title ?? 'open'} -> ${selectedRecord.common.title}`
          : location
            ? `${location.common.title} -> ${selectedRecord.common.title}`
            : selectedRecord.common.title
      },
      {
        label: 'Pressure seat',
        value: location?.common.title ?? 'No host place'
      }
    ];
  }

  if (selectedRecord.type === 'region') {
    return [
      {
        label: 'Territory path',
        value: selectedRecord.common.title
      }
    ];
  }

  return [];
}

export function buildTerritoryRoute(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  if (selectedRecord.type === 'region') {
    return [
      {
        label: selectedRecord.common.title,
        targetId: selectedRecord.common.id
      }
    ];
  }

  if (selectedRecord.type === 'location') {
    const region =
      selectedRecord.fields.regionId
        ? records.find((record) => record.common.id === selectedRecord.fields.regionId) ??
          null
        : null;

    return [
      ...(region
        ? [
            {
              label: region.common.title,
              targetId: region.common.id
            }
          ]
        : []),
      {
        label: selectedRecord.common.title,
        targetId: selectedRecord.common.id
      }
    ];
  }

  if (selectedRecord.type === 'event') {
    const location =
      selectedRecord.fields.locationId
        ? records.find((record) => record.common.id === selectedRecord.fields.locationId) ??
          null
        : null;
    const region =
      location?.type === 'location' && location.fields.regionId
        ? records.find((record) => record.common.id === location.fields.regionId) ??
          null
        : null;

    return [
      ...(region
        ? [
            {
              label: region.common.title,
              targetId: region.common.id
            }
          ]
        : []),
      ...(location
        ? [
            {
              label: location.common.title,
              targetId: location.common.id
            }
          ]
        : []),
      {
        label: selectedRecord.common.title,
        targetId: selectedRecord.common.id
      }
    ];
  }

  return [];
}

export function buildTerritoryChain(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord || selectedRecord.type !== 'region') {
    return [];
  }

  const parent =
    selectedRecord.fields.parentRegionId
      ? records.find(
          (record) => record.common.id === selectedRecord.fields.parentRegionId
        ) ?? null
      : null;
  const child =
    records.find(
      (record) =>
        record.type === 'region' &&
        record.fields.parentRegionId === selectedRecord.common.id
    ) ?? null;
  const placeCount = records.filter(
    (record) =>
      record.type === 'location' &&
      record.fields.regionId === selectedRecord.common.id
  ).length;

  return [
    ...(parent
      ? [
          {
            label: 'Parent',
            value: parent.common.title,
            targetId: parent.common.id
          }
        ]
      : []),
    {
      label: 'Core',
      value: selectedRecord.common.title,
      targetId: selectedRecord.common.id
    },
    ...(child
      ? [
          {
            label: 'Child',
            value: child.common.title,
            targetId: child.common.id
          }
        ]
      : []),
    {
      label: 'Spread',
      value: `${placeCount} places`,
      targetId: null
    }
  ];
}

export function buildTerritoryPulse(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  if (selectedRecord.type === 'region') {
    const placeCount = records.filter(
      (record) =>
        record.type === 'location' &&
        record.fields.regionId === selectedRecord.common.id
    ).length;
    const eventCount = records.filter((record) => {
      if (record.type !== 'event' || !record.fields.locationId) {
        return false;
      }

      const hostLocation = records.find(
        (candidate) => candidate.common.id === record.fields.locationId
      );

      return (
        hostLocation?.type === 'location' &&
        hostLocation.fields.regionId === selectedRecord.common.id
      );
    }).length;

    return [
      {
        label: 'Places',
        value: String(placeCount)
      },
      {
        label: 'Events',
        value: String(eventCount)
      }
    ];
  }

  if (selectedRecord.type === 'location') {
    const eventCount = records.filter(
      (record) =>
        record.type === 'event' &&
        record.fields.locationId === selectedRecord.common.id
    ).length;

    return [
      {
        label: 'Anchored events',
        value: String(eventCount)
      }
    ];
  }

  if (selectedRecord.type === 'event') {
    return [
      {
        label: 'Year anchor',
        value:
          selectedRecord.common.startYear !== null
            ? String(selectedRecord.common.startYear)
            : 'open'
      }
    ];
  }

  return [];
}

export function buildRegionFocus(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  if (!selectedRecord) {
    return [];
  }

  const resolveRegion = () => {
    if (selectedRecord.type === 'region') {
      return selectedRecord;
    }

    if (selectedRecord.type === 'location' && selectedRecord.fields.regionId) {
      return (
        records.find((record) => record.common.id === selectedRecord.fields.regionId) ??
        null
      );
    }

    if (selectedRecord.type === 'event' && selectedRecord.fields.locationId) {
      const location =
        records.find((record) => record.common.id === selectedRecord.fields.locationId) ??
        null;

      if (location?.type === 'location' && location.fields.regionId) {
        return (
          records.find((record) => record.common.id === location.fields.regionId) ??
          null
        );
      }
    }

    return null;
  };

  const region = resolveRegion();
  if (!region || region.type !== 'region') {
    return [];
  }

  const placeCount = records.filter(
    (record) =>
      record.type === 'location' && record.fields.regionId === region.common.id
  ).length;
  const eventCount = records.filter((record) => {
    if (record.type !== 'event' || !record.fields.locationId) {
      return false;
    }

    const hostLocation = records.find(
      (candidate) => candidate.common.id === record.fields.locationId
    );

    return (
      hostLocation?.type === 'location' &&
      hostLocation.fields.regionId === region.common.id
    );
  }).length;

  return [
    {
      label: 'Region focus',
      value: region.common.title
    },
    {
      label: 'Pressure',
      value: String(placeCount + eventCount)
    },
    {
      label: 'Spread',
      value: `${placeCount} places / ${eventCount} events`
    }
  ];
}

export function buildRegionFocusRail(
  selectedRecord: EntityRecord | null,
  records: EntityRecord[]
) {
  const focus = buildRegionFocus(selectedRecord, records);
  if (!focus.length) {
    return [];
  }

  const route = buildTerritoryRoute(selectedRecord, records);
  const pulse = buildTerritoryPulse(selectedRecord, records);

  return [
    ...focus.map((entry) => ({
      label: entry.label,
      value: entry.value
    })),
    ...route.slice(0, 2).map((entry, index) => ({
      label: index === 0 ? 'Route root' : 'Route next',
      value: entry.label
    })),
    ...pulse.map((entry) => ({
      label: entry.label,
      value: entry.value
    }))
  ];
}
