import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

const {
  addLayer,
  addSource,
  easeTo,
  getSource,
  on,
  remove,
  setData,
  autosaveManuscriptScene,
  createWorld,
  createDemoWorld,
  getManuscriptScene,
  listEntities,
  listExportJobs,
  listManuscriptBacklinks,
  listManuscriptTree,
  queueExport,
  recoverManuscriptAutosave,
  searchEntities,
  autosaveEntity,
  createEntity,
  importEntityMedia,
  updateEntityMedia,
  updateEntityLinks,
  recoverAutosave
} = vi.hoisted(() => ({
  addLayer: vi.fn(),
  addSource: vi.fn(),
  easeTo: vi.fn(),
  getSource: vi.fn(),
  on: vi.fn(),
  remove: vi.fn(),
  setData: vi.fn(),
  autosaveManuscriptScene: vi.fn(),
  createWorld: vi.fn(),
  createDemoWorld: vi.fn(),
  getManuscriptScene: vi.fn(),
  listEntities: vi.fn(),
  listExportJobs: vi.fn(),
  listManuscriptBacklinks: vi.fn(),
  listManuscriptTree: vi.fn(),
  queueExport: vi.fn(),
  recoverManuscriptAutosave: vi.fn(),
  searchEntities: vi.fn(),
  autosaveEntity: vi.fn(),
  createEntity: vi.fn(),
  importEntityMedia: vi.fn(),
  updateEntityMedia: vi.fn(),
  updateEntityLinks: vi.fn(),
  recoverAutosave: vi.fn()
}));

vi.mock('./modules/projects/api', () => ({
  getBootstrapStatus: vi.fn().mockResolvedValue({
    documentsRoot: 'C:/Users/Test/Documents',
    appRoot: 'C:/Users/Test/Documents/WorldAltar',
    worldsRoot: 'C:/Users/Test/Documents/WorldAltar/worlds'
  }),
  createWorld,
  createDemoWorld
}));

vi.mock('./modules/wiki/api', () => ({
  listEntities
}));

vi.mock('./modules/search/api', () => ({
  searchEntities
}));

vi.mock('./modules/entity-model/api', () => ({
  autosaveEntity,
  createEntity,
  importEntityMedia,
  updateEntityMedia,
  updateEntityLinks,
  recoverAutosave
}));

vi.mock('./modules/manuscript/api', () => ({
  autosaveManuscriptScene,
  getManuscriptScene,
  listManuscriptBacklinks,
  listManuscriptTree,
  recoverManuscriptAutosave
}));

vi.mock('./modules/export/api', () => ({
  listExportJobs,
  queueExport
}));

vi.mock('maplibre-gl', () => {
  class MockMap {
    constructor() {}
    on = on;
    addSource = addSource;
    addLayer = addLayer;
    getSource = getSource;
    easeTo = easeTo;
    remove = remove;
  }

  return {
    __esModule: true,
    default: {
      Map: MockMap
    }
  };
});

function triggerMapEvent(
  eventName: string,
  featureId: string,
  layerId = 'worldaltar-markers-circle'
) {
  const call = on.mock.calls.find(
    ([event, layer]) => event === eventName && layer === layerId
  );
  const callback =
    (typeof call?.[2] === 'function' ? call[2] : undefined) ??
    (typeof call?.[1] === 'function' ? call[1] : undefined);

  callback?.({
    features: [
      {
        properties: {
          id: featureId
        }
      }
    ]
  });
}

