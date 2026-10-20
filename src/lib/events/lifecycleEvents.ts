import { invalidateCache } from '@/lib/cache/clientCache';

/**
 * Global lifecycle event notifier.
 * Invalidates client-side dashboard caches and broadcasts real-time
 * lifecycle sync events across workspace tabs and components.
 */
export function notifyTaskLifecycleChange(companySlug?: string) {
  if (typeof window !== 'undefined') {
    invalidateCache('dashboard_');
    window.dispatchEvent(
      new CustomEvent('task_lifecycle_changed', {
        detail: { companySlug, timestamp: Date.now() },
      })
    );
  }
}
