type AppTopbarProps = {
  activeLens: string;
  autosaveState: string;
  currentThemeLabel: string;
  dirty: boolean;
  isBootstrappingProject: boolean;
  onToggleTheme: () => void;
  optionalLensState: string;
  year: number;
};

export function AppTopbar({
  activeLens,
  autosaveState,
  currentThemeLabel,
  dirty,
  isBootstrappingProject,
  onToggleTheme,
  optionalLensState,
  year
}: AppTopbarProps) {
  return (
    <header className="command-bar">
      <div>
        <p className="eyebrow">WorldAltar</p>
        <h1>Dar MVP shell.</h1>
      </div>
      <div className="command-meta">
        <span className="command-chip">Lens {activeLens}</span>
        <button
          className="command-chip command-button"
          onClick={onToggleTheme}
          type="button"
        >
          Theme {currentThemeLabel}
        </button>
        <span className="command-chip">
          {isBootstrappingProject ? 'Startup sync' : 'Startup ready'}
        </span>
        <span className="command-chip">{optionalLensState}</span>
        <span className="command-chip">Year {year}</span>
        <span className={`command-chip${dirty ? ' is-dirty' : ''}`}>
          {dirty ? 'Dirty' : autosaveState}
        </span>
      </div>
    </header>
  );
}