describe('App', () => {
  beforeEach(() => {
    const createCounters = {
      character: 1,
      location: 1,
      region: 1,
      event: 1
    };
    vi.useRealTimers();
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'offline-raster-v1',
          mode: 'bundled_raster',
          styleUrl: '/offline-map/style.json',
          manifestUrl: '/offline-map/manifest.json',
          minZoom: 0,
          maxZoom: 1,
          coverage: 'world-low-zoom'
        })
      })
    );

    getSource.mockImplementation((id?: string) => {
      if (id === 'worldaltar-markers') {
        return { setData };
      }

      return undefined;
    });

    on.mockImplementation((event: string, arg2?: unknown, arg3?: unknown) => {
      const callback =
        typeof arg2 === 'function'
          ? arg2
          : typeof arg3 === 'function'
            ? arg3
            : undefined;

      if (event === 'load') {
        callback?.();
      }
    });

    createWorld.mockResolvedValue({
      slug: 'empty-world',
      databasePath:
        'C:/Users/Test/Documents/WorldAltar/worlds/empty-world/worldaltar.db'
    });
    createDemoWorld.mockResolvedValue({
      slug: 'demo-world',
      databasePath:
        'C:/Users/Test/Documents/WorldAltar/worlds/demo-world/worldaltar.db'
    });
    listManuscriptTree.mockResolvedValue([
      {
        node: {
          id: 'msc_ch_001',
          parentId: null,
          kind: 'chapter',
          slug: 'chapter-1',
          title: 'Chapter 1',
          body: '',
          summary: '',
          position: 1,
          createdAt: '1',
          updatedAt: '1'
        },
        children: [
          {
            id: 'msc_sc_001',
            parentId: 'msc_ch_001',
            kind: 'scene',
            slug: 'arrival',
            title: 'Arrival',
            body: 'Arrival body',
            summary: 'Arrival summary',
            position: 1,
            createdAt: '1',
            updatedAt: '1'
          }
        ]
      }
    ]);
    getManuscriptScene.mockResolvedValue({
      node: {
        id: 'msc_sc_001',
        parentId: 'msc_ch_001',
        kind: 'scene',
        slug: 'arrival',
        title: 'Arrival',
        body: 'Arrival body',
        summary: 'Arrival summary',
        position: 1,
        createdAt: '1',
        updatedAt: '1'
      },
      mentions: [
        {
          id: 'mm_001',
          nodeId: 'msc_sc_001',
          entityId: 'char_001',
          label: 'Alp Er Tunga',
          startOffset: 0,
          endOffset: 12
        }
      ]
    });
    listManuscriptBacklinks.mockResolvedValue([
      {
        nodeId: 'msc_sc_001',
        chapterId: 'msc_ch_001',
        chapterTitle: 'Chapter 1',
        sceneTitle: 'Arrival',
        entityId: 'char_001',
        label: 'Alp Er Tunga'
      }
    ]);
    recoverManuscriptAutosave.mockResolvedValue({
      recoveredCount: 0,
      conflictedCount: 0,
      discardedCount: 0
    });
    listExportJobs.mockResolvedValue([
      {
        id: 'job_001',
        kind: 'pdf_dossier',
        status: 'done',
        targetPath: 'C:/Users/Test/Documents/WorldAltar/export/dossier.pdf',
        artifactPaths: [
          'C:/Users/Test/Documents/WorldAltar/export/dossier.pdf'
        ],
        createdAt: '9'
      },
      {
        id: 'job_002',
        kind: 'manuscript_pdf',
        status: 'queued',
        targetPath: 'C:/Users/Test/Documents/WorldAltar/export/manuscript.pdf',
        artifactPaths: [],
        createdAt: '10'
      }
    ]);
    queueExport.mockImplementation(async (_databasePath: string, request) => ({
      id: `job_${request.kind}`,
      kind: request.kind,
      status: 'queued',
      targetPath: `C:/Users/Test/Documents/WorldAltar/export/${request.kind}.pdf`,
      artifactPaths: [],
      createdAt: '10'
    }));
    autosaveManuscriptScene.mockImplementation(
      async (
        _databasePath: string,
        input: {
          id: string;
          title: string;
          summary: string;
          body: string;
          mentions?: Array<{
            entityId: string;
            label: string;
            startOffset: number;
            endOffset: number;
          }>;
        }
      ) => ({
        node: {
          id: input.id,
          parentId: 'msc_ch_001',
          kind: 'scene',
          slug: 'arrival',
          title: input.title,
          body: input.body,
          summary: input.summary,
          position: 1,
          createdAt: '1',
          updatedAt: '8'
        },
        mentions: (input.mentions?.length
          ? input.mentions
          : [
              {
                entityId: 'char_001',
                label: 'Alp Er Tunga',
                startOffset: 0,
                endOffset: 12
              }
            ]
        ).map((mention, index) => ({
          id: `mm_${index + 1}`,
          nodeId: input.id,
          entityId: mention.entityId,
          label: mention.label,
          startOffset: mention.startOffset,
          endOffset: mention.endOffset
        }))
      })
    );

    listEntities.mockResolvedValue([
      {
        type: 'character',
        common: {
          id: 'char_001',
          type: 'character',
          slug: 'alp-er-tunga',
          title: 'Alp Er Tunga',
          summary: 'Hero',
          body: 'Hero seed body',
          startYear: 1200,
          endYear: null,
          isOngoing: false,
          latitude: 41,
          longitude: 69,
          geometryRef: null,
          coverImagePath: null,
          thumbnailPath: null,
          createdAt: '1',
          updatedAt: '1'
        },
        fields: { culture: 'Turkic', birthYearLabel: null }
      },
      {
        type: 'event',
        common: {
          id: 'evt_001',
          type: 'event',
          slug: 'raid-at-dawn',
          title: 'Raid at Dawn',
          summary: 'Event seed',
          body: 'Event body',
          startYear: 1204,
          endYear: 1204,
          isOngoing: false,
          latitude: 40,
          longitude: 70,
          geometryRef: null,
          coverImagePath: null,
          thumbnailPath: null,
          createdAt: '1',
          updatedAt: '1'
        },
        fields: { eventKind: 'battle' }
      }
    ]);

    searchEntities.mockResolvedValue([
      {
        id: 'char_001',
        title: 'Alp Er Tunga',
        summary: 'Hero',
        type: 'character'
      }
    ]);

    recoverAutosave.mockResolvedValue({
      recoveredCount: 1,
      conflictedCount: 0,
      discardedCount: 0
    });

    autosaveEntity.mockImplementation(
      async (
        _dbPath: string,
        input: { id: string; title: string; summary: string; body: string }
      ) => ({
        type: 'character',
        common: {
          id: input.id,
          type: 'character',
          slug: 'alp-er-tunga',
          title: input.title,
          summary: input.summary,
          body: input.body,
          startYear: 1200,
          endYear: null,
          isOngoing: false,
          latitude: 41,
          longitude: 69,
          geometryRef: null,
          coverImagePath: null,
          thumbnailPath: null,
          createdAt: '1',
          updatedAt: '6'
        },
        fields: { culture: 'Turkic', birthYearLabel: null }
      })
    );
    createEntity.mockImplementation(
      async (
        _databasePath: string,
        input: {
          type: string;
          common: {
            title: string;
            summary?: string;
            body?: string;
            startYear?: number | null;
            endYear?: number | null;
            latitude?: number | null;
            longitude?: number | null;
          };
          fields: Record<string, unknown>;
        }
      ) => ({
        ...(createCounters[input.type as keyof typeof createCounters]++,
        {}),
        type: input.type,
        common: {
          id:
            input.type === 'character'
              ? `char_${String(createCounters.character).padStart(3, '0')}`
              : input.type === 'location'
                ? `loc_${String(createCounters.location).padStart(3, '0')}`
                : input.type === 'region'
                  ? `reg_${String(createCounters.region).padStart(3, '0')}`
                  : `evt_${String(createCounters.event).padStart(3, '0')}`,
          type: input.type,
          slug: input.common.title.toLowerCase().replace(/\s+/g, '-'),
          title: input.common.title,
          summary: input.common.summary ?? '',
          body: input.common.body ?? '',
          startYear: input.common.startYear ?? null,
          endYear: input.common.endYear ?? null,
          isOngoing: false,
          latitude: input.common.latitude ?? null,
          longitude: input.common.longitude ?? null,
          geometryRef: null,
          coverImagePath: null,
          thumbnailPath: null,
          createdAt: '11',
          updatedAt: '11'
        },
        fields: input.fields
      })
    );
    updateEntityMedia.mockImplementation(
      async (
        _databasePath: string,
        input: { id: string; coverImagePath: string | null; thumbnailPath: string | null }
      ) => ({
        type: 'event',
        common: {
          id: input.id,
          type: 'event',
          slug: 'new-winter-camp-event',
          title: 'New Winter Camp event',
          summary: 'Event linked to Winter Camp',
          body: '',
          startYear: null,
          endYear: null,
          isOngoing: false,
          latitude: null,
          longitude: null,
          geometryRef: null,
          coverImagePath: input.coverImagePath,
          thumbnailPath: input.thumbnailPath,
          createdAt: '11',
          updatedAt: '12'
        },
        fields: {
          locationId: 'loc_002'
        }
      })
    );
    importEntityMedia.mockImplementation(
      async (
        _databasePath: string,
        input: { id: string; sourcePath: string; variant: 'cover' | 'thumbnail' }
      ) => ({
        type: 'event',
        common: {
          id: input.id,
          type: 'event',
          slug: 'new-winter-camp-event',
          title: 'New Winter Camp event',
          summary: 'Event linked to Winter Camp',
          body: '',
          startYear: null,
          endYear: null,
          isOngoing: false,
          latitude: null,
          longitude: null,
          geometryRef: null,
          coverImagePath:
            input.variant === 'cover'
              ? 'C:/Users/Test/Documents/WorldAltar/worlds/demo-world/assets/entities/event/new-winter-camp-event/cover.png'
              : 'C:/art/winter-camp.png',
          thumbnailPath:
            input.variant === 'thumbnail'
              ? 'C:/Users/Test/Documents/WorldAltar/worlds/demo-world/assets/entities/event/new-winter-camp-event/thumb.png'
              : 'C:/art/winter-camp-thumb.png',
          createdAt: '11',
          updatedAt: '14'
        },
        fields: {
          locationId: 'loc_002'
        }
      })
    );
    updateEntityLinks.mockImplementation(
      async (
        _databasePath: string,
        input: {
          id: string;
          regionId: string | null;
          parentRegionId: string | null;
          locationId: string | null;
        }
      ) => ({
        type: 'event',
        common: {
          id: input.id,
          type: 'event',
          slug: 'new-winter-camp-event',
          title: 'New Winter Camp event',
          summary: 'Event linked to Winter Camp',
          body: '',
          startYear: null,
          endYear: null,
          isOngoing: false,
          latitude: null,
          longitude: null,
          geometryRef: null,
          coverImagePath: 'C:/art/winter-camp.png',
          thumbnailPath: 'C:/art/winter-camp-thumb.png',
          createdAt: '11',
          updatedAt: '13'
        },
        fields: {
          locationId: input.locationId
        }
      })
    );
  });

  it('keeps only MVP lenses and one-shot startup recovery', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Empty World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create world/i }));

    await screen.findByText('empty-world');

    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('WikiMapTimelineSearch');
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).not.toHaveTextContent('Manuscript');
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).not.toHaveTextContent('Canvas');
    expect(screen.getByLabelText(/deferred lens flags/i)).toHaveTextContent(
      'ManuscriptOffCanvasOffExportOffRelationsOff'
    );
    expect(
      screen.getByText(/Recovered 1 \/ Conflicts 0 \/ Dropped 0/i)
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/year slider/i), {
      target: { value: '1205' }
    });

    await waitFor(() => expect(listEntities).toHaveBeenCalledTimes(2));
    expect(createDemoWorld).not.toHaveBeenCalled();
    expect(recoverAutosave).toHaveBeenCalledTimes(1);
  });

  it(
    'creates demo world on explicit path and keeps MVP shell behavior',
    async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('Alp Er Tunga');
    expect(createWorld).not.toHaveBeenCalled();
    expect(createDemoWorld).toHaveBeenCalledWith('Demo World');
    expect(screen.getByLabelText(/wiki spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/character group/i)).toHaveTextContent('1');
    expect(screen.getByLabelText(/event group/i)).toHaveTextContent('1');
    expect(screen.getByLabelText(/detail facts/i)).toHaveTextContent('Theme');
    expect(screen.getByLabelText(/asset manifest/i)).toHaveTextContent(
      'CoverfallbackLogologoMotifmotif'
    );
    expect(screen.getAllByText('Dusk')[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/create entity studio/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/create entity type/i), {
      target: { value: 'location' }
    });
    fireEvent.change(screen.getByLabelText(/create entity title/i), {
      target: { value: 'Winter Camp' }
    });
    fireEvent.change(screen.getByLabelText(/create entity summary/i), {
      target: { value: 'Cold base' }
    });
    fireEvent.change(screen.getByLabelText(/create location kind/i), {
      target: { value: 'camp' }
    });
    fireEvent.change(screen.getByLabelText(/create latitude/i), {
      target: { value: '42.1' }
    });
    fireEvent.change(screen.getByLabelText(/create longitude/i), {
      target: { value: '71.2' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create location/i }));

    await waitFor(() =>
      expect(createEntity).toHaveBeenCalledWith(expect.any(String), {
        type: 'location',
        common: {
          title: 'Winter Camp',
          summary: 'Cold base',
          body: undefined,
          startYear: null,
          endYear: null,
          latitude: 42.1,
          longitude: 71.2
        },
        fields: {
          regionId: null,
          locationKind: 'camp'
        }
      })
    );
    expect(screen.getByLabelText(/wiki spotlight/i)).toHaveTextContent(
      'Winter Camp'
    );
    expect(screen.getByLabelText(/create presets/i)).toHaveTextContent(
      'New event at selected location'
    );
    expect(screen.getByLabelText(/spotlight actions/i)).toHaveTextContent(
      'New event here'
    );
    fireEvent.click(
      within(screen.getByLabelText(/spotlight actions/i)).getByRole('button', {
        name: /new event here/i
      })
    );
    await waitFor(() =>
      expect(createEntity).toHaveBeenLastCalledWith(expect.any(String), {
        type: 'event',
        common: {
          title: 'New Winter Camp event',
          summary: 'Event linked to Winter Camp'
        },
        fields: {
          locationId: 'loc_002'
        }
      })
    );
    fireEvent.click(
      within(screen.getByLabelText(/location group/i))
        .getAllByText('Winter Camp')[0]
        .closest('button') as HTMLButtonElement
    );
    await screen.findByLabelText(/create presets/i);
    fireEvent.click(
      screen.getByRole('button', { name: /new event at selected location/i })
    );
    expect(screen.getByLabelText(/create entity type/i)).toHaveValue('event');
    expect(screen.getByLabelText(/create event location/i)).toHaveValue(
      'loc_002'
    );
    expect(screen.getByLabelText(/detail authoring/i)).toHaveTextContent(
      'New event here'
    );
    fireEvent.click(
      within(screen.getByLabelText(/detail authoring/i)).getByRole('button', {
        name: /new event here/i
      })
    );
    await waitFor(() =>
      expect(createEntity).toHaveBeenLastCalledWith(expect.any(String), {
        type: 'event',
        common: {
          title: 'New Winter Camp event',
          summary: 'Event linked to Winter Camp'
        },
        fields: {
          locationId: 'loc_002'
        }
      })
    );
    expect(screen.getByLabelText(/wiki spotlight/i)).toHaveTextContent(
      'New Winter Camp event'
    );
    fireEvent.click(screen.getByRole('button', { name: /preset asset paths/i }));
    expect(screen.getByLabelText(/cover path/i)).toHaveValue(
      'assets/entities/event/new-winter-camp-event/cover.png'
    );
    expect(screen.getByLabelText(/thumbnail path/i)).toHaveValue(
      'assets/entities/event/new-winter-camp-event/thumb.png'
    );
    fireEvent.change(screen.getByLabelText(/source path/i), {
      target: { value: 'D:/drop/winter-camp.png' }
    });
    fireEvent.click(screen.getByRole('button', { name: /import to cover/i }));
    await waitFor(() =>
      expect(importEntityMedia).toHaveBeenCalledWith(expect.any(String), {
        id: 'evt_003',
        sourcePath: 'D:/drop/winter-camp.png',
        variant: 'cover'
      })
    );
    fireEvent.change(screen.getByLabelText(/cover path/i), {
      target: { value: 'C:/art/winter-camp.png' }
    });
    fireEvent.change(screen.getByLabelText(/thumbnail path/i), {
      target: { value: 'C:/art/winter-camp-thumb.png' }
    });
    fireEvent.click(screen.getByRole('button', { name: /save asset paths/i }));
    await waitFor(() =>
      expect(updateEntityMedia).toHaveBeenCalledWith(expect.any(String), {
        id: 'evt_003',
        coverImagePath: 'C:/art/winter-camp.png',
        thumbnailPath: 'C:/art/winter-camp-thumb.png'
      })
    );
    fireEvent.change(screen.getByLabelText(/^event location$/i), {
      target: { value: 'loc_002' }
    });
    fireEvent.click(screen.getByRole('button', { name: /save relation link/i }));
    await waitFor(() =>
      expect(updateEntityLinks).toHaveBeenCalledWith(expect.any(String), {
        id: 'evt_003',
        regionId: null,
        parentRegionId: null,
        locationId: 'loc_002'
      })
    );

    fireEvent.mouseEnter(
      screen
        .getAllByText('Alp Er Tunga')[0]
        .closest('button') as HTMLButtonElement
    );
    expect(screen.getByLabelText(/hover preview/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open wiki/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open timeline/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /open map/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
    fireEvent.change(screen.getByLabelText(/search query/i), {
      target: { value: 'alp' }
    });
    fireEvent.change(screen.getByLabelText(/entity type/i), {
      target: { value: 'character' }
    });
    await waitFor(() =>
      expect(searchEntities).toHaveBeenCalledWith(
        expect.any(String),
        'alp',
        1204,
        'character'
      )
    );

    fireEvent.click(screen.getByRole('button', { name: /^Timeline$/i }));
    expect(screen.getByLabelText(/timeline spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );

    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    expect(screen.getByLabelText(/offline world map/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/map package status/i)).toHaveTextContent(
        'bundled_rasterworld-low-zoomz0-1manifest ok'
      )
    );
    expect(screen.getByLabelText(/map overlays/i)).toHaveTextContent(
      'Geo 1 @ 1204'
    );
    expect(screen.getByLabelText(/map summary/i)).toHaveTextContent(
      'Visible1Geocoded1Events0Places0Selectedchar_001'
    );
    expect(screen.getByLabelText(/map type strip/i)).toHaveTextContent(
      'Characters1Regions0Events0Places0'
    );
    expect(screen.getByLabelText(/map legend/i)).toHaveTextContent(
      'Character1Region0Event0Place0'
    );
    expect(screen.getByLabelText(/map focus rail/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/map selected strip/i)).toHaveTextContent(
      'Visible at 1204characterAlp Er TungaHero41, 69Open wikiOpen timeline'
    );
    await act(async () => {
      triggerMapEvent('mousemove', 'char_001');
      await Promise.resolve();
    });
    expect(screen.getByLabelText(/map hover preview/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(
      screen.getByRole('button', { name: /^show detail$/i })
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^show detail$/i }));
    expect(screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByLabelText(/map selected strip/i)).getByRole('button', {
        name: /^open timeline$/i
      })
    );
    expect(screen.getByLabelText(/timeline spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    fireEvent.click(
      within(screen.getByLabelText(/map hover preview/i)).getByRole('button', {
        name: /^open timeline$/i
      })
    );
    expect(screen.getByLabelText(/timeline spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    await act(async () => {
      triggerMapEvent('mousemove', 'char_001');
      await Promise.resolve();
    });
    fireEvent.click(
      within(screen.getByLabelText(/map hover preview/i)).getByRole('button', {
        name: /^open wiki$/i
      })
    );
    expect(screen.getByLabelText(/wiki spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    fireEvent.click(screen.getByRole('button', { name: /geo 1/i }));
    expect(screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByLabelText(/map type strip/i)).getByRole('button', {
        name: /characters 1/i
      })
    );
    expect(screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)).toBeInTheDocument();
    expect(on).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /^Wiki$/i }));
    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText(/^Summary$/i), {
      target: { value: 'Hero revised' }
    });
    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(autosaveEntity).toHaveBeenCalledTimes(1);
    expect(screen.getByText(/Saved 6/i)).toBeInTheDocument();
    },
    10000
  );

  it('opens manuscript only after explicit deferred flag toggle', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');

    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).not.toHaveTextContent('Manuscript');
    fireEvent.click(screen.getByText('Raid at Dawn'));

    const deferredFlags = screen.getByLabelText(/deferred lens flags/i);
    fireEvent.click(
      within(deferredFlags).getAllByRole('button', { name: /^Off$/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));

    await screen.findByLabelText(/manuscript lens/i);
    expect(recoverManuscriptAutosave).toHaveBeenCalledTimes(1);
    expect(listManuscriptTree).toHaveBeenCalledTimes(1);
    expect(getManuscriptScene).toHaveBeenCalledWith(
      expect.any(String),
      'msc_sc_001'
    );
    expect(screen.getByDisplayValue('Arrival body')).toBeInTheDocument();
    expect(screen.getByLabelText(/manuscript facts/i)).toHaveTextContent(
      'msc_sc_001'
    );
    expect(screen.getByLabelText(/manuscript mentions/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/manuscript studio/i)).toHaveTextContent(
      'ChapterChapter 1Order1.1Words2Read1 minMentions1Summaryset'
    );
    expect(screen.getByLabelText(/manuscript bridge/i)).toHaveTextContent(
      'eventevt_001Visible at 1204Backlinks 1Raid at Dawn'
    );
    expect(screen.getByLabelText(/manuscript mention picker/i)).toHaveTextContent(
      'Alp Er TungaRaid at Dawn'
    );
    expect(
      screen.getByLabelText(/manuscript timeline context/i)
    ).toHaveTextContent('Alp Er Tunga @ 1200');
    expect(screen.getByText(/1 scenes/i)).toBeInTheDocument();
    const manuscriptBody = screen.getByLabelText(
      /manuscript body/i
    ) as HTMLTextAreaElement;
    manuscriptBody.setSelectionRange(8, 8);
    fireEvent.select(manuscriptBody);
    fireEvent.click(
      within(screen.getByLabelText(/manuscript mention picker/i)).getByRole(
        'button',
        { name: /alp er tunga/i }
      )
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript bridge/i)).getByRole('button', {
        name: /insert mention/i
      })
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/manuscript body/i)).toHaveValue(
        'Arrival Alp Er Tunga Raid at Dawn body'
      )
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript bridge/i)).getByRole('button', {
        name: /^open timeline$/i
      })
    );
    expect(screen.getByLabelText(/timeline spotlight/i)).toHaveTextContent(
      'Raid at Dawn'
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));
    fireEvent.click(
      within(screen.getByLabelText(/manuscript timeline context/i)).getByRole(
        'button',
        { name: /alp er tunga @ 1200/i }
      )
    );
    expect(screen.getByLabelText(/timeline spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));

    fireEvent.click(screen.getByRole('button', { name: /split/i }));
    expect(screen.getByLabelText(/book preview/i)).toBeInTheDocument();
    expect(
      screen.getAllByLabelText(/book page|chapter break page/i).length
    ).toBe(2);

    fireEvent.click(screen.getByRole('button', { name: /book/i }));
    expect(screen.getByLabelText(/book preview/i)).toHaveTextContent('2 pages');

    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText(/manuscript body/i), {
      target: { value: 'Arrival body revised' }
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(autosaveManuscriptScene).toHaveBeenCalledTimes(1);
    expect(autosaveManuscriptScene).toHaveBeenLastCalledWith(
      expect.any(String),
      expect.objectContaining({
        mentions: expect.arrayContaining([
          expect.objectContaining({
            entityId: 'char_001',
            label: 'Alp Er Tunga'
          }),
          expect.objectContaining({
            entityId: 'evt_001',
            label: 'Raid at Dawn'
          })
        ])
      })
    );

    await act(async () => {
    fireEvent.click(
      within(screen.getByLabelText(/manuscript mentions/i)).getAllByRole(
        'button',
        { name: /alp er tunga \[char_001\]/i }
      )[0]
      );
      await Promise.resolve();
    });
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('Wiki');
    expect(screen.getByLabelText(/detail scene context/i)).toHaveTextContent(
      '1 linked scenesChapter 11200 startOpen latest sceneOpen scene graph'
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /arrival/i }));
      await Promise.resolve();
    });
    expect(screen.getByLabelText(/manuscript lens/i)).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByLabelText(/detail scene context/i)).getByRole(
        'button',
        { name: /open latest scene/i }
      )
    );
    expect(screen.getByLabelText(/manuscript lens/i)).toBeInTheDocument();
  });

  it('opens canvas export relations only after explicit deferred flags', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');

    const deferredFlags = screen.getByLabelText(/deferred lens flags/i);
    const flagButtons = within(deferredFlags).getAllByRole('button', {
      name: /^Off$/i
    });

    fireEvent.click(flagButtons[0]);
    fireEvent.click(flagButtons[1]);
    fireEvent.click(flagButtons[2]);
    fireEvent.click(flagButtons[3]);

    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('Canvas');
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('Export');
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('Relations');

    fireEvent.click(screen.getByRole('button', { name: /^Canvas$/i }));
    expect(screen.getByLabelText(/canvas lens/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/canvas spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/canvas views/i)).toHaveTextContent(
      'RelationsFamilyChainYear 1204'
    );
    expect(screen.getByLabelText(/canvas links/i)).toHaveTextContent('linked');

    fireEvent.click(screen.getByRole('button', { name: /family/i }));
    expect(screen.getByLabelText(/canvas links/i)).toHaveTextContent(
      'blood line'
    );

    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
    await screen.findByLabelText(/export lens/i);
    expect(listExportJobs).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText(/export spotlight/i)).toHaveTextContent(
      'pdf_dossier'
    );
    expect(screen.getByLabelText(/export filters/i)).toHaveTextContent(
      'AllDossierManuscript'
    );
    expect(screen.getByLabelText(/export spotlight/i)).toHaveTextContent(
      '2 jobs1 artifacts'
    );
    expect(screen.getByLabelText(/artifact spotlight/i)).toHaveTextContent(
      'dossier.pdfdossier.pdfpdf_dossierdone'
    );
    expect(
      screen.getByLabelText(/manuscript export metadata/i)
    ).toHaveTextContent('manuscript.pdfNo artifact yetqueued0 files');
    expect(screen.getByLabelText(/^export package$/i)).toHaveTextContent(
      'Dossier bundleC:/Users/Test/Documents/WorldAltar/export2 jobs2 files'
    );
    expect(screen.getByLabelText(/curated outputs/i)).toHaveTextContent(
      'Curated outputs2 lanesDossier sheetdossier.pdfdone1 filesManuscript PDFmanuscript.pdfqueued0 files'
    );
    expect(screen.getByLabelText(/bundle readiness/i)).toHaveTextContent(
      '3/3 lanesReusable world bundle closeDossier readyManuscript readyBundle ready'
    );
    expect(screen.getByLabelText(/reference sheets/i)).toHaveTextContent(
      'Reference sheets2 sheetsWorld dossierdossier.pdfwiki/mapdoneScene manuscriptmanuscript.pdfmanuscriptqueued'
    );
    expect(screen.getByLabelText(/export manifest/i)).toHaveTextContent(
      'Asset manifestC:/Users/Test/Documents/WorldAltar/export1 artifact filesPDF 1Other 0'
    );
    expect(screen.getByLabelText(/export history/i)).toHaveTextContent(
      'Export history2 lanesDossier lane9done1 runsManuscript lane10queued1 runs'
    );
    expect(screen.getByLabelText(/delivery checklist/i)).toHaveTextContent(
      'Delivery checklist4 checksQueuedone2 jobs trackedDossier lanereadyworld sheet path presentManuscript lanereadybook path presentArtifactsreadyartifact files present'
    );
    expect(screen.getByLabelText(/format readiness/i)).toHaveTextContent(
      'Format readiness2 formatsPDFreadyartifact path presentEPUBlaterfuture richer format'
    );
    expect(screen.getByLabelText(/target roots/i)).toHaveTextContent(
      'Target roots1 rootsC:/Users/Test/Documents/WorldAltar/exportmanuscript.pdf2 jobs1 artifacts'
    );
    expect(screen.getByLabelText(/export groups/i)).toHaveTextContent(
      'Dossier1 jobspdf_dossierdone'
    );
    expect(screen.getByLabelText(/export groups/i)).toHaveTextContent(
      'dossier.pdf'
    );
    expect(screen.getByLabelText(/export groups/i)).toHaveTextContent(
      'Manuscript1 jobsmanuscript_pdfqueued'
    );
    expect(screen.getByLabelText(/export packages/i)).toHaveTextContent(
      'Packages1 rootsDossier bundleC:/Users/Test/Documents/WorldAltar/export2 jobs2 files'
    );
    expect(screen.getByLabelText(/artifacts job_001/i)).toHaveTextContent(
      'dossier.pdf'
    );

    fireEvent.click(
      within(screen.getByLabelText(/export filters/i)).getByRole('button', {
        name: /manuscript/i
      })
    );
    expect(screen.getByLabelText(/export spotlight/i)).toHaveTextContent(
      'manuscript_pdfqueued1 jobs0 artifacts'
    );
    expect(screen.getByLabelText(/artifact spotlight/i)).toHaveTextContent(
      'No artifact yetmanuscript.pdfmanuscript_pdfqueued'
    );
    expect(
      screen.getByLabelText(/manuscript export metadata/i)
    ).toHaveTextContent('manuscript.pdfNo artifact yetqueued0 files');
    expect(screen.getByLabelText(/^export package$/i)).toHaveTextContent(
      'Manuscript bundleC:/Users/Test/Documents/WorldAltar/export1 jobs1 files'
    );
    expect(screen.getByLabelText(/curated outputs/i)).toHaveTextContent(
      'Curated outputs1 lanesManuscript PDFmanuscript.pdfqueued0 files'
    );
    expect(screen.getByLabelText(/bundle readiness/i)).toHaveTextContent(
      '1/3 lanesBundle still partialDossier pendingManuscript readyBundle pending'
    );
    expect(screen.getByLabelText(/reference sheets/i)).toHaveTextContent(
      'Reference sheets1 sheetsScene manuscriptmanuscript.pdfmanuscriptqueued'
    );
    expect(screen.getByLabelText(/export manifest/i)).toHaveTextContent(
      'Asset manifestC:/Users/Test/Documents/WorldAltar/exportNo artifact files yetPDF 0Other 0'
    );
    expect(screen.getByLabelText(/export history/i)).toHaveTextContent(
      'Export history1 lanesManuscript lane10queued1 runs'
    );
    expect(screen.getByLabelText(/delivery checklist/i)).toHaveTextContent(
      'Delivery checklist4 checksQueuequeued1 jobs trackedDossier lanependingno dossier jobManuscript lanereadybook path presentArtifactspendingartifact files missing'
    );
    expect(screen.getByLabelText(/format readiness/i)).toHaveTextContent(
      'Format readiness2 formatsPDFreadyqueue onlyEPUBlaterfuture richer format'
    );
    expect(screen.getByLabelText(/target roots/i)).toHaveTextContent(
      'Target roots1 rootsC:/Users/Test/Documents/WorldAltar/exportmanuscript.pdf1 jobs0 artifacts'
    );

    fireEvent.click(screen.getByRole('button', { name: /queue dossier pdf/i }));
    await waitFor(() =>
      expect(queueExport).toHaveBeenCalledWith(expect.any(String), {
        kind: 'pdf_dossier'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /^Relations$/i }));
    expect(screen.getByLabelText(/relations lens/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/relations spotlight/i)).toHaveTextContent(
      'Alp Er Tunga1 backlinkschar_0011 chapters'
    );
    expect(screen.getByLabelText(/relations groups/i)).toHaveTextContent(
      'Chapter 11 scenesArrivalChapter 1Alp Er Tunga'
    );
  });

  it('keeps map usable when manifest load fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');

    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    expect(screen.getByLabelText(/offline world map/i)).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByLabelText(/map package status/i)).toHaveTextContent(
        'bundled_rasterworld-low-zoomz0-1fallback'
      )
    );
    expect(on).toHaveBeenCalled();
    expect(
      screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)
    ).toBeInTheDocument();
  });
});
