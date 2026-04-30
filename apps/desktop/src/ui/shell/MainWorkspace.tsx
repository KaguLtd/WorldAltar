import type { ReactNode } from 'react';

type MainWorkspaceProps = {
  body: ReactNode;
  chrome: ReactNode;
  hoverPreview: ReactNode;
  lensCopy: string;
  lensName: string;
  toolbar: ReactNode;
};

export function MainWorkspace({
  body,
  chrome,
  hoverPreview,
  lensCopy,
  lensName,
  toolbar
}: MainWorkspaceProps) {
  return (
    <section className="workspace">
      <div className="workspace-head">
        <div>
          <p className="eyebrow">{lensName} Lens</p>
          <p className="copy">{lensCopy}</p>
        </div>
        {toolbar}
      </div>
      {chrome}
      {body}
      {hoverPreview}
    </section>
  );
}
