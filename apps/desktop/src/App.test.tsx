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

vi.setConfig({ testTimeout: 20000 });

const {
  addLayer,
  addSource,
  easeTo,
  getSource,
  on,
  remove,
  setData,
  autosaveManuscriptScene,
  createManuscriptChapter,
  createManuscriptScene,
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
  createManuscriptChapter: vi.fn(),
  createManuscriptScene: vi.fn(),
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
  createManuscriptChapter,
  createManuscriptScene,
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
        primaryArtifactPath:
          'C:/Users/Test/Documents/WorldAltar/export/dossier.pdf',
        artifactPaths: [
          'C:/Users/Test/Documents/WorldAltar/export/asset-manifest.json'
        ],
        createdAt: '9'
      },
      {
        id: 'job_002',
        kind: 'manuscript_pdf',
        status: 'queued',
        targetPath: 'C:/Users/Test/Documents/WorldAltar/export/manuscript.pdf',
        primaryArtifactPath: null,
        artifactPaths: [],
        createdAt: '10'
      }
    ]);
    queueExport.mockImplementation(async (_databasePath: string, request) => ({
      id: `job_${request.kind}`,
      kind: request.kind,
      status: 'queued',
      targetPath: `C:/Users/Test/Documents/WorldAltar/export/${request.kind}.pdf`,
      primaryArtifactPath: null,
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
    createManuscriptChapter.mockImplementation(async (_databasePath: string, input: { title: string }) => ({
      id: 'msc_ch_002',
      parentId: null,
      kind: 'chapter',
      slug: input.title.toLowerCase().replace(/\s+/g, '-'),
      title: input.title,
      body: '',
      summary: '',
      position: 2,
      createdAt: '12',
      updatedAt: '12'
    }));
    createManuscriptScene.mockImplementation(
      async (
        _databasePath: string,
        input: {
          chapterId: string;
          title: string;
          body?: string;
          summary?: string;
          mentions: Array<{
            entityId: string;
            label: string;
            startOffset: number;
            endOffset: number;
          }>;
        }
      ) => ({
        node: {
          id: 'msc_sc_002',
          parentId: input.chapterId,
          kind: 'scene',
          slug: input.title.toLowerCase().replace(/\s+/g, '-'),
          title: input.title,
          body: input.body ?? '',
          summary: input.summary ?? '',
          position: 2,
          createdAt: '13',
          updatedAt: '13'
        },
        mentions: input.mentions.map((mention, index) => ({
          id: `mm_scene_create_${index + 1}`,
          nodeId: 'msc_sc_002',
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
    expect(screen.getByLabelText(/shell summary strip/i)).toHaveTextContent(
      'World demo-worldLens WikiFocus Alp Er TungaTheme DuskDeferred core only'
    );
    expect(screen.getByLabelText(/workspace curation strip/i)).toHaveTextContent(
      'Project demo-worldVisible 2Type CharacterYear 1204Theme Dusk'
    );
    expect(screen.getByLabelText(/workspace spotlight strip/i)).toHaveTextContent(
      'Lens WikiAlp Er Tunga2 visible recordsKart-first liste. Detail ve map ile bagli.'
    );
    expect(screen.getByLabelText(/workspace curation rail/i)).toHaveTextContent(
      'Lens WikiAnchor CharacterShelf 2Query clear'
    );
    expect(screen.getByLabelText(/workspace mood strip/i)).toHaveTextContent(
      'Mode WikiCurate canonFocus Character'
    );
    expect(screen.getByLabelText(/workspace editorial strip/i)).toHaveTextContent(
      'Focus Alp Er TungaCharacter 1200Cover fallbackDeferred core'
    );
    expect(screen.getByLabelText(/workspace state board/i)).toHaveTextContent(
      'Startup readyDraft steadyFilter allSearch idle'
    );
    expect(screen.getByLabelText(/workspace shell digest/i)).toHaveTextContent(
      'Shell WikiWorld mountedFocus lockedDeferred core'
    );
    expect(screen.getByLabelText(/workspace session strip/i)).toHaveTextContent(
      'Session DuskYear 12042 recordsAutosave ready'
    );
    expect(screen.getByLabelText(/workspace desk atlas/i)).toHaveTextContent(
      'Atlas WikiFocus Alp Er TungaAll shelvesDraft settled'
    );
    expect(screen.getByLabelText(/workspace collector strip/i)).toHaveTextContent(
      'Characters 1Regions 0Events 1Places 0Focus tracked'
    );
    expect(screen.getByLabelText(/workspace provenance strip/i)).toHaveTextContent(
      'Slug demo-worldDB readySelected CharacterAutosave steady'
    );
    expect(createWorld).not.toHaveBeenCalled();
    expect(createDemoWorld).toHaveBeenCalledWith('Demo World');
    expect(screen.getByLabelText(/wiki spotlight/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/character group/i)).toHaveTextContent('1');
    expect(screen.getByLabelText(/event group/i)).toHaveTextContent('1');
    expect(screen.getByLabelText(/detail facts/i)).toHaveTextContent('Theme');
    expect(screen.getByLabelText(/detail luxury strip/i)).toHaveTextContent(
      'Character1200Fallback coverDusk'
    );
    expect(
      within(screen.getByLabelText(/detail draft assists/i)).getByRole('button', {
        name: /use summary cue/i
      })
    ).toBeInTheDocument();
    fireEvent.click(
      within(screen.getByLabelText(/detail draft assists/i)).getByRole('button', {
        name: /append character structure/i
      })
    );
    expect(
      within(screen.getByLabelText(/detail draft assists/i)).getByRole('button', {
        name: /append character structure/i
      })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/asset manifest/i)).toHaveTextContent(
      'CoverfallbackLogologoMotifmotif'
    );
    expect(screen.getAllByText('Dusk')[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/create entity studio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/create context/i)).toHaveTextContent(
      'Alp Er Tunga [char_001]'
    );
    fireEvent.click(
      screen.getByRole('button', { name: /fill character template/i })
    );
    expect(screen.getByLabelText(/create entity summary/i)).toHaveValue(
      'Core role, pressure, and presence.'
    );
    expect(screen.getByLabelText(/create entity body/i)).toHaveValue(
      'Identity:\nVoice:\nGoal:\nFear:\nKey ties:\nPublic legend:'
    );

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
          body:
            'Identity:\nVoice:\nGoal:\nFear:\nKey ties:\nPublic legend:',
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
    expect(screen.getByLabelText(/create entity title/i)).toHaveValue(
      'New Winter Camp event'
    );
    expect(screen.getByLabelText(/create entity body/i)).toHaveValue(
      'An event centered on Winter Camp. Capture stakes, participants, and aftermath here.'
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
    expect(screen.getByLabelText(/^hover preview$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hover preview strip/i)).toHaveTextContent(
      'char_0011200Fallback cover'
    );
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
    expect(screen.getByLabelText(/map overlays/i)).not.toHaveTextContent('T:');
    expect(screen.getByLabelText(/map summary/i)).toHaveTextContent(
      'Visible1Geocoded1Events0Places0Selectedchar_001'
    );
    expect(screen.getByLabelText(/map scope strip/i)).toHaveTextContent(
      'All layers1Characters1Regions0Events0Places0'
    );
    expect(screen.getByLabelText(/map year resonance/i)).toHaveTextContent(
      'Year resonancecharacter focusScope all layers at 12041 in layer0 ongoing'
    );
    expect(screen.getByLabelText(/map year shift/i)).toHaveTextContent(
      'Year shift1204Opening0 begin this yearClosing0 end this yearAnchored1 carry dated span'
    );
    expect(screen.getByLabelText(/map spatial ledger/i)).toHaveTextContent(
      'Spatial ledgerall layersRegions0territory memoryEvents0geography pressurePlaces0travel anchorsGeocoded1marker surface'
    );
    expect(screen.queryByLabelText(/map territory bands/i)).not.toBeInTheDocument();
    expect(screen.getByLabelText(/map relation ledger/i)).toHaveTextContent(
      'Relation ledgerchar_001Map anchorGeocodedcharacter surfaceTime span1200 - opentimeline bridgeSpatial tiesNo typed territory linkworld link can grow later'
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
    expect(screen.queryByLabelText(/map territory status/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map territory route/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map territory chain/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map territory pulse/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map region focus/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map region focus rail/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/map territory desk/i)).not.toBeInTheDocument();
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
      within(screen.getByLabelText(/map scope strip/i)).getByRole('button', {
        name: /characters 1/i
      })
    );
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
    expect(screen.getByLabelText(/chapter 1 chapter/i)).toHaveTextContent(
      '1 scenes1 linked'
    );
    expect(
      screen.getByLabelText(/arrival continuity badge/i)
    ).toHaveTextContent('Linked sceneAlp Er Tunga');
    expect(screen.getByLabelText(/manuscript facts/i)).toHaveTextContent(
      'msc_sc_001'
    );
    expect(screen.getByLabelText(/manuscript mentions/i)).toHaveTextContent(
      'Alp Er Tunga'
    );
    expect(screen.getByLabelText(/manuscript studio/i)).toHaveTextContent(
      'ChapterChapter 1Order1.1Words2Read1 minMentions1Summaryset'
    );
    expect(
      screen.getByLabelText(/create manuscript scene context/i)
    ).toHaveTextContent('eventevt_001Seed scene draftSeed selected context on');
    expect(
      screen.getByLabelText(/manuscript scene scaffolds/i)
    ).toHaveTextContent('Use scene scaffoldContinue linked thread');
    expect(
      screen.getByLabelText(/manuscript scene continuity/i)
    ).toHaveTextContent('Arrival');
    expect(
      screen.getByLabelText(/manuscript chapter affinity/i)
    ).toHaveTextContent('Chapter 1');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript chapter affinity/i)).getByRole(
        'button',
        { name: /^chapter 1$/i }
      )
    );
    expect(screen.getByLabelText(/create manuscript scene chapter/i)).toHaveValue(
      'msc_ch_001'
    );
    expect(
      screen.getByLabelText(/manuscript chapter rhythm/i)
    ).toHaveTextContent('Chapter 1Next scene 21 linkedMode openingSeed chapter beat');
    expect(
      screen.getByLabelText(/manuscript composition queue/i)
    ).toHaveTextContent(
      'Composition queueOpening slotscene 2activeContinuation anchorArrivalreadyLinked load1 linked in Chapter 1watchOpening lanescene 2open Chapter 1 with a decisive beatreadyReserve lanescene 2hold a flexible slot inside Chapter 1floatingFollow-up laneArrivalcontinue fallout after ArrivalreadyCurrent slotscene 2next placement inside Chapter 1Closing pressureArrivalcan close fallout from ArrivalAfter slotscene 3leave one lane available after this beatOpening lane cardscene 2launch Chapter 1 in visible motionactiveUse laneReserve lane cardscene 2keep Chapter 1 flexible for discoveryfloatingUse laneClosing lane cardscene 2shape one cost before scene 3watchUse laneFollow-up lane cardArrivalcarry fallout from ArrivalreadyUse laneNext sequence slotscene 2Chapter 1 follows ArrivalUse sequenceClosing sequence slotscene 2close pressure before scene 3Use sequenceAftermath sequence slotArrivalcontinue from ArrivalUse sequencePrevious sceneArrivalalready anchors Chapter 1Use outlineNext scenescene 2Chapter 1 advances after ArrivalUse outlineAftermath sceneArrivalwrite the consequence after ArrivalUse outlinePrevious frameArrivalChapter 1 came through this beatlockedUse storyboardCurrent framescene 2open the next visible turn after ArrivalactiveUse storyboardAftermath frameArrivalcarry consequence from ArrivalreadyUse storyboardPrevious ArrivalCurrent Chapter 1 scene 2Aftermath ArrivalPrevious laneArrivalChapter 1 currently rests on this sceneUse deskCurrent lanescene 2advance Chapter 1 with the next visible turnUse deskAftermath laneArrivalcontinue consequence from ArrivalUse deskPrev ArrivalNow Chapter 1 2After ArrivalOpen Chapter 1Reserve slotClose pressureAfter ArrivalQueue chapter openerQueue reserve slotQueue closing beatQueue follow-up'
    );
    expect(
      screen.getByLabelText(/manuscript queue lanes/i)
    ).toHaveTextContent(
      'Opening lanescene 2open Chapter 1 with a decisive beatreadyReserve lanescene 2hold a flexible slot inside Chapter 1floatingFollow-up laneArrivalcontinue fallout after Arrivalready'
    );
    expect(
      screen.getByLabelText(/manuscript chapter ordering/i)
    ).toHaveTextContent(
      'Current slotscene 2next placement inside Chapter 1Closing pressureArrivalcan close fallout from ArrivalAfter slotscene 3leave one lane available after this beat'
    );
    expect(
      screen.getByLabelText(/manuscript scene lanes/i)
    ).toHaveTextContent(
      'Opening lane cardscene 2launch Chapter 1 in visible motionactiveUse laneReserve lane cardscene 2keep Chapter 1 flexible for discoveryfloatingUse laneClosing lane cardscene 2shape one cost before scene 3watchUse laneFollow-up lane cardArrivalcarry fallout from ArrivalreadyUse lane'
    );
    expect(
      screen.getByLabelText(/manuscript scene sequence/i)
    ).toHaveTextContent(
      'Next sequence slotscene 2Chapter 1 follows ArrivalUse sequenceClosing sequence slotscene 2close pressure before scene 3Use sequenceAftermath sequence slotArrivalcontinue from ArrivalUse sequence'
    );
    expect(
      screen.getByLabelText(/manuscript scene outline/i)
    ).toHaveTextContent(
      'Previous sceneArrivalalready anchors Chapter 1Use outlineNext scenescene 2Chapter 1 advances after ArrivalUse outlineAftermath sceneArrivalwrite the consequence after ArrivalUse outline'
    );
    expect(
      screen.getByLabelText(/manuscript scene storyboard/i)
    ).toHaveTextContent(
      'Previous frameArrivalChapter 1 came through this beatlockedUse storyboardCurrent framescene 2open the next visible turn after ArrivalactiveUse storyboardAftermath frameArrivalcarry consequence from ArrivalreadyUse storyboard'
    );
    expect(
      screen.getByLabelText(/manuscript scene planning strip/i)
    ).toHaveTextContent('Previous ArrivalCurrent Chapter 1 scene 2Aftermath Arrival');
    expect(
      screen.getByLabelText(/manuscript scene planning desk/i)
    ).toHaveTextContent(
      'Previous laneArrivalChapter 1 currently rests on this sceneUse deskCurrent lanescene 2advance Chapter 1 with the next visible turnUse deskAftermath laneArrivalcontinue consequence from ArrivalUse desk'
    );
    expect(
      screen.getByLabelText(/manuscript scene planning hud/i)
    ).toHaveTextContent('Prev ArrivalNow Chapter 1 2After Arrival');
    expect(
      screen.getByLabelText(/manuscript scene planning commands/i)
    ).toHaveTextContent('Open Chapter 1Reserve slotClose pressureAfter Arrival');
    expect(
      screen.getByLabelText(/manuscript scene launch bar/i)
    ).toHaveTextContent(
      'Chapter Chapter 1Title missingSummary lightBody pendingMode openingSeed on'
    );
    expect(
      screen.getByLabelText(/manuscript composition guide/i)
    ).toHaveTextContent(
      'Opening guideEstablish the lane for Chapter 1.Introduce Raid at Dawn in active motion.Leave one unresolved pressure for the next scene.'
    );
    expect(
      screen.getByLabelText(/manuscript composition beats/i)
    ).toHaveTextContent('Add opening imageAdd lane pressure');
    expect(
      screen.getByLabelText(/manuscript composition blocks/i)
    ).toHaveTextContent(
      'Chapter openingpendingAdd blockChapter thresholdpendingAdd blockPressure introducedpendingAdd block'
    );
    expect(
      screen.getByLabelText(/manuscript composition deck/i)
    ).toHaveTextContent(
      'Apply free sceneApply opening sceneApply continuation'
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent(
      'Mode openingChapter Chapter 1Anchor ArrivalEntity evt_001'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene sequence/i)).getAllByRole(
        'button',
        { name: /use sequence/i }
      )[0]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter lane: Chapter 1\nScene slot: 2\nOpening image:\nPressure introduced:\nWhy this slot matters now:'
    );
    expect(
      screen.getByLabelText(/manuscript scene launch bar/i)
    ).toHaveTextContent(
      'Chapter Chapter 1Title readySummary readyBody readyMode openingSeed on'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene storyboard/i)).getAllByRole(
        'button',
        { name: /use storyboard/i }
      )[1]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene planning strip/i)).getAllByRole(
        'button'
      )[1]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene planning desk/i)).getAllByRole(
        'button',
        { name: /use desk/i }
      )[1]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene planning hud/i)).getAllByRole(
        'button'
      )[1]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene planning commands/i)).getByRole(
        'button',
        { name: /after arrival/i }
      )
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn after Arrival'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Follow the visible consequence after Arrival.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene outline/i)).getAllByRole(
        'button',
        { name: /use outline/i }
      )[1]
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition queue/i)).getByRole(
        'button',
        { name: /queue chapter opener/i }
      )
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 with Raid at Dawn in motion.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter lane: Chapter 1\nScene slot: 2\nOpening image:\nPressure introduced:\nWhy this slot matters now:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition queue/i)).getByRole(
        'button',
        { name: /queue reserve slot/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode free');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 reserve scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Hold a flexible slot inside Chapter 1.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter lane: Chapter 1\nReserve slot: 2\nPressure frame:\nResponse beat:\nVisible change:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition queue/i)).getByRole(
        'button',
        { name: /queue closing beat/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode free');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 closing scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Close the active pressure inside Chapter 1.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter lane: Chapter 1\nClosing slot: 2\nPressure to close:\nVisible cost:\nWhat settles and what remains open:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene lanes/i)).getAllByRole(
        'button',
        { name: /use lane/i }
      )[3]
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode continuation');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn after Arrival'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Follow the visible consequence after Arrival.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPrior beat: Arrival\nCarry-over consequence:\nEscalation lane:\nNext scene slot after Arrival:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript chapter rhythm/i)).getByRole(
        'button',
        { name: /seed chapter beat/i }
      )
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Place Raid at Dawn into Chapter 1.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter lane: Chapter 1\nScene slot: 2\nOpening beat:\nPressure carried in:\nWhat changes by the end:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition deck/i)).getByRole(
        'button',
        { name: /apply free scene/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition beats/i)
    ).toHaveTextContent('Add pressure beatAdd visible change');
    expect(
      screen.getByLabelText(/manuscript composition blocks/i)
    ).toHaveTextContent(
      'Pressure framereadyAdd blockResponse beatreadyAdd blockVisible changereadyAdd block'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition beats/i)).getByRole(
        'button',
        { name: /add pressure beat/i }
      )
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition blocks/i)).getAllByRole(
        'button',
        { name: /add block/i }
      )[2]
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode free');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn scene'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Frame Raid at Dawn through one clear pressure.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPressure frame:\nResponse beat:\nVisible change:\nPressure beat for Raid at Dawn:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition deck/i)).getByRole(
        'button',
        { name: /apply opening scene/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition beats/i)
    ).toHaveTextContent('Add opening imageAdd lane pressure');
    expect(
      screen.getByLabelText(/manuscript composition blocks/i)
    ).toHaveTextContent(
      'Chapter openingreadyAdd blockChapter thresholdreadyAdd blockPressure introducedreadyAdd block'
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode opening');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Open Chapter 1 through Raid at Dawn.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nChapter opening:\nFirst impression of Chapter 1:\nPressure introduced:\nWhat the reader should carry forward:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition deck/i)).getByRole(
        'button',
        { name: /apply continuation/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition beats/i)
    ).toHaveTextContent('Add consequenceAdd irreversible turn');
    expect(
      screen.getByLabelText(/manuscript composition blocks/i)
    ).toHaveTextContent(
      'Prior beatreadyAdd blockCarry-over consequencereadyAdd blockIrreversible turnreadyAdd block'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition beats/i)).getByRole(
        'button',
        { name: /add consequence/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode continuation');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn after Arrival'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Continue the fallout after Arrival.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPrior beat: Arrival\nCarry-over consequence:\nEscalation:\nIrreversible turn:\nConsequence carried from Arrival:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript composition queue/i)).getByRole(
        'button',
        { name: /queue follow-up/i }
      )
    );
    expect(
      screen.getByLabelText(/manuscript composition ledger/i)
    ).toHaveTextContent('Mode continuation');
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn after Arrival'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Follow the visible consequence after Arrival.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPrior beat: Arrival\nCarry-over consequence:\nEscalation lane:\nNext scene slot after Arrival:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene scaffolds/i)).getByRole(
        'button',
        { name: /use scene scaffold/i }
      )
    );
    expect(screen.getByLabelText(/manuscript chapter rhythm/i)).toHaveTextContent(
      'Mode free'
    );
    expect(
      screen.getByLabelText(/manuscript composition guide/i)
    ).toHaveTextContent(
      'Free scene guidePick the clearest lens on Raid at Dawn.Stage one pressure, one response, and one visible change.Keep the summary line specific enough to reuse later.'
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn scene'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Follow the immediate fallout of Raid at Dawn.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nImmediate fallout:\nWho responds first:\nEscalation beat:\nWhat the world now knows:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene scaffolds/i)).getByRole(
        'button',
        { name: /continue linked thread/i }
      )
    );
    expect(screen.getByLabelText(/manuscript chapter rhythm/i)).toHaveTextContent(
      'Mode continuation'
    );
    expect(
      screen.getByLabelText(/manuscript composition guide/i)
    ).toHaveTextContent(
      'Continuation guideCarry one concrete consequence from the prior scene.Escalate Raid at Dawn instead of reintroducing it.End with an irreversible turn.'
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn aftermath'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Continue the thread after Arrival.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPrevious scene: Arrival\nCarry-over tension:\nWhat has changed since then:\nNext irreversible beat:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene continuity/i)).getByRole(
        'button',
        { name: /^arrival$/i }
      )
    );
    expect(screen.getByLabelText(/manuscript chapter rhythm/i)).toHaveTextContent(
      'Mode continuation'
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn after Arrival'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Continue the thread after Arrival.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nPrevious scene: Arrival\nChapter anchor: Chapter 1\nCarry-over tension:\nWhat changes now:\nNext irreversible beat:'
    );
    fireEvent.click(
      within(screen.getByLabelText(/create manuscript scene context/i)).getByRole(
        'button',
        { name: /seed scene draft/i }
      )
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Raid at Dawn scene'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Event seed');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Raid at Dawn\n\nEvent seed'
    );
    fireEvent.change(screen.getByLabelText(/create manuscript chapter title/i), {
      target: { value: 'Chapter 2' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: /create chapter/i })
    );
    await waitFor(() =>
      expect(createManuscriptChapter).toHaveBeenCalledWith(
        expect.any(String),
        { title: 'Chapter 2' }
      )
    );
    expect(screen.getByLabelText(/chapter 2 chapter/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/create manuscript scene chapter/i), {
      target: { value: 'msc_ch_002' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene title/i), {
      target: { value: 'Campfire Oath' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene summary/i), {
      target: { value: 'A vow by firelight' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene body/i), {
      target: { value: 'The camp gathers at dusk.' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create scene/i }));
    await waitFor(() =>
      expect(createManuscriptScene).toHaveBeenCalledWith(
        expect.any(String),
        {
          chapterId: 'msc_ch_002',
          title: 'Campfire Oath',
          summary: 'A vow by firelight',
          body: 'The camp gathers at dusk.',
          mentions: [
            {
              entityId: 'evt_001',
              label: 'Raid at Dawn',
              startOffset: 0,
              endOffset: 12
            }
          ]
        }
      )
    );
    expect(screen.getByLabelText(/manuscript scene launch receipt/i)).toHaveTextContent(
      'Launched Campfire OathChapter Chapter 2Mode continuationSeed on'
    );
    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene launch receipt/i)).getByRole(
        'button',
        { name: /focus launched scene/i }
      )
    );
    expect(
      within(screen.getByLabelText(/manuscript scene launch receipt/i)).getByRole(
        'button',
        { name: /focus launched scene/i }
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/chapter 2 chapter/i)).toHaveTextContent(
      'Recent launch Campfire Oath'
    );
    expect(screen.getByLabelText(/chapter 2 chapter/i)).toHaveTextContent(
      'Recent launchMode continuation'
    );
    expect(screen.getByLabelText(/campfire oath launch badge/i)).toHaveTextContent(
      'Recent launchMode continuation'
    );
    expect(screen.getByLabelText(/manuscript bridge/i)).toHaveTextContent(
      'Last launch Campfire OathChapter Chapter 2eventevt_001Visible at 1204Backlinks 1Raid at Dawn'
    );
    expect(screen.getByLabelText(/manuscript mention picker/i)).toHaveTextContent(
      'Alp Er TungaRaid at Dawn'
    );
    expect(
      screen.getByLabelText(/manuscript timeline context/i)
    ).toHaveTextContent('Alp Er Tunga @ 1200');
    expect(screen.getAllByText(/1 scenes/i).length).toBeGreaterThan(0);
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
    expect(screen.getByLabelText(/folio strip/i)).toHaveTextContent(
      'Folio DeskChapter 21 min read3 mentions'
    );

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
    fireEvent.click(
      within(screen.getByLabelText(/detail draft assists/i)).getByRole('button', {
        name: /append scene cues/i
      })
    );
    expect(
      (screen.getByLabelText(/^Body$/i) as HTMLTextAreaElement).value
    ).toContain('Character appears in scene context:\n- Arrival');

    await act(async () => {
      fireEvent.click(
        within(screen.getByLabelText(/detail backlinks/i)).getByRole('button', {
          name: /^arrival$/i
        })
      );
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
  }, 20000);

  it('surfaces scene handoff commands and queues next slot from selected scene', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');

    const deferredFlags = screen.getByLabelText(/deferred lens flags/i);
    fireEvent.click(
      within(deferredFlags).getAllByRole('button', { name: /^Off$/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));

    await screen.findByLabelText(/manuscript lens/i);

    expect(screen.getByLabelText(/manuscript scene handoff commands/i)).toHaveTextContent(
      'Open Chapter 1 from ArrivalNext slot 2Close Chapter 1 pressureFollow-up after Arrival'
    );
    expect(screen.getByLabelText(/manuscript scene launch rhythm/i)).toHaveTextContent(
      'Opening handoff Re-open Chapter 1 from Arrival.Next slot Carry Arrival into slot 2.Closing handoff Settle the pressure after Arrival.Follow-up Continue directly after Arrival.'
    );
    expect(screen.getByLabelText(/manuscript scene edit assist/i)).toHaveTextContent(
      'Title cueChapter 1 after Arrival slot 2Summary cueHandoff: re-open Chapter 1, carry Arrival into slot 2, then settle the pressure.Body cuesScene handoff cues: - Opening: re-open Chapter 1 from Arrival.'
    );

    const sceneHandoffSection = screen.getByLabelText(/^manuscript scene handoff$/i);
    fireEvent.click(
      within(sceneHandoffSection).getByRole('button', {
        name: /append all edit cues/i
      })
    );
    expect(screen.getByLabelText(/manuscript title/i)).toHaveValue(
      'Arrival Chapter 1 after Arrival slot 2'
    );
    expect(screen.getByLabelText(/manuscript summary/i)).toHaveValue(
      'Arrival summary Handoff: re-open Chapter 1, carry Arrival into slot 2, then settle the pressure.'
    );
    expect(screen.getByLabelText(/manuscript body/i)).toHaveValue(
      'Arrival body\n\nScene handoff cues:\n- Opening: re-open Chapter 1 from Arrival.\n- Next slot: carry Arrival into slot 2.\n- Closing: settle the pressure after Arrival.\n- Follow-up: continue directly after Arrival.'
    );
    fireEvent.click(
      within(sceneHandoffSection).getByRole('button', {
        name: /append handoff cues/i
      })
    );
    expect(screen.getByLabelText(/manuscript body/i)).toHaveValue(
      'Arrival body\n\nScene handoff cues:\n- Opening: re-open Chapter 1 from Arrival.\n- Next slot: carry Arrival into slot 2.\n- Closing: settle the pressure after Arrival.\n- Follow-up: continue directly after Arrival.\n\nScene handoff cues:\n- Opening: re-open Chapter 1 from Arrival.\n- Next slot: carry Arrival into slot 2.\n- Closing: settle the pressure after Arrival.\n- Follow-up: continue directly after Arrival.'
    );
    fireEvent.click(
      within(sceneHandoffSection).getByRole('button', {
        name: /append summary cue/i
      })
    );
    expect(screen.getByLabelText(/manuscript summary/i)).toHaveValue(
      'Arrival summary Handoff: re-open Chapter 1, carry Arrival into slot 2, then settle the pressure. Handoff: re-open Chapter 1, carry Arrival into slot 2, then settle the pressure.'
    );
    fireEvent.click(
      within(sceneHandoffSection).getByRole('button', {
        name: /append title cue/i
      })
    );
    expect(screen.getByLabelText(/manuscript title/i)).toHaveValue(
      'Arrival Chapter 1 after Arrival slot 2 Chapter 1 after Arrival slot 2'
    );
    fireEvent.click(
      within(sceneHandoffSection).getByRole('button', {
        name: /queue next slot from scene/i
      })
    );

    expect(screen.getByLabelText(/manuscript chapter rhythm/i)).toHaveTextContent(
      'Mode continuation'
    );
    expect(screen.getByLabelText(/create manuscript scene title/i)).toHaveValue(
      'Chapter 1 scene 2'
    );
    expect(
      screen.getByLabelText(/create manuscript scene summary/i)
    ).toHaveValue('Carry Arrival into Chapter 1 slot 2.');
    expect(screen.getByLabelText(/create manuscript scene body/i)).toHaveValue(
      'Alp Er Tunga\n\nPrevious scene: Arrival\nChapter lane: Chapter 1\nNext slot: 2\nCarry-over pressure:\nNew turn in this slot:\nWhat the reader takes forward:'
    );
  });

  it('drafts follow-up manuscript scenes from detail backlink continuity', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');
    fireEvent.click(screen.getByText('Raid at Dawn'));

    const deferredFlags = screen.getByLabelText(/deferred lens flags/i);
    fireEvent.click(
      within(deferredFlags).getAllByRole('button', { name: /^Off$/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));

    await screen.findByLabelText(/manuscript lens/i);
    await act(async () => {
      fireEvent.click(
        within(screen.getByLabelText(/manuscript mentions/i)).getAllByRole(
          'button',
          { name: /alp er tunga \[char_001\]/i }
        )[0]
      );
      await Promise.resolve();
    });

    expect(screen.getByLabelText(/detail writing bridge/i)).toHaveTextContent(
      'Scene draftingDraft scene from entityDraft after Arrival'
    );
    fireEvent.click(
      within(screen.getByLabelText(/detail writing bridge/i)).getByRole(
        'button',
        { name: /draft after arrival/i }
      )
    );
    await waitFor(() =>
      expect(createManuscriptScene).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          chapterId: 'msc_ch_001',
          title: 'Alp Er Tunga after Arrival',
          summary: 'Continue the thread after Arrival.',
          body: 'Alp Er Tunga\n\nPrevious scene: Arrival\nChapter anchor: Chapter 1\nCarry-over tension:\nWhat changes now:\nNext irreversible beat:',
          mentions: [
            {
              entityId: 'char_001',
              label: 'Alp Er Tunga',
              startOffset: 0,
              endOffset: 12
            }
          ]
        })
      )
    );
    expect(screen.getByLabelText(/manuscript lens/i)).toBeInTheDocument();
  }, 15000);

  it('surfaces region focus deck inside selected map strip for visible map geography', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');
    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    fireEvent.click(
      within(screen.getByLabelText(/map overlays/i)).getByRole('button', {
        name: /raid at dawn/i
      })
    );

    const selectedStrip = await screen.findByLabelText(/map selected strip/i);
    expect(selectedStrip).toHaveTextContent('Visible at 1204');
    expect(selectedStrip).toHaveTextContent('event');
    expect(selectedStrip).toHaveTextContent('Raid at Dawn');
    expect(selectedStrip).toHaveTextContent('Open wiki');
    expect(selectedStrip).toHaveTextContent('Open timeline');
    expect(screen.getByLabelText(/map territory focus/i)).toHaveTextContent(
      'Event site: No host placeHost territory: No host region'
    );
    expect(screen.getByLabelText(/map region focus strip/i)).toHaveTextContent(
      'Year anchor: 1204Route root: Raid at Dawn'
    );
  });

  it('surfaces launch assist on launch receipt and replays launch cues into scene edit', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('demo-world');

    const deferredFlags = screen.getByLabelText(/deferred lens flags/i);
    fireEvent.click(
      within(deferredFlags).getAllByRole('button', { name: /^Off$/i })[0]
    );
    fireEvent.click(screen.getByRole('button', { name: /^Manuscript$/i }));

    await screen.findByLabelText(/manuscript lens/i);

    fireEvent.change(screen.getByLabelText(/create manuscript chapter title/i), {
      target: { value: 'Chapter 2' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create chapter/i }));
    await waitFor(() =>
      expect(createManuscriptChapter).toHaveBeenCalledWith(
        expect.any(String),
        { title: 'Chapter 2' }
      )
    );

    fireEvent.change(screen.getByLabelText(/create manuscript scene chapter/i), {
      target: { value: 'msc_ch_002' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene title/i), {
      target: { value: 'Campfire Oath' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene summary/i), {
      target: { value: 'A vow by firelight' }
    });
    fireEvent.change(screen.getByLabelText(/create manuscript scene body/i), {
      target: { value: 'The camp gathers at dusk.' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create scene/i }));

    await waitFor(() =>
      expect(screen.getByLabelText(/manuscript scene launch receipt/i)).toHaveTextContent(
        'Launched Campfire Oath'
      )
    );
    expect(screen.getByLabelText(/manuscript scene launch receipt/i)).toHaveTextContent(
      'Chapter Chapter 2'
    );
    expect(screen.getByLabelText(/manuscript scene launch receipt/i)).toHaveTextContent(
      'Mode free'
    );
    expect(screen.getByLabelText(/manuscript scene launch receipt/i)).toHaveTextContent(
      'Seed on'
    );
    expect(screen.getByLabelText(/manuscript scene launch assist/i)).toHaveTextContent(
      'Launch titleLaunch Campfire OathLaunch summaryLaunch replay: Chapter 2 / free.Launch bodyTitle Campfire Oath / Seed on'
    );

    fireEvent.click(
      within(screen.getByLabelText(/manuscript scene launch receipt/i)).getByRole(
        'button',
        { name: /append launch edit cues/i }
      )
    );

    expect(screen.getByLabelText(/manuscript title/i)).toHaveValue(
      'Arrival Launch Campfire Oath'
    );
    expect(screen.getByLabelText(/manuscript summary/i)).toHaveValue(
      'Arrival summary Launch replay: Chapter 2 / free.'
    );
    expect(screen.getByLabelText(/manuscript body/i)).toHaveValue(
      'Arrival body\n\nLaunch replay cues:\n- Title: Campfire Oath\n- Chapter: Chapter 2\n- Mode: free\n- Seed: on'
    );
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
      '2 jobs2 artifacts'
    );
    expect(screen.getByLabelText(/artifact spotlight/i)).toHaveTextContent(
      'dossier.pdfdossier.pdfpdf_dossierdone'
    );
    expect(
      screen.getByLabelText(/manuscript export metadata/i)
    ).toHaveTextContent('manuscript.pdfmanuscript.pdfqueued0 files');
    expect(screen.getByLabelText(/^export package$/i)).toHaveTextContent(
      'Dossier bundleC:/Users/Test/Documents/WorldAltar/export2 jobs3 files'
    );
    expect(screen.getByLabelText(/delivery receipt/i)).toHaveTextContent(
      'Delivery receiptdossier.pdfC:/Users/Test/Documents/WorldAltar/exportpdf_dossierdone2 artifacts'
    );
    expect(screen.getByLabelText(/delivery lanes/i)).toHaveTextContent(
      'Delivery lanes2 lanesDossier lanedossier.pdfLatest done9No prior deliveryManuscript lanemanuscript.pdfLatest queued10No prior delivery'
    );
    expect(screen.getByLabelText(/delivery pulse/i)).toHaveTextContent(
      'Delivery pulse2 tracked jobsvisible deliveries still movingDone 1Queued 1Running 0Failed 0'
    );
    expect(screen.getByLabelText(/recent activity/i)).toHaveTextContent(
      'Recent activity2 eventsdossier.pdfpdf_dossierdone9manuscript.pdfmanuscript_pdfqueued10'
    );
    expect(screen.getByLabelText(/queue intent/i)).toHaveTextContent(
      'Queue intentQueue manuscript companionlatest visible lane is pdf_dossiermanuscript_pdfdoneQueue suggested lane'
    );
    expect(screen.getByLabelText(/delivery digest/i)).toHaveTextContent(
      'Delivery digestdossier.pdf / 2 tracked jobsqueue manuscript companion while visible deliveries still movingpdf_dossier doneQueued 1 Failed 0manuscript_pdf'
    );
    expect(screen.getByLabelText(/delivery board/i)).toHaveTextContent(
      'Delivery board2 lanes / 2 eventsdossier.pdf is the latest visible movementDossier lanedossier.pdfdone'
    );
    expect(screen.getByLabelText(/publishing strip/i)).toHaveTextContent(
      'Publishing stripdossier.pdf publishing2 visible jobs staged for deliveryC:/Users/Test/Documents/WorldAltar/export2 artifacts1 queued'
    );
    expect(screen.getByLabelText(/artifact ledger/i)).toHaveTextContent(
      'Artifact ledger1 roots / 2 artifact filesPDF 1 / Other 1C:/Users/Test/Documents/WorldAltar/export2 artifactsPDF 1'
    );
    expect(screen.getByLabelText(/release cadence/i)).toHaveTextContent(
      'Release cadence2 visible jobs / 1 rootsvisible release cadence still in motionDone 1Queued 1Roots 1'
    );
    expect(screen.getByLabelText(/release digest/i)).toHaveTextContent(
      'Release digestdossier.pdf publishing / 2 visible jobs / 1 rootsmanuscript_pdf with 1 roots / 2 artifact files1 queued2 artifactsRoots 1'
    );
    expect(screen.getByLabelText(/release desk/i)).toHaveTextContent(
      'Release deskQueue manuscript companion / dossier.pdf publishing1 roots / 2 artifact files ready for focused reviewmanuscript_pdf1 queuedC:/Users/Test/Documents/WorldAltar/export'
    );
    expect(screen.getByLabelText(/shipment note/i)).toHaveTextContent(
      'Shipment notedossier.pdf ready for shipmentqueue manuscript companion against 1 roots / 2 artifact filesdossier.pdfmanuscript_pdf2 artifacts'
    );
    expect(screen.getByLabelText(/curated outputs/i)).toHaveTextContent(
      'Curated outputs2 lanesDossier sheetdossier.pdfdone2 filesManuscript PDFmanuscript.pdfqueued0 files'
    );
    expect(screen.getByLabelText(/bundle readiness/i)).toHaveTextContent(
      '3/3 lanesReusable world bundle closeDossier readyManuscript readyBundle ready'
    );
    expect(screen.getByLabelText(/reference sheets/i)).toHaveTextContent(
      'Reference sheets2 sheetsWorld dossierdossier.pdfwiki/mapdoneScene manuscriptmanuscript.pdfmanuscriptqueued'
    );
    expect(screen.getByLabelText(/export manifest/i)).toHaveTextContent(
      'Asset manifestC:/Users/Test/Documents/WorldAltar/export2 artifact filesPDF 1Other 1'
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
      'Target roots1 rootsC:/Users/Test/Documents/WorldAltar/exportmanuscript.pdf2 jobs2 artifacts'
    );
    expect(screen.getByLabelText(/bundle contents/i)).toHaveTextContent(
      'Bundle contents2 filesdossier.pdfC:/Users/Test/Documents/WorldAltar/exportDossierasset-manifest.jsonC:/Users/Test/Documents/WorldAltar/exportDossier'
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
      'Packages1 rootsDossier bundleC:/Users/Test/Documents/WorldAltar/export2 jobs3 files'
    );
    expect(screen.getByLabelText(/artifacts job_001/i)).toHaveTextContent(
      'Artifactdossier.pdfArtifactasset-manifest.json'
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
      'Latest artifactmanuscript.pdfmanuscript.pdfmanuscript_pdfqueued'
    );
    expect(
      screen.getByLabelText(/manuscript export metadata/i)
    ).toHaveTextContent('manuscript.pdfmanuscript.pdfqueued0 files');
    expect(screen.getByLabelText(/^export package$/i)).toHaveTextContent(
      'Manuscript bundleC:/Users/Test/Documents/WorldAltar/export1 jobs1 files'
    );
    expect(screen.getByLabelText(/delivery receipt/i)).toHaveTextContent(
      'Delivery receiptmanuscript.pdfC:/Users/Test/Documents/WorldAltar/exportmanuscript_pdfqueued0 artifacts'
    );
    expect(screen.getByLabelText(/delivery lanes/i)).toHaveTextContent(
      'Delivery lanes1 lanesManuscript lanemanuscript.pdfLatest queued10No prior delivery'
    );
    expect(screen.getByLabelText(/delivery pulse/i)).toHaveTextContent(
      'Delivery pulse1 tracked jobsvisible deliveries still movingDone 0Queued 1Running 0Failed 0'
    );
    expect(screen.getByLabelText(/recent activity/i)).toHaveTextContent(
      'Recent activity1 eventsmanuscript.pdfmanuscript_pdfqueued10'
    );
    expect(screen.getByLabelText(/queue intent/i)).toHaveTextContent(
      'Queue intentRefresh manuscript lanelatest manuscript_pdf is queuedmanuscript_pdfqueuedQueue suggested lane'
    );
    expect(screen.getByLabelText(/delivery digest/i)).toHaveTextContent(
      'Delivery digestmanuscript.pdf / 1 tracked jobsrefresh manuscript lane while visible deliveries still movingmanuscript_pdf queuedQueued 1 Failed 0manuscript_pdf'
    );
    expect(screen.getByLabelText(/delivery board/i)).toHaveTextContent(
      'Delivery board1 lanes / 1 eventsmanuscript.pdf is the latest visible movementManuscript lanemanuscript.pdfqueued'
    );
    expect(screen.getByLabelText(/publishing strip/i)).toHaveTextContent(
      'Publishing stripmanuscript.pdf publishing1 visible jobs staged for deliveryC:/Users/Test/Documents/WorldAltar/export0 artifacts1 queued'
    );
    expect(screen.getByLabelText(/artifact ledger/i)).toHaveTextContent(
      'Artifact ledger1 roots / No artifact files yetPDF 0 / Other 0C:/Users/Test/Documents/WorldAltar/export0 artifactsPDF 0'
    );
    expect(screen.getByLabelText(/release cadence/i)).toHaveTextContent(
      'Release cadence1 visible jobs / 1 rootsvisible release cadence still in motionDone 0Queued 1Roots 1'
    );
    expect(screen.getByLabelText(/release digest/i)).toHaveTextContent(
      'Release digestmanuscript.pdf publishing / 1 visible jobs / 1 rootsmanuscript_pdf with 1 roots / No artifact files yet1 queued0 artifactsRoots 1'
    );
    expect(screen.getByLabelText(/release desk/i)).toHaveTextContent(
      'Release deskRefresh manuscript lane / manuscript.pdf publishing1 roots / No artifact files yet ready for focused reviewmanuscript_pdf1 queuedC:/Users/Test/Documents/WorldAltar/export'
    );
    expect(screen.getByLabelText(/shipment note/i)).toHaveTextContent(
      'Shipment notemanuscript.pdf ready for shipmentrefresh manuscript lane against 1 roots / No artifact files yetmanuscript.pdfmanuscript_pdf0 artifacts'
    );
    fireEvent.click(
      within(screen.getByLabelText(/queue intent/i)).getByRole('button', {
        name: /queue suggested lane/i
      })
    );
    await waitFor(() =>
      expect(queueExport).toHaveBeenCalledWith(expect.any(String), {
        kind: 'manuscript_pdf'
      })
    );
    expect(screen.getByLabelText(/curated outputs/i)).toHaveTextContent(
      'Curated outputs1 lanesManuscript PDFmanuscript_pdf.pdfqueued0 files'
    );
    expect(screen.getByLabelText(/bundle readiness/i)).toHaveTextContent(
      '1/3 lanesBundle still partialDossier pendingManuscript readyBundle pending'
    );
    expect(screen.getByLabelText(/reference sheets/i)).toHaveTextContent(
      'Reference sheets1 sheetsScene manuscriptmanuscript_pdf.pdfmanuscriptqueued'
    );
    expect(screen.getByLabelText(/export manifest/i)).toHaveTextContent(
      'Asset manifestC:/Users/Test/Documents/WorldAltar/exportNo artifact files yetPDF 0Other 0'
    );
    expect(screen.getByLabelText(/export history/i)).toHaveTextContent(
      'Export history1 lanesManuscript lane10queued2 runs'
    );
    expect(screen.getByLabelText(/delivery checklist/i)).toHaveTextContent(
      'Delivery checklist4 checksQueuequeued2 jobs trackedDossier lanependingno dossier jobManuscript lanereadybook path presentArtifactspendingartifact files missing'
    );
    expect(screen.getByLabelText(/format readiness/i)).toHaveTextContent(
      'Format readiness2 formatsPDFreadyqueue onlyEPUBlaterfuture richer format'
    );
    expect(screen.getByLabelText(/target roots/i)).toHaveTextContent(
      'Target roots1 rootsC:/Users/Test/Documents/WorldAltar/exportmanuscript.pdf2 jobs0 artifacts'
    );
    expect(screen.queryByLabelText(/bundle contents/i)).not.toBeInTheDocument();

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
