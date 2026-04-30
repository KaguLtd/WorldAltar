type WorkspaceChromeProps = {
  workspaceCurationRail: string[];
  workspaceDeskAtlas: string[];
  workspaceEditorial: string[];
  workspaceFolio: string[];
  workspaceMood: string[];
  workspaceSessionStrip: string[];
  workspaceShellDigest: string[];
  workspaceSpotlight: string[];
  workspaceStateBoard: string[];
};

function renderStrip(
  entries: string[],
  className: string,
  ariaLabel: string
) {
  return (
    <div className={className} aria-label={ariaLabel}>
      {entries.map((entry) => (
        <span key={entry} className="command-chip shell-ribbon-chip">
          {entry}
        </span>
      ))}
    </div>
  );
}

export function WorkspaceChrome({
  workspaceCurationRail,
  workspaceDeskAtlas,
  workspaceEditorial,
  workspaceFolio,
  workspaceMood,
  workspaceSessionStrip,
  workspaceShellDigest,
  workspaceSpotlight,
  workspaceStateBoard
}: WorkspaceChromeProps) {
  return (
    <>
      {renderStrip(
        workspaceFolio,
        'workspace-curation-strip',
        'workspace curation strip'
      )}
      <div
        className="workspace-spotlight-strip"
        aria-label="workspace spotlight strip"
      >
        <span className="command-chip">{workspaceSpotlight[0]}</span>
        <strong>{workspaceSpotlight[1]}</strong>
        <span>{workspaceSpotlight[2]}</span>
        <span className="scene-card-meta">
          <span>{workspaceSpotlight[3]}</span>
        </span>
      </div>
      {renderStrip(
        workspaceCurationRail,
        'workspace-curation-rail',
        'workspace curation rail'
      )}
      {renderStrip(
        workspaceMood,
        'workspace-mood-strip',
        'workspace mood strip'
      )}
      {renderStrip(
        workspaceEditorial,
        'workspace-editorial-strip',
        'workspace editorial strip'
      )}
      {renderStrip(
        workspaceStateBoard,
        'workspace-state-board',
        'workspace state board'
      )}
      {renderStrip(
        workspaceShellDigest,
        'workspace-shell-digest',
        'workspace shell digest'
      )}
      {renderStrip(
        workspaceSessionStrip,
        'workspace-session-strip',
        'workspace session strip'
      )}
      {renderStrip(
        workspaceDeskAtlas,
        'workspace-desk-atlas',
        'workspace desk atlas'
      )}
    </>
  );
}
