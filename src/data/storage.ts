/**
 * Data layer — Persistence adapter.
 *
 * Wraps AsyncStorage (which works on web, iOS and Android) behind a tiny
 * interface. The store uses this for hydration. Swapping to SQLite, a remote
 * backend, or an encrypted store later means changing only this file.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface KeyValueStore {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

/** App-wide storage namespace, so keys don't collide with other libraries. */
export const STORAGE_PREFIX = 'habitos:';

export const storage: KeyValueStore = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};
