import type { ReactNode } from 'react';

type AppShellProps = {
  detailRail: ReactNode;
  error: string;
  gridFolio: ReactNode;
  sidebar: ReactNode;
  theme: string;
  topbar: ReactNode;
  workspace: ReactNode;
};

export function AppShell({
  detailRail,
  error,
  gridFolio,
  sidebar,
  theme,
  topbar,
  workspace
}: AppShellProps) {
  return (
    <main className="app-shell" data-theme={theme}>
      <section className="shell">
        {topbar}
        {gridFolio}
        <section className="shell-grid">
          {sidebar}
          {workspace}
          {detailRail}
        </section>
        {error ? <p className="error">{error}</p> : null}
      </section>
    </main>
  );
}
