import { Redirect } from 'expo-router';
import type { ReactNode } from 'react';

import { Screen } from '@/ui/components';

import { useEntitlement } from './store';

/**
 * The single gate for remedy *detail* routes. While the entitlement is loading
 * it shows a blank screen; if remedies are locked it redirects to the paywall;
 * otherwise it renders the screen. (The Remedies tab itself uses `LockOverlay`
 * rather than a redirect so the free teaser stays visible.)
 */
export function RemedyGate({ children }: { children: ReactNode }) {
  const remediesUnlocked = useEntitlement((s) => s.remediesUnlocked);
  const loading = useEntitlement((s) => s.loading);

  if (loading) {
    return <Screen scroll={false}>{null}</Screen>;
  }
  if (!remediesUnlocked) {
    return <Redirect href="/paywall" />;
  }
  return <>{children}</>;
}
