/**
 * Reads/writes the remedy entitlement in secure storage. This is the seam a real
 * IAP provider (RevenueCat, StoreKit) plugs into later: `unlock()` would run the
 * purchase and then call `writeRemedyEntitlement`, `restore()` would query the
 * store. The secure-store value is treated as a local cache of that truth.
 */
import { deleteSecure, getSecure, setSecure } from '@/lib/secureStore';

const REMEDIES_KEY = 'entitlement.remedies';

export type EntitlementSource = 'purchase' | 'restore' | 'promo';

export interface RemedyEntitlement {
  unlocked: boolean;
  unlockedAt: string | null;
  source: EntitlementSource | null;
}

const LOCKED: RemedyEntitlement = { unlocked: false, unlockedAt: null, source: null };

export async function readRemedyEntitlement(): Promise<RemedyEntitlement> {
  const stored = await getSecure<RemedyEntitlement>(REMEDIES_KEY);
  return stored?.unlocked ? stored : LOCKED;
}

export async function writeRemedyEntitlement(source: EntitlementSource): Promise<RemedyEntitlement> {
  const value: RemedyEntitlement = {
    unlocked: true,
    unlockedAt: new Date().toISOString(),
    source,
  };
  await setSecure(REMEDIES_KEY, value);
  return value;
}

export async function clearRemedyEntitlement(): Promise<void> {
  await deleteSecure(REMEDIES_KEY);
}
