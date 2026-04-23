import type { FormEvent } from 'react';
import type { BootstrapStatus } from '../modules/projects/api';
import type { ActiveLens } from '../App';

type LensRailProps = {
  lensItems: readonly ActiveLens[];
  activeLens: ActiveLens;
  onLensChange: (lens: ActiveLens) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  title: string;
  setTitle: (value: string) => void;
  busy: boolean;
  status: BootstrapStatus | null;
};

export function LensRail({
  lensItems,
  activeLens,
  onLensChange,
  onSubmit,
  title,
  setTitle,
  busy,
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
        </form>
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
