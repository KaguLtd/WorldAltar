import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { App } from './App';

const {
  addLayer,
  addSource,
  easeTo,
  getSource,
  on,
  remove,
  setData,
  createWorld,
  listEntities,
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
  createWorld: vi.fn(),
  listEntities: vi.fn(),
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
  createWorld
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
        typeof arg2 === 'function' ? arg2 : typeof arg3 === 'function' ? arg3 : undefined;

      if (event === 'load') {
        callback?.();
      }
    });

    createWorld.mockResolvedValue({
      slug: 'demo-world',
      databasePath: 'C:/Users/Test/Documents/WorldAltar/worlds/demo-world/worldaltar.db'
    });

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

    recoverAutosave.mockResolvedValue({ recoveredCount: 1, conflictedCount: 0, discardedCount: 0 });

    autosaveEntity.mockImplementation(async (_dbPath: string, input: { id: string; title: string; summary: string; body: string }) => ({
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
    }));
  });

  it('keeps only MVP lenses and one-shot startup recovery', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create world/i }));

    await screen.findByText('demo-world');

    expect(screen.getByRole('navigation', { name: /lens navigation/i })).toHaveTextContent(
      'WikiMapTimelineSearch'
    );
    expect(screen.queryByText('Manuscript')).not.toBeInTheDocument();
    expect(screen.queryByText('Canvas')).not.toBeInTheDocument();
    expect(screen.getByText(/Recovered 1 \/ Conflicts 0 \/ Dropped 0/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/year slider/i), {
      target: { value: '1205' }
    });

    await waitFor(() => expect(listEntities).toHaveBeenCalledTimes(2));
    expect(recoverAutosave).toHaveBeenCalledTimes(1);
  });

  it('keeps map, search, hover preview, and entity autosave on MVP shell', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create world/i }));

    await screen.findByText('Alp Er Tunga');

    fireEvent.mouseEnter(screen.getAllByText('Alp Er Tunga')[0].closest('button') as HTMLButtonElement);
    expect(screen.getByLabelText(/hover preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open map/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Search$/i }));
    fireEvent.change(screen.getByLabelText(/search query/i), {
      target: { value: 'alp' }
    });
    fireEvent.change(screen.getByLabelText(/entity type/i), {
      target: { value: 'character' }
    });
    await waitFor(() =>
      expect(searchEntities).toHaveBeenCalledWith(expect.any(String), 'alp', 1204, 'character')
    );

    fireEvent.click(screen.getByRole('button', { name: /^Map$/i }));
    expect(screen.getByLabelText(/offline world map/i)).toBeInTheDocument();
    expect(on).toHaveBeenCalled();
    expect(screen.getByText(/Focus: Alp Er Tunga \(char_001\)/i)).toBeInTheDocument();

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
});
