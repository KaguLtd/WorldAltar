import type { FormEvent } from 'react';
import type { DeferredLensFlag } from '../modules/features';
import type { BootstrapStatus } from '../modules/projects/api';
import type { ActiveLens } from '../App';

type LensRailProps = {
  lensItems: readonly ActiveLens[];
  activeLens: ActiveLens;
  onDeferredLensToggle: (id: DeferredLensFlag['id']) => void;
  onLensChange: (lens: ActiveLens) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCreateDemoWorld: () => void;
  title: string;
  setTitle: (value: string) => void;
  busy: boolean;
  deferredLensFlags: DeferredLensFlag[];
  status: BootstrapStatus | null;
};

export function LensRail({
  lensItems,
  activeLens,
  onDeferredLensToggle,
  onLensChange,
  onSubmit,
  onCreateDemoWorld,
  title,
  setTitle,
  busy,
  deferredLensFlags,
  status
}: LensRailProps) {
  return (
    <aside className="nav-rail">
      <div className="rail-block">
        <p className="eyebrow">Lenses</p>
        <nav className="lens-nav" aria-label="lens navigation">
          {lensItems.map((item) => (
            <button
              key={item}
              aria-pressed={item === activeLens}
              className={`lens-link${item === activeLens ? ' is-active' : ''}`}
              onClick={() => onLensChange(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="rail-block">
        <p className="eyebrow">Bootstrap</p>
        <form className="form" onSubmit={onSubmit}>
          <label className="label" htmlFor="world-title">
            World title
          </label>
          <input
            id="world-title"
            className="input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="New world"
          />
          <button className="button" disabled={busy} type="submit">
            {busy ? 'Creating...' : 'Create world'}
          </button>
          <button
            className="button ghost-button"
            disabled={busy}
            onClick={onCreateDemoWorld}
            type="button"
          >
            {busy ? 'Creating...' : 'Create demo world'}
          </button>
        </form>
      </div>

      <div className="rail-block">
        <p className="eyebrow">Deferred</p>
        <ul className="meta-list" aria-label="deferred lens flags">
          {deferredLensFlags.map((flag) => (
            <li key={flag.id}>
              <span>{flag.label}</span>
              <button
                className="button ghost-button"
                onClick={() => onDeferredLensToggle(flag.id)}
                type="button"
              >
                {flag.enabled ? 'On' : 'Off'}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {status ? (
        <dl className="meta rail-block">
          <div>
            <dt>App root</dt>
            <dd>{status.appRoot}</dd>
          </div>
          <div>
            <dt>Worlds root</dt>
            <dd>{status.worldsRoot}</dd>
          </div>
        </dl>
      ) : null}
    </aside>
  );
}
