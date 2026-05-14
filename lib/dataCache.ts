/**
 * Simple in-memory cache for API responses.
 * Prevents redundant network calls on repeated page visits within the same session.
 * Cache is invalidated after `TTL_MS` or on demand (e.g., after saving a log).
 */

const TTL_MS = 2 * 60 * 1000; // 2 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const store = new Map<string, CacheEntry<any>>();
const promiseStore = new Map<string, Promise<any>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function cacheSet<T>(key: string, data: T): void {
  store.set(key, { data, timestamp: Date.now() });
}

export function cacheInvalidate(...keys: string[]): void {
  if (keys.length === 0) {
    store.clear();
    promiseStore.clear();
  } else {
    keys.forEach(k => {
      store.delete(k);
      promiseStore.delete(k);
    });
  }
}

/**
 * Ensures only ONE network request is made even if multiple components
 * request the exact same data simultaneously on mount.
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  forceRefresh = false
): Promise<T> {
  if (!forceRefresh) {
    const cached = cacheGet<T>(key);
    if (cached) return cached;
    
    // If a request is already in flight, wait for it instead of making a new one
    if (promiseStore.has(key)) {
      return promiseStore.get(key) as Promise<T>;
    }
  }

  const promise = fetcher().then(
    data => {
      cacheSet(key, data);
      promiseStore.delete(key);
      return data;
    },
    err => {
      promiseStore.delete(key);
      throw err;
    }
  );

  promiseStore.set(key, promise);
  return promise;
}

export const CACHE_KEYS = {
  TEACHER_DASHBOARD: 'teacher_dashboard',
  TEACHER_CLASSES: 'teacher_classes',
} as const;
