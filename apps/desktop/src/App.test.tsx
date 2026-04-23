import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { App } from './App';

const addLayer = vi.fn();
const addSource = vi.fn();
const easeTo = vi.fn();
const getSource = vi.fn();
const on = vi.fn();
const remove = vi.fn();
const setData = vi.fn();
const createWorld = vi.fn();
const listEntities = vi.fn();
const searchEntities = vi.fn();
const autosaveEntity = vi.fn();
const recoverAutosave = vi.fn();
const listManuscriptTree = vi.fn();
const getManuscriptScene = vi.fn();
const listManuscriptBacklinks = vi.fn();
const recoverManuscriptAutosave = vi.fn();
const autosaveManuscriptScene = vi.fn();
const createManuscriptChapter = vi.fn();
const createManuscriptScene = vi.fn();
const listExportJobs = vi.fn();
const queueExport = vi.fn();

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

vi.mock('./modules/manuscript/api', () => ({
  listManuscriptTree,
  getManuscriptScene,
  listManuscriptBacklinks,
  recoverManuscriptAutosave,
  autosaveManuscriptScene,
  createManuscriptChapter,
  createManuscriptScene
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
  it('renders book experience modes', async () => {
    vi.useFakeTimers();
    getSource.mockImplementation((id?: string) => {
      if (id === 'worldaltar-markers') {
        return { setData };
      }
      return undefined;
    });
    on.mockImplementation((event: string, arg2?: unknown) => {
      if (event === 'load') {
        const callback = typeof arg2 === 'function' ? arg2 : undefined;
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
          body: 'Hero seed',
          startYear: 1200,
          endYear: null,
          isOngoing: false,
          latitude: null,
          longitude: null,
          geometryRef: null,
          coverImagePath: null,
          thumbnailPath: null,
          createdAt: '1',
          updatedAt: '1'
        },
        fields: { culture: 'Turkic', birthYearLabel: null }
      }
    ]);
    searchEntities.mockResolvedValue([]);
    recoverAutosave.mockResolvedValue({ recoveredCount: 0, discardedCount: 0 });
    recoverManuscriptAutosave.mockResolvedValue({ recoveredCount: 0, discardedCount: 0 });
    listExportJobs.mockResolvedValue([]);
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
            slug: 'arrival-at-altin-ova',
            title: 'Arrival at Altin Ova',
            body: 'Alp Er Tunga enters Altin Ova. Wind rises. Camp waits.',
            summary: 'Seed manuscript scene',
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
        slug: 'arrival-at-altin-ova',
        title: 'Arrival at Altin Ova',
        body: 'Alp Er Tunga enters Altin Ova. Wind rises. Camp waits.',
        summary: 'Seed manuscript scene',
        position: 1,
        createdAt: '1',
        updatedAt: '1'
      },
      mentions: [
        {
          id: 'msm_001',
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
        sceneTitle: 'Arrival at Altin Ova',
        entityId: 'char_001',
        label: 'Alp Er Tunga'
      }
    ]);
    autosaveEntity.mockResolvedValue({
      type: 'character',
      common: {
        id: 'char_001',
        type: 'character',
        slug: 'alp-er-tunga',
        title: 'Alp Er Tunga',
        summary: 'Hero',
        body: 'Hero seed',
        startYear: 1200,
        endYear: null,
        isOngoing: false,
        latitude: null,
        longitude: null,
        geometryRef: null,
        coverImagePath: null,
        thumbnailPath: null,
        createdAt: '1',
        updatedAt: '6'
      },
      fields: { culture: 'Turkic', birthYearLabel: null }
    });
    autosaveManuscriptScene.mockImplementation((_dbPath: string, input: { id: string; title: string; summary: string; body: string; mentions: unknown[] }) =>
      Promise.resolve({
        node: {
          id: input.id,
          parentId: 'msc_ch_001',
          kind: 'scene',
          slug: 'arrival-at-altin-ova',
          title: input.title,
          body: input.body,
          summary: input.summary,
          position: 1,
          createdAt: '1',
          updatedAt: '7'
        },
        mentions: input.mentions
      })
    );
    createManuscriptChapter.mockResolvedValue({
      id: 'msc_ch_002',
      parentId: null,
      kind: 'chapter',
      slug: 'chapter-2',
      title: 'Chapter 2',
      body: '',
      summary: '',
      position: 2,
      createdAt: '1',
      updatedAt: '1'
    });
    createManuscriptScene.mockResolvedValue({
      node: {
        id: 'msc_sc_002',
        parentId: 'msc_ch_001',
        kind: 'scene',
        slug: 'new-scene',
        title: 'New Scene',
        body: '',
        summary: '',
        position: 2,
        createdAt: '1',
        updatedAt: '1'
      },
      mentions: []
    });
    queueExport.mockImplementation((_dbPath: string, request: { kind: 'manuscript_pdf' | 'pdf_dossier' }) =>
      Promise.resolve({
        id: `exp_${request.kind}`,
        kind: request.kind,
        status: 'done',
        targetPath: `C:/Users/Test/Documents/WorldAltar/worlds/demo-world/exports/${request.kind}.pdf`,
        artifactPaths: ['C:/Users/Test/Documents/WorldAltar/worlds/demo-world/exports/asset-manifest.json'],
        createdAt: '9'
      })
    );

    render(<App />);

    fireEvent.change(screen.getByLabelText(/world title/i), {
      target: { value: 'Demo World' }
    });
    fireEvent.click(screen.getByRole('button', { name: /create world/i }));

    fireEvent.click(await screen.findByRole('button', { name: /^manuscript$/i }));
    expect(await screen.findByDisplayValue(/Arrival at Altin Ova/i)).toBeInTheDocument();
    expect(recoverAutosave).toHaveBeenCalledTimes(1);
    expect(recoverManuscriptAutosave).toHaveBeenCalledTimes(1);
    expect(listManuscriptTree).toHaveBeenCalledTimes(1);
    expect(listExportJobs).toHaveBeenCalledTimes(1);
    expect(listEntities).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByLabelText(/year slider/i), {
      target: { value: '1205' }
    });
    await screen.findByText(/1205/i);
    expect(recoverAutosave).toHaveBeenCalledTimes(1);
    expect(recoverManuscriptAutosave).toHaveBeenCalledTimes(1);
    expect(listManuscriptTree).toHaveBeenCalledTimes(1);
    expect(listExportJobs).toHaveBeenCalledTimes(1);
    expect(listEntities).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole('button', { name: /^wiki$/i }));
    fireEvent.mouseEnter(screen.getByRole('button', { name: /alp er tunga hero/i }));
    expect(screen.getByRole('complementary', { name: /hover preview/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /open manuscript/i }));
    expect(screen.getByRole('button', { name: /^draft$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^timeline$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^bands$/i }));
    expect(screen.getByRole('region', { name: /timeline bands/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^chains$/i }));
    expect(screen.getByRole('region', { name: /timeline chains/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^canvas$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^event$/i }));
    expect(screen.getByRole('region', { name: /advanced canvas/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /arrival at altin ova/i }));
    expect(screen.getByRole('button', { name: /^manuscript$/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^map$/i }));
    expect(screen.getByRole('img', { name: /offline world map/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/map overlays/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/entity gallery panel/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^manuscript$/i }));
    expect(screen.getByLabelText(/premium manuscript editor/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^split$/i }));
    expect(screen.getByRole('region', { name: /book spread preview/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^book$/i }));
    expect(screen.getByText(/chapter break/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/print trim/i), {
      target: { value: 'Royal' }
    });
    fireEvent.click(screen.getByRole('button', { name: /^print$/i }));
    expect(screen.getByText(/print preview/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Chapter 1/i).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: /manuscript pdf/i }));
    fireEvent.click(screen.getByRole('button', { name: /dossier pdf/i }));
    expect(queueExport).toHaveBeenCalledTimes(2);
    expect(await screen.findByText(/manuscript_pdf/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/scene-editor-body/i), {
      target: { value: 'Alp Er Tunga enters Altin Ova. Wind rises. Camp waits. Scouts watch.' }
    });
    const sceneRow = screen.getByRole('button', { name: /chapter 1 \/ arrival at altin ova/i });
    fireEvent.dragStart(sceneRow);
    fireEvent.drop(sceneRow);
    await vi.advanceTimersByTimeAsync(5000);
    expect(autosaveManuscriptScene).toHaveBeenCalled();

    vi.useRealTimers();
  });
});
