import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Settings, SpecialDay, Wish } from '../types';

// Everything is saved on the phone only, one storage key per collection.
const KEYS = {
  specialDays: 'autowish.specialDays',
  wishes: 'autowish.wishes',
  settings: 'autowish.settings',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  defaultSendTime: '00:00',
  defaultRemindDaysBefore: 1,
  reminderTimeOfDay: '10:00',
  onboardingDone: false,
  autoSend: false,
};

async function load<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Unreadable data shouldn't stop the app from opening.
    return fallback;
  }
}

async function save(key: string, value: unknown) {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export const storage = {
  loadSpecialDays: () => load<SpecialDay[]>(KEYS.specialDays, []),
  saveSpecialDays: (days: SpecialDay[]) => save(KEYS.specialDays, days),
  loadWishes: () => load<Wish[]>(KEYS.wishes, []),
  saveWishes: (wishes: Wish[]) => save(KEYS.wishes, wishes),
  loadSettings: async () => ({ ...DEFAULT_SETTINGS, ...(await load<Partial<Settings>>(KEYS.settings, {})) }),
  saveSettings: (settings: Settings) => save(KEYS.settings, settings),
  clearAll: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};
