import { useMemo, useState } from 'react';
import type { EntityRecord, EntityType } from '../modules/entity-model/types';

const CANVAS_VIEWS = ['relation_board', 'family_tree', 'event_chain'] as const;

type CanvasView = (typeof CANVAS_VIEWS)[number];

type CanvasLensProps = {
  records: EntityRecord[];
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string) => void;
  typeLabels: Record<EntityType, string>;
  year: number;
};

export function CanvasLens({
  records,
  selectedEntityId,
  setSelectedEntityId,
  typeLabels,
  year
}: CanvasLensProps) {
  const [view, setView] = useState<CanvasView>('relation_board');
  const selectedRecord =
    records.find((record) => record.common.id === selectedEntityId) ?? null;
  const board = useMemo(
    () => buildCanvasBoard(records, selectedEntityId, view),
    [records, selectedEntityId, view]
  );

  return (
    <section className="lens-frame" aria-label="canvas lens">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">Canvas</p>
          <p className="copy">Deferred lens. Local derived board only.</p>
        </div>
        <div className="mode-strip" aria-label="canvas views">
          {CANVAS_VIEWS.map((item) => (
            <button
              key={item}
              className={`mode-chip${view === item ? ' is-active' : ''}`}
              onClick={() => setView(item)}
              type="button"
            >
              {labelCanvasView(item)}
            </button>
          ))}
          <span className="command-chip">Year {year}</span>
        </div>
      </div>

      {selectedRecord ? (
        <article className="timeline-spotlight" aria-label="canvas spotlight">
          <div className="timeline-spotlight-copy">
            <p className="eyebrow">Canvas Focus</p>
            <strong>{selectedRecord.common.title}</strong>
            <span>{typeLabels[selectedRecord.type]}</span>
          </div>
          <div className="timeline-summary">
            <span className="command-chip">{selectedRecord.common.id}</span>
            <span className="command-chip">{records.length} visible nodes</span>
            <span className="command-chip">{board.edges.length} links</span>
          </div>
        </article>
      ) : null}

      <section className="canvas-board" aria-label="canvas board">
        <div className="canvas-relations" aria-label="canvas links">
          {board.edges.length ? (
            board.edges.map((edge) => (
              <div key={edge.id} className="relation-row">
                <span>{edge.from}</span>
                <strong>{edge.label}</strong>
                <span>{edge.to}</span>
              </div>
            ))
          ) : (
            <div className="relation-row">
              <span>No links</span>
              <strong>{labelCanvasView(view)}</strong>
              <span>Visible set</span>
            </div>
          )}
        </div>

        <div className="card-grid">
          {records.length ? (
            board.nodes.map((record, index) => (
              <button
                key={record.id}
                className={`wiki-card${record.id === selectedEntityId ? ' is-active' : ''}`}
                onClick={() => setSelectedEntityId(record.id)}
                style={{
                  transform: `translate(${(index % 3) * 6}px, ${Math.floor(index / 3) * 4}px)`
                }}
                type="button"
              >
                <span className={`type-badge type-${record.type}`}>
                  {typeLabels[record.type]}
                </span>
                <strong>{record.title}</strong>
                <span>{record.summary || 'No summary'}</span>
                <span className="scene-card-meta">
                  <span>{record.type}</span>
                  <span>{record.id}</span>
                </span>
              </button>
            ))
          ) : (
            <section className="empty-stage lens-empty">
              <p className="eyebrow">Canvas</p>
              <h2>No visible nodes.</h2>
              <p className="copy">Year filter same visible set kullanir.</p>
            </section>
          )}
        </div>
      </section>
    </section>
  );
}

function labelCanvasView(view: CanvasView) {
  if (view === 'family_tree') {
    return 'Family';
  }

  if (view === 'event_chain') {
    return 'Chain';
  }

  return 'Relations';
}

function buildCanvasBoard(
  records: EntityRecord[],
  selectedEntityId: string | null,
  view: CanvasView
) {
  const nodes = records.map((record) => ({
    id: record.common.id,
    title: record.common.title,
    summary: record.common.summary,
    type: record.type
  }));
  const focus =
    records.find((record) => record.common.id === selectedEntityId) ??
    records[0];

  if (!focus) {
    return {
      nodes,
      edges: [] as Array<{
        id: string;
        from: string;
        to: string;
        label: string;
      }>
    };
  }

  const peers = records
    .filter((record) => record.common.id !== focus.common.id)
    .slice(0, 3);
  const edges = peers.map((peer, index) => ({
    id: `${view}_${focus.common.id}_${peer.common.id}`,
    from: focus.common.title,
    to: peer.common.title,
    label: edgeLabel(view, focus.type, peer.type, index)
  }));

  return { nodes, edges };
}

function edgeLabel(
  view: CanvasView,
  focusType: EntityType,
  peerType: EntityType,
  index: number
) {
  if (view === 'family_tree') {
    return index === 0 ? 'blood line' : 'house tie';
  }

  if (view === 'event_chain') {
    return index === 0 ? 'triggers' : 'aftershock';
  }

  if (focusType === peerType) {
    return 'same kind';
  }

  return 'linked';
}
