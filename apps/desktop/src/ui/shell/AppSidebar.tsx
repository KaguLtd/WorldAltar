import type { ReactNode } from 'react';

type AppSidebarProps = {
  children: ReactNode;
};

export function AppSidebar({ children }: AppSidebarProps) {
  return <>{children}</>;
}
