/**
 * LocalStorage persistence with seed-version guard (mirrors the Lentix
 * SEED_VERSION_KEY pattern). Safe in non-browser contexts.
 */
const SEED_VERSION_KEY = "lentix.seedVersion";
const SEED_VERSION = "2026-06-19.1";

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readJSON<T>(key: string, fallback: T): T {
  if (!hasWindow()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (!hasWindow()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Returns true and rewrites the version stamp when the seed is stale. */
export function ensureSeedVersion(): boolean {
  if (!hasWindow()) return false;
  const current = window.localStorage.getItem(SEED_VERSION_KEY);
  if (current !== SEED_VERSION) {
    window.localStorage.setItem(SEED_VERSION_KEY, SEED_VERSION);
    return true;
  }
  return false;
}
