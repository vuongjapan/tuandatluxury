export const APP_VERSION = '3.0.1';

const APP_VERSION_KEY = 'app_version';
const ROLE_KEY = 'role';
const LAST_ROLE_KEY = 'last_role';
const AUTH_KEY_PATTERNS = [/^sb-.*-auth-token$/, /^supabase\.auth\./];
const STALE_CACHE_KEYS = ['rooms', 'pricing', 'services', 'gallery'];

type ResetOptions = {
  preserveAuth?: boolean;
  preserveVersion?: boolean;
  nextRole?: string;
};

function snapshotStorage(storage: Storage, patterns: RegExp[]) {
  const entries: Array<[string, string]> = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || !patterns.some((pattern) => pattern.test(key))) continue;

    const value = storage.getItem(key);
    if (value !== null) entries.push([key, value]);
  }

  return entries;
}

function restoreStorage(storage: Storage, entries: Array<[string, string]>) {
  entries.forEach(([key, value]) => storage.setItem(key, value));
}

export function clearStaleCacheData() {
  STALE_CACHE_KEYS.forEach((key) => localStorage.removeItem(key));
}

export function clearAppClientState(options: ResetOptions = {}) {
  const { preserveAuth = false, preserveVersion = true, nextRole } = options;
  const patterns: RegExp[] = [];

  if (preserveAuth) patterns.push(...AUTH_KEY_PATTERNS);
  if (preserveVersion) patterns.push(new RegExp(`^${APP_VERSION_KEY}$`));

  const preservedLocalEntries = snapshotStorage(localStorage, patterns);

  localStorage.clear();
  sessionStorage.clear();

  restoreStorage(localStorage, preservedLocalEntries);

  if (nextRole) {
    localStorage.setItem(ROLE_KEY, nextRole);
    localStorage.setItem(LAST_ROLE_KEY, nextRole);
  }

  clearStaleCacheData();
}

export function resetApp(options: ResetOptions & { redirectTo?: string } = {}) {
  const { redirectTo, ...resetOptions } = options;

  clearAppClientState(resetOptions);

  if (redirectTo) {
    window.location.assign(redirectTo);
    return;
  }

  window.location.reload();
}

export function syncStoredRole(nextRole: string, preserveAuth = true) {
  const lastRole = localStorage.getItem(LAST_ROLE_KEY);

  if (lastRole && lastRole !== nextRole) {
    clearAppClientState({ preserveAuth, preserveVersion: true, nextRole });
    window.location.reload();
    return true;
  }

  localStorage.setItem(ROLE_KEY, nextRole);
  localStorage.setItem(LAST_ROLE_KEY, nextRole);
  return false;
}

export function handleVersionReset(version: string) {
  const storedVersion = localStorage.getItem(APP_VERSION_KEY);

  if (storedVersion !== version) {
    console.log('🔄 Reset app – version mismatch');
    clearAppClientState({ preserveAuth: true, preserveVersion: false });
    localStorage.setItem(APP_VERSION_KEY, version);
    window.location.reload();
    return true;
  }

  clearStaleCacheData();
  return false;
}