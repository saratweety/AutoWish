import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_EQUIPPED, FREE_ITEMS } from '../data/giftItems';
import { RELATIONSHIP_LABELS } from '../data/labels';
import type { GiftIdea, GiftState, RemindDays, Relationship, Settings, SpecialDay, Wish } from '../types';
import { DEFAULT_COUNTRY } from '../data/countries';

/** "Long ago": the updatedAt of defaults, so anything saved on the server wins over them. */
export const LONG_AGO = '1970-01-01T00:00:00.000Z';

// Everything is saved on the phone only, one storage key per collection.
const KEYS = {
  specialDays: 'autowish.specialDays',
  wishes: 'autowish.wishes',
  settings: 'autowish.settings',
  gift: 'autowish.gift',
  giftIdeas: 'autowish.giftIdeas',
} as const;

// Choices that belong to this phone alone and are never synced or cleared on logout.
const LOCAL_KEYS = {
  homeFilter: 'autowish.homeFilter',
} as const;

// Written by older versions that offered "Use without an account". An account is
// required now, so the flag is only here to be cleared off phones that still have it.
const OLD_KEYS = ['autowish.account.guest'];

export const DEFAULT_SETTINGS: Settings = {
  defaultSendTime: '00:00',
  defaultRemindDaysBefore: [1],
  reminderTimeOfDay: '10:00',
  onboardingDone: false,
  autoSend: false,
  defaultCountry: DEFAULT_COUNTRY,
  updatedAt: LONG_AGO,
};

export const DEFAULT_GIFT: GiftState = {
  stars: 0,
  unlocked: FREE_ITEMS,
  equipped: DEFAULT_EQUIPPED,
  best: 0,
  streak: 0,
  song: 0,
  sfx: true,
  updatedAt: LONG_AGO,
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

/**
 * Reminders used to be a single choice and are now a list, so anything saved by an
 * older version holds a plain number here. Read it back as a one-item list.
 */
function remindList(value: unknown): RemindDays[] {
  if (Array.isArray(value)) return value as RemindDays[];
  if (typeof value === 'number') return [value as RemindDays];
  return DEFAULT_SETTINGS.defaultRemindDaysBefore;
}

/**
 * Relationships became groups (University, School, Office, Cousin, Family, Friend),
 * so anything saved by an older version holds a name that no longer exists. Map it
 * to the closest group; anything unknown becomes Friend, which was the old default.
 */
const OLD_GROUPS: Record<string, Relationship> = {
  best_friend: 'friend',
  colleague: 'office',
  wife: 'family',
  husband: 'family',
  girlfriend: 'family',
  boyfriend: 'family',
};

function groupOf(value: unknown): Relationship {
  if (typeof value !== 'string') return 'friend';
  if (value in RELATIONSHIP_LABELS) return value as Relationship;
  return OLD_GROUPS[value] ?? 'friend';
}

// Data saved before accounts existed has no updatedAt. Give it one when it's read,
// so sync can compare it: a special day uses its createdAt, a wish uses "now".
// (Settings and gift state get LONG_AGO from the defaults above.)
async function loadSpecialDays() {
  const days = await load<SpecialDay[]>(KEYS.specialDays, []);
  return days.map((d) => ({
    ...d,
    remindDaysBefore: remindList(d.remindDaysBefore),
    relationship: groupOf(d.relationship),
    updatedAt: d.updatedAt ?? d.createdAt ?? new Date().toISOString(),
  }));
}
async function loadWishes() {
  const wishes = await load<Wish[]>(KEYS.wishes, []);
  const now = new Date().toISOString();
  return wishes.map((w) => (w.updatedAt ? w : { ...w, updatedAt: now }));
}

async function loadGiftIdeas() {
  const ideas = await load<GiftIdea[]>(KEYS.giftIdeas, []);
  const now = new Date().toISOString();
  return ideas.map((g) => (g.updatedAt ? g : { ...g, updatedAt: now }));
}

export const storage = {
  loadSpecialDays,
  saveSpecialDays: (days: SpecialDay[]) => save(KEYS.specialDays, days),
  loadWishes,
  saveWishes: (wishes: Wish[]) => save(KEYS.wishes, wishes),
  loadGiftIdeas,
  saveGiftIdeas: (ideas: GiftIdea[]) => save(KEYS.giftIdeas, ideas),
  loadSettings: async () => {
    const saved = await load<Partial<Settings>>(KEYS.settings, {});
    return { ...DEFAULT_SETTINGS, ...saved, defaultRemindDaysBefore: remindList(saved.defaultRemindDaysBefore) };
  },
  saveSettings: (settings: Settings) => save(KEYS.settings, settings),
  /** The filter chip picked on Home last time. A view choice, so it stays on this phone. */
  loadHomeFilter: () => load<string | null>(LOCAL_KEYS.homeFilter, null),
  saveHomeFilter: (filter: string) => save(LOCAL_KEYS.homeFilter, filter),
  loadGift: async () => ({ ...DEFAULT_GIFT, ...(await load<Partial<GiftState>>(KEYS.gift, {})) }),
  saveGift: (gift: GiftState) => save(KEYS.gift, gift),
  /** Logout: removes the account's data, keeps per-phone settings (passed in). */
  clearAccountData: async (keptSettings: Settings) => {
    await AsyncStorage.multiRemove([KEYS.specialDays, KEYS.wishes, KEYS.gift, KEYS.giftIdeas]);
    await save(KEYS.settings, keptSettings);
  },
  clearAll: () => AsyncStorage.multiRemove([...Object.values(KEYS), ...Object.values(LOCAL_KEYS), ...OLD_KEYS]),
};
