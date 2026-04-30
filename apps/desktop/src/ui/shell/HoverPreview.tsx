import { resolveEntityVisual } from '../../modules/assets/contracts';
import type { EntityRecord, EntityType } from '../../modules/entity-model/types';

type HoverPreviewProps = {
  entity: EntityRecord | null;
  onOpenMap: () => void;
  onOpenTimeline: () => void;
  onOpenWiki: () => void;
  typeLabels: Record<EntityType, string>;
  visible: boolean;
};

export function HoverPreview({
  entity,
  onOpenMap,
  onOpenTimeline,
  onOpenWiki,
  typeLabels,
  visible
}: HoverPreviewProps) {
  if (!visible || !entity) {
    return null;
  }

  return (
    <aside className="hover-preview" aria-label="hover preview">
      <img
        alt={`${entity.common.title} preview`}
        className="hover-preview-image"
        src={resolveEntityVisual(entity).coverPath}
      />
      <div className="hover-preview-body">
        <span className={`type-badge type-${entity.type}`}>
          {typeLabels[entity.type]}
        </span>
        <strong>{entity.common.title}</strong>
        <span>{entity.common.summary || 'No summary'}</span>
        <div className="hover-preview-strip" aria-label="hover preview strip">
          <span className="command-chip">{entity.common.id}</span>
          <span className="command-chip">{entity.common.startYear ?? 'open'}</span>
          <span className="command-chip">
            {entity.common.coverImagePath ? 'Custom cover' : 'Fallback cover'}
          </span>
        </div>
        <div className="hover-actions">
          <button className="button ghost-button" onClick={onOpenWiki} type="button">
            Open wiki
          </button>
          <button
            className="button ghost-button"
            onClick={onOpenTimeline}
            type="button"
          >
            Open timeline
          </button>
          <button className="button ghost-button" onClick={onOpenMap} type="button">
            Open map
          </button>
        </div>
      </div>
    </aside>
  );
}
