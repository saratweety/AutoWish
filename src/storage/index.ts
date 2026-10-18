import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_EQUIPPED, FREE_ITEMS } from '../data/giftItems';
import type { GiftState, Settings, SpecialDay, Wish } from '../types';

// Everything is saved on the phone only, one storage key per collection.
const KEYS = {
  specialDays: 'autowish.specialDays',
  wishes: 'autowish.wishes',
  settings: 'autowish.settings',
  gift: 'autowish.gift',
} as const;

// Per-phone flags, kept when someone logs out.
const PHONE_KEYS = {
  guest: 'autowish.account.guest', // chose "Use without an account"
} as const;

export const DEFAULT_SETTINGS: Settings = {
  defaultSendTime: '00:00',
  defaultRemindDaysBefore: 1,
  reminderTimeOfDay: '10:00',
  onboardingDone: false,
  autoSend: false,
};

export const DEFAULT_GIFT: GiftState = {
  stars: 0,
  unlocked: FREE_ITEMS,
  equipped: DEFAULT_EQUIPPED,
  best: 0,
  streak: 0,
  song: 0,
  sfx: true,
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
  loadGift: async () => ({ ...DEFAULT_GIFT, ...(await load<Partial<GiftState>>(KEYS.gift, {})) }),
  saveGift: (gift: GiftState) => save(KEYS.gift, gift),
  loadGuest: () => load<boolean>(PHONE_KEYS.guest, false),
  saveGuest: (guest: boolean) => save(PHONE_KEYS.guest, guest),
  clearAll: () => AsyncStorage.multiRemove([...Object.values(KEYS), ...Object.values(PHONE_KEYS)]),
};
