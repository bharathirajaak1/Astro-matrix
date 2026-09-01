/**
 * Analytics shim. The events the product cares about are enumerated here so call
 * sites stay typed; forwarding to a real provider is a later concern.
 */
export type AnalyticsEvent =
  | 'remedy_paywall_view'
  | 'remedy_unlock_start'
  | 'remedy_unlock_success'
  | 'remedy_restore';

const isDev = (globalThis as { __DEV__?: boolean }).__DEV__ ?? false;

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.log(`[analytics] ${event}`, props);
  }
  // TODO: forward to a real analytics provider once one is chosen.
}
