import type { ReactNode } from 'react';

type DeferredFeaturePanelProps = {
  active: boolean;
  children: ReactNode;
};

export function DeferredFeaturePanel({
  active,
  children
}: DeferredFeaturePanelProps) {
  if (!active) {
    return null;
  }

  return <>{children}</>;
}
