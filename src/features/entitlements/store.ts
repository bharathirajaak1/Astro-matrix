/**
 * `useEntitlement()` - the single source of truth for whether remedies are
 * unlocked. Screens read `remediesUnlocked` / `loading`; the paywall calls
 * `unlock()` / `restore()`. The interface stays stable if the unlock mechanism
 * changes from the current local one-time unlock to a real IAP provider.
 */
import { create } from 'zustand';

import { track } from '@/lib/analytics';

import {
  clearRemedyEntitlement,
  readRemedyEntitlement,
  writeRemedyEntitlement,
} from './entitlements';

interface EntitlementState {
  remediesUnlocked: boolean;
  /** True until the secure-store value has been read once. */
  loading: boolean;
  hydrate: () => Promise<void>;
  /** Run the (currently local) one-time unlock. Resolves to the new state. */
  unlock: () => Promise<boolean>;
  /** Re-check for an existing entitlement. Resolves to whether one was found. */
  restore: () => Promise<boolean>;
  /** Relock - used by the dev-only control in Settings to retest the paywall. */
  reset: () => Promise<void>;
}

export const useEntitlement = create<EntitlementState>((set) => ({
  remediesUnlocked: false,
  loading: true,

  hydrate: async () => {
    try {
      const entitlement = await readRemedyEntitlement();
      set({ remediesUnlocked: entitlement.unlocked, loading: false });
    } catch {
      set({ remediesUnlocked: false, loading: false });
    }
  },

  unlock: async () => {
    track('remedy_unlock_start');
    try {
      // A real IAP purchase call goes here; on success we persist the receipt.
      const entitlement = await writeRemedyEntitlement('purchase');
      set({ remediesUnlocked: entitlement.unlocked });
      track('remedy_unlock_success', { source: entitlement.source });
      return true;
    } catch {
      return false;
    }
  },

  restore: async () => {
    track('remedy_restore');
    const entitlement = await readRemedyEntitlement();
    set({ remediesUnlocked: entitlement.unlocked });
    return entitlement.unlocked;
  },

  reset: async () => {
    await clearRemedyEntitlement();
    set({ remediesUnlocked: false });
  },
}));
