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

describe('App', () => {
  beforeEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    vi.clearAllMocks();

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
        input: { id: string; title: string; summary: string; body: string }
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
        mentions: [
          {
            id: 'mm_001',
            nodeId: input.id,
            entityId: 'char_001',
            label: 'Alp Er Tunga',
            startOffset: 0,
            endOffset: 12
          }
        ]
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

  it('creates demo world on explicit path and keeps MVP shell behavior', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create demo world/i }));

    await screen.findByText('Alp Er Tunga');
    expect(createWorld).not.toHaveBeenCalled();
    expect(createDemoWorld).toHaveBeenCalledWith('Demo World');

    fireEvent.mouseEnter(
      screen
        .getAllByText('Alp Er Tunga')[0]
        .closest('button') as HTMLButtonElement
    );
    expect(screen.getByLabelText(/hover preview/i)).toBeInTheDocument();
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

    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    expect(screen.getByLabelText(/offline world map/i)).toBeInTheDocument();
    expect(on).toHaveBeenCalled();
    expect(
      screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)
    ).toBeInTheDocument();

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
  });

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

    vi.useFakeTimers();
    fireEvent.change(screen.getByLabelText(/manuscript body/i), {
      target: { value: 'Arrival body revised' }
    });

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(autosaveManuscriptScene).toHaveBeenCalledTimes(1);
    expect(screen.getAllByText(/Saved manuscript 8/i).length).toBeGreaterThan(
      0
    );

    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: /alp er tunga \[char_001\]/i })
      );
      await Promise.resolve();
    });
    expect(
      screen.getByRole('navigation', { name: /lens navigation/i })
    ).toHaveTextContent('Wiki');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /arrival/i }));
      await Promise.resolve();
    });
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

    fireEvent.click(screen.getByRole('button', { name: /^Export$/i }));
    await screen.findByLabelText(/export lens/i);
    expect(listExportJobs).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /queue dossier pdf/i }));
    await waitFor(() =>
      expect(queueExport).toHaveBeenCalledWith(expect.any(String), {
        kind: 'pdf_dossier'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: /^Relations$/i }));
    expect(screen.getByLabelText(/relations lens/i)).toBeInTheDocument();
  });
});
