import * as Crypto from 'expo-crypto';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as PhoneAppState } from 'react-native';
import { connectLocalStore, recordChanges, type Change } from '../api/sync';
import { takeAutoSentWishIds } from '../services/autoSend';
import {
  autoSendActive,
  cancelAllNotifications,
  cancelNotification,
  cancelWishNotifications,
  remindLaterTime,
  rescheduleAll,
  scheduleReminder,
  scheduleWishNotifications,
  type WishNotificationIds,
} from '../services/notifications';
import { DEFAULT_GIFT, DEFAULT_SETTINGS, storage } from '../storage';
import type { GiftState, Settings, SpecialDay, SpecialDayInput, Wish, WishInput } from '../types';

type AppState = {
  /** False until saved data has been read from the phone. */
  ready: boolean;
  specialDays: SpecialDay[];
  wishes: Wish[];
  settings: Settings;
  /** Stars, unlocked items and what the gift is wearing (My Gift and the daily game). */
  gift: GiftState;
  updateGift: (changes: Partial<GiftState> | ((g: GiftState) => Partial<GiftState>)) => void;
  saveDay: (day: SpecialDayInput) => Promise<void>;
  deleteDay: (id: string) => Promise<void>;
  saveWish: (wish: WishInput) => Promise<void>;
  markWishSent: (id: string) => Promise<void>;
  /** "Remind me later": remind again on the day. */
  remindLater: (dayId: string) => Promise<void>;
  updateSettings: (changes: Partial<Settings>) => void;
  /** Adds people and wishes in one go (sample data, contacts import). */
  addMany: (days: SpecialDayInput[], wishes?: WishInput[]) => Promise<void>;
  /** Schedules every notification again, e.g. right after notifications are allowed. */
  rescheduleNotifications: () => Promise<void>;
  /**
   * Logging out: cancels every notification on this phone and removes the account's
   * data from it. Per-phone choices (onboarding done, auto-send) stay.
   */
  clearAccountData: () => Promise<void>;
  /** Deletes everything, as if the app was just installed. */
  resetAll: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

/** A random id (UUID). Made on the phone, so records created offline keep their id on the server. */
export function newId() {
  return Crypto.randomUUID();
}

/** Replace the item with the same id, or add it if it's new. */
function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

// Settings that belong to this phone only: changing them doesn't need syncing.
const LOCAL_SETTINGS: (keyof Settings)[] = ['onboardingDone', 'autoSend', 'userPhotoUri', 'updatedAt'];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [gift, setGift] = useState<GiftState>(DEFAULT_GIFT);

  // The latest data, for actions that finish after a wait (scheduling, syncing).
  // Every change goes through the commit functions below, which update this
  // straight away, so it is never behind (React state updates a moment later).
  const latest = useRef({ specialDays, wishes, settings, gift });
  const commit = {
    days: (next: (list: SpecialDay[]) => SpecialDay[]) => {
      latest.current.specialDays = next(latest.current.specialDays);
      setSpecialDays(latest.current.specialDays);
    },
    wishes: (next: (list: Wish[]) => Wish[]) => {
      latest.current.wishes = next(latest.current.wishes);
      setWishes(latest.current.wishes);
    },
    settings: (next: Settings) => {
      latest.current.settings = next;
      setSettings(next);
    },
    gift: (next: GiftState) => {
      latest.current.gift = next;
      setGift(next);
    },
  };

  /** Stores freshly scheduled notification ids without touching anything else. */
  const applyIds = (reminderIds: Map<string, string | undefined>, wishIds: Map<string, WishNotificationIds>) => {
    commit.days((list) => list.map((d) => (reminderIds.has(d.id) ? { ...d, reminderNotificationId: reminderIds.get(d.id) } : d)));
    commit.wishes((list) =>
      list.map((w) => (wishIds.has(w.id) ? { ...w, notificationId: undefined, earlyNotificationId: undefined, ...wishIds.get(w.id) } : w)),
    );
  };

  const rescheduleFrom = async (days: SpecialDay[], allWishes: Wish[], s: Settings) => {
    const { reminderIds, wishIds } = await rescheduleAll(days, allWishes, s);
    applyIds(reminderIds, wishIds);
  };

  // Read saved data once when the app opens, then refresh all notifications.
  // That moves days that have passed on to next year.
  useEffect(() => {
    Promise.all([storage.loadSpecialDays(), storage.loadWishes(), storage.loadSettings(), storage.loadGift()]).then(([d, w, s, g]) => {
      commit.days(() => d);
      commit.wishes(() => w);
      commit.settings(s);
      commit.gift(g);
      setReady(true);
      rescheduleFrom(d, w, s).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The sync engine (src/api/sync.ts) reads and writes the phone's data through here.
  const clearAccountData = async () => {
    // Cancel first, so a logged-out phone never reminds about someone.
    await cancelAllNotifications();
    const { onboardingDone, autoSend } = latest.current.settings;
    const kept = { ...DEFAULT_SETTINGS, onboardingDone, autoSend };
    commit.days(() => []);
    commit.wishes(() => []);
    commit.settings(kept);
    commit.gift(DEFAULT_GIFT);
    await storage.clearAccountData(kept);
  };
  useEffect(() => {
    connectLocalStore({
      clear: () => clearAccountData(),
      read: () => latest.current,
      write: async (data, changed) => {
        if (changed === 0) return;
        commit.days(() => data.specialDays);
        commit.wishes(() => data.wishes);
        commit.settings(data.settings);
        commit.gift(data.gift);
        // Something arrived from the account (maybe from another phone, or a whole
        // account after logging in): schedule this phone's reminders and wishes again.
        // Wishes whose time has passed are not scheduled; they show as "Not sent".
        await rescheduleFrom(data.specialDays, data.wishes, data.settings).catch(() => {});
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When the reminder time or auto-send changes in Settings, schedule everything again.
  const scheduleKey = `${settings.reminderTimeOfDay}|${settings.autoSend}`;
  const lastScheduleKey = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const changed = lastScheduleKey.current !== null && lastScheduleKey.current !== scheduleKey;
    lastScheduleKey.current = scheduleKey;
    if (changed) {
      const { specialDays: d, wishes: w, settings: s } = latest.current;
      rescheduleFrom(d, w, s).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, scheduleKey]);

  // Wishes Android sent automatically while the app was closed: mark them Sent.
  // Checked when the app opens and every time it comes back to the front.
  useEffect(() => {
    if (!ready) return;
    const markAutoSent = () => {
      const ids = takeAutoSentWishIds();
      if (ids.length === 0) return;
      const sentAt = new Date().toISOString();
      commit.wishes((list) =>
        list.map((w) =>
          ids.includes(w.id)
            ? { ...w, status: 'sent', sentAt, updatedAt: sentAt, notificationId: undefined, earlyNotificationId: undefined }
            : w,
        ),
      );
      recordChanges(ids.map((id) => ({ kind: 'wish', id })));
    };
    markAutoSent();
    const subscription = PhoneAppState.addEventListener('change', (state) => {
      if (state === 'active') markAutoSent();
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Save each collection whenever it changes (only after loading, so we never overwrite with empty data).
  useEffect(() => {
    if (ready) storage.saveSpecialDays(specialDays);
  }, [ready, specialDays]);
  useEffect(() => {
    if (ready) storage.saveWishes(wishes);
  }, [ready, wishes]);
  useEffect(() => {
    if (ready) storage.saveSettings(settings);
  }, [ready, settings]);
  useEffect(() => {
    if (ready) storage.saveGift(gift);
  }, [ready, gift]);

  const value = useMemo<AppState>(() => {
    const findDay = (id: string) => latest.current.specialDays.find((d) => d.id === id);
    const findWish = (id: string) => latest.current.wishes.find((w) => w.id === id);
    const now = () => new Date().toISOString();

    const scheduleDayReminder = async (day: SpecialDay) => {
      const id = await scheduleReminder(day, latest.current.settings).catch(() => undefined);
      commit.days((list) => list.map((d) => (d.id === day.id ? { ...d, reminderNotificationId: id } : d)));
    };

    return {
      ready,
      specialDays,
      wishes,
      settings,
      gift,

      updateGift: (changes) => {
        const g = latest.current.gift;
        commit.gift({ ...g, ...(typeof changes === 'function' ? changes(g) : changes), updatedAt: now() });
        recordChanges([{ kind: 'gift' }]);
      },

      saveDay: async (day) => {
        // An edit replaces the old reminder (the date or "remind me" choice may have changed).
        await cancelNotification(findDay(day.id)?.reminderNotificationId);
        const fresh: SpecialDay = { ...day, updatedAt: now(), reminderNotificationId: undefined, remindLaterAt: undefined };
        commit.days((list) => upsert(list, fresh));
        recordChanges([{ kind: 'day', id: fresh.id }]);
        await scheduleDayReminder(fresh);
      },

      deleteDay: async (id) => {
        const day = findDay(id);
        await cancelNotification(day?.reminderNotificationId);
        // A deleted person's wishes go too, with their notifications.
        const theirWishes = latest.current.wishes.filter((x) => x.specialDayId === id);
        for (const w of theirWishes) await cancelWishNotifications(w);
        commit.days((list) => list.filter((d) => d.id !== id));
        commit.wishes((list) => list.filter((w) => w.specialDayId !== id));
        // Soft delete: the outbox keeps a copy marked deletedAt, so the server (and
        // through it, the user's other phones) learn that these were deleted.
        const deletedAt = now();
        const changes: Change[] = theirWishes.map((w) => ({ kind: 'wish', id: w.id, deleted: { ...w, updatedAt: deletedAt, deletedAt } }));
        if (day) changes.push({ kind: 'day', id, deleted: { ...day, updatedAt: deletedAt, deletedAt } });
        recordChanges(changes);
      },

      saveWish: async (wish) => {
        await cancelWishNotifications(findWish(wish.id));
        const fresh: Wish = { ...wish, updatedAt: now(), notificationId: undefined, earlyNotificationId: undefined };
        commit.wishes((list) => upsert(list, fresh));
        recordChanges([{ kind: 'wish', id: fresh.id }]);
        const day = findDay(wish.specialDayId);
        const ids = day
          ? await scheduleWishNotifications(fresh, day, autoSendActive(latest.current.settings)).catch(() => ({}))
          : {};
        commit.wishes((list) => list.map((w) => (w.id === wish.id ? { ...w, ...ids } : w)));
      },

      markWishSent: async (id) => {
        await cancelWishNotifications(findWish(id));
        const sentAt = now();
        commit.wishes((list) =>
          list.map((w) =>
            w.id === id
              ? { ...w, status: 'sent', sentAt, updatedAt: sentAt, notificationId: undefined, earlyNotificationId: undefined }
              : w,
          ),
        );
        recordChanges([{ kind: 'wish', id }]);
      },

      // "Remind me later" only changes this phone's reminder, so it isn't synced.
      remindLater: async (dayId) => {
        const day = findDay(dayId);
        if (!day) return;
        await cancelNotification(day.reminderNotificationId);
        const snoozed = { ...day, remindLaterAt: remindLaterTime(day, latest.current.settings).toISOString() };
        commit.days((list) => upsert(list, snoozed));
        await scheduleDayReminder(snoozed);
      },

      updateSettings: (changes) => {
        const synced = Object.keys(changes).some((k) => !LOCAL_SETTINGS.includes(k as keyof Settings));
        commit.settings({ ...latest.current.settings, ...changes, ...(synced ? { updatedAt: now() } : {}) });
        if (synced) recordChanges([{ kind: 'settings' }]);
      },

      addMany: async (days, newWishes = []) => {
        const stamp = now();
        const freshDays: SpecialDay[] = days.map((d) => ({ ...d, updatedAt: stamp }));
        const freshWishes: Wish[] = newWishes.map((w) => ({ ...w, updatedAt: stamp }));
        commit.days((list) => [...list, ...freshDays]);
        commit.wishes((list) => [...list, ...freshWishes]);
        recordChanges([
          ...freshDays.map((d) => ({ kind: 'day' as const, id: d.id })),
          ...freshWishes.map((w) => ({ kind: 'wish' as const, id: w.id })),
        ]);
        await rescheduleFrom(latest.current.specialDays, latest.current.wishes, latest.current.settings);
      },

      rescheduleNotifications: () =>
        rescheduleFrom(latest.current.specialDays, latest.current.wishes, latest.current.settings),

      clearAccountData,

      resetAll: async () => {
        await cancelAllNotifications();
        await storage.clearAll();
        commit.days(() => []);
        commit.wishes(() => []);
        commit.settings(DEFAULT_SETTINGS);
        commit.gift(DEFAULT_GIFT);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, specialDays, wishes, settings, gift]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
