import type { ReactNode } from 'react';

type DetailRailProps = {
  children: ReactNode;
};

export function DetailRail({ children }: DetailRailProps) {
  return <aside className="context-panel">{children}</aside>;
}
