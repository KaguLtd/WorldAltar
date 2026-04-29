import { describe, expect, it } from 'vitest';
import type { EntityRecord } from '../entity-model/types';
import {
  buildTerritoryBands,
  buildTerritoryChain,
  buildTerritoryFocus,
  buildTerritoryHorizon,
  buildTerritoryPulse,
  buildRegionFocus,
  buildRegionFocusRail,
  buildTerritoryRoute,
  buildTerritoryStatus
} from './territory';

const region: EntityRecord = {
  type: 'region',
  common: {
    id: 'reg_001',
    type: 'region',
    slug: 'steppe-heartland',
    title: 'Steppe Heartland',
    summary: 'Wide territory',
    body: '',
    startYear: 1200,
    endYear: null,
    isOngoing: true,
    latitude: null,
    longitude: null,
    geometryRef: null,
    coverImagePath: null,
    thumbnailPath: null,
    createdAt: '1',
    updatedAt: '1'
  },
  fields: {
    parentRegionId: null
  }
};

const childRegion: EntityRecord = {
  type: 'region',
  common: {
    id: 'reg_002',
    type: 'region',
    slug: 'river-march',
    title: 'River March',
    summary: 'Border territory',
    body: '',
    startYear: 1202,
    endYear: null,
    isOngoing: true,
    latitude: null,
    longitude: null,
    geometryRef: null,
    coverImagePath: null,
    thumbnailPath: null,
    createdAt: '1',
    updatedAt: '1'
  },
  fields: {
    parentRegionId: 'reg_001'
  }
};

const location: EntityRecord = {
  type: 'location',
  common: {
    id: 'loc_001',
    type: 'location',
    slug: 'winter-camp',
    title: 'Winter Camp',
    summary: 'Cold base',
    body: '',
    startYear: 1204,
    endYear: null,
    isOngoing: true,
    latitude: 42,
    longitude: 71,
    geometryRef: null,
    coverImagePath: null,
    thumbnailPath: null,
    createdAt: '1',
    updatedAt: '1'
  },
  fields: {
    regionId: 'reg_001',
    locationKind: 'camp'
  }
};

const event: EntityRecord = {
  type: 'event',
  common: {
    id: 'evt_001',
    type: 'event',
    slug: 'raid-at-dawn',
    title: 'Raid at Dawn',
    summary: 'Event pressure',
    body: '',
    startYear: 1204,
    endYear: 1204,
    isOngoing: false,
    latitude: 42,
    longitude: 71,
    geometryRef: null,
    coverImagePath: null,
    thumbnailPath: null,
    createdAt: '1',
    updatedAt: '1'
  },
  fields: {
    locationId: 'loc_001'
  }
};

describe('buildTerritoryBands', () => {
  it('summarizes the selected region territory load from typed links', () => {
    const result = buildTerritoryBands(
      [region, location, event],
      [region, location, event],
      region
    );

    expect(result).toEqual([
      {
        label: 'Territory core',
        value: 'Steppe Heartland',
        note: 'selected region anchor',
        targetId: 'reg_001'
      },
      {
        label: 'Settlement spread',
        value: '1 places',
        note: 'region -> location seam',
        targetId: 'loc_001'
      },
      {
        label: 'Pressure events',
        value: '1 events',
        note: 'events hosted in this territory',
        targetId: 'evt_001'
      }
    ]);
  });

  it('builds pressure-ranked region bands when no region is selected', () => {
    const result = buildTerritoryBands(
      [region, location, event],
      [region, location, event],
      null
    );

    expect(result).toEqual([
      {
        label: 'Steppe Heartland',
        value: '2 pressure',
        note: '1 places / 1 events',
        targetId: 'reg_001'
      }
    ]);
  });
});

describe('buildTerritoryFocus', () => {
  it('resolves host territory for a selected location', () => {
    const result = buildTerritoryFocus(location, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Host territory',
        value: 'Steppe Heartland',
        note: 'location -> region seam',
        targetId: 'reg_001'
      }
    ]);
  });

  it('resolves site and host territory for a selected event', () => {
    const result = buildTerritoryFocus(event, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Event site',
        value: 'Winter Camp',
        note: 'event -> location seam',
        targetId: 'loc_001'
      },
      {
        label: 'Host territory',
        value: 'Steppe Heartland',
        note: 'event -> region seam',
        targetId: 'reg_001'
      }
    ]);
  });
});

describe('buildTerritoryHorizon', () => {
  it('compresses event territory context into overlay-friendly chips', () => {
    const result = buildTerritoryHorizon(event, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'S',
        value: 'Winter Camp',
        targetId: 'loc_001'
      },
      {
        label: 'T',
        value: 'Steppe Heartland',
        targetId: 'reg_001'
      }
    ]);
  });
});

describe('buildTerritoryStatus', () => {
  it('builds a territory path for a selected location', () => {
    const result = buildTerritoryStatus(location, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Territory path',
        value: 'Steppe Heartland -> Winter Camp'
      }
    ]);
  });

  it('builds territory path and pressure seat for a selected event', () => {
    const result = buildTerritoryStatus(event, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Territory path',
        value: 'Steppe Heartland -> Winter Camp -> Raid at Dawn'
      },
      {
        label: 'Pressure seat',
        value: 'Winter Camp'
      }
    ]);
  });
});

describe('buildTerritoryRoute', () => {
  it('builds region -> location route for a selected location', () => {
    const result = buildTerritoryRoute(location, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Steppe Heartland',
        targetId: 'reg_001'
      },
      {
        label: 'Winter Camp',
        targetId: 'loc_001'
      }
    ]);
  });

  it('builds region -> location -> event route for a selected event', () => {
    const result = buildTerritoryRoute(event, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Steppe Heartland',
        targetId: 'reg_001'
      },
      {
        label: 'Winter Camp',
        targetId: 'loc_001'
      },
      {
        label: 'Raid at Dawn',
        targetId: 'evt_001'
      }
    ]);
  });
});

describe('buildTerritoryChain', () => {
  it('builds a parent/core/child/spread chain for a selected region', () => {
    const result = buildTerritoryChain(region, [region, childRegion, location, event]);

    expect(result).toEqual([
      {
        label: 'Core',
        value: 'Steppe Heartland',
        targetId: 'reg_001'
      },
      {
        label: 'Child',
        value: 'River March',
        targetId: 'reg_002'
      },
      {
        label: 'Spread',
        value: '1 places',
        targetId: null
      }
    ]);
  });
});

describe('buildTerritoryPulse', () => {
  it('builds place and event counts for a selected region', () => {
    const result = buildTerritoryPulse(region, [region, childRegion, location, event]);

    expect(result).toEqual([
      {
        label: 'Places',
        value: '1'
      },
      {
        label: 'Events',
        value: '1'
      }
    ]);
  });

  it('builds anchored event count for a selected location', () => {
    const result = buildTerritoryPulse(location, [region, location, event]);

    expect(result).toEqual([
      {
        label: 'Anchored events',
        value: '1'
      }
    ]);
  });
});

describe('buildRegionFocus', () => {
  it('builds a region focus summary for a selected region', () => {
    const result = buildRegionFocus(region, [region, childRegion, location, event]);

    expect(result).toEqual([
      {
        label: 'Region focus',
        value: 'Steppe Heartland'
      },
      {
        label: 'Pressure',
        value: '2'
      },
      {
        label: 'Spread',
        value: '1 places / 1 events'
      }
    ]);
  });

  it('resolves region focus through a selected event host chain', () => {
    const result = buildRegionFocus(event, [region, childRegion, location, event]);

    expect(result).toEqual([
      {
        label: 'Region focus',
        value: 'Steppe Heartland'
      },
      {
        label: 'Pressure',
        value: '2'
      },
      {
        label: 'Spread',
        value: '1 places / 1 events'
      }
    ]);
  });
});

describe('buildRegionFocusRail', () => {
  it('builds a compact region-first rail through an event host chain', () => {
    const result = buildRegionFocusRail(event, [region, childRegion, location, event]);

    expect(result).toEqual([
      {
        label: 'Region focus',
        value: 'Steppe Heartland'
      },
      {
        label: 'Pressure',
        value: '2'
      },
      {
        label: 'Spread',
        value: '1 places / 1 events'
      },
      {
        label: 'Route root',
        value: 'Steppe Heartland'
      },
      {
        label: 'Route next',
        value: 'Winter Camp'
      },
      {
        label: 'Year anchor',
        value: '1204'
      }
    ]);
  });
});

describe('territory desk ingredients', () => {
  it('provides enough region-first material to render a territory desk for an event host chain', () => {
    const rail = buildRegionFocusRail(event, [region, childRegion, location, event]);
    const chain = buildTerritoryChain(region, [region, childRegion, location, event]);

    expect(rail.length).toBeGreaterThan(0);
    expect(chain).toEqual([
      {
        label: 'Core',
        value: 'Steppe Heartland',
        targetId: 'reg_001'
      },
      {
        label: 'Child',
        value: 'River March',
        targetId: 'reg_002'
      },
      {
        label: 'Spread',
        value: '1 places',
        targetId: null
      }
    ]);
  });
});
