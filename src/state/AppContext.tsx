import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState as PhoneAppState } from 'react-native';
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
import { DEFAULT_SETTINGS, storage } from '../storage';
import type { Settings, SpecialDay, Wish } from '../types';

type AppState = {
  /** False until saved data has been read from the phone. */
  ready: boolean;
  specialDays: SpecialDay[];
  wishes: Wish[];
  settings: Settings;
  saveDay: (day: SpecialDay) => Promise<void>;
  deleteDay: (id: string) => Promise<void>;
  saveWish: (wish: Wish) => Promise<void>;
  markWishSent: (id: string) => Promise<void>;
  /** "Remind me later": remind again on the day. */
  remindLater: (dayId: string) => Promise<void>;
  updateSettings: (changes: Partial<Settings>) => void;
  /** Adds people and wishes in one go (sample data, contacts import). */
  addMany: (days: SpecialDay[], wishes?: Wish[]) => Promise<void>;
  /** Schedules every notification again, e.g. right after notifications are allowed. */
  rescheduleNotifications: () => Promise<void>;
  /** Deletes everything, as if the app was just installed. */
  resetAll: () => Promise<void>;
};

const AppContext = createContext<AppState | null>(null);

/** Short unique id, good enough for data that lives on one phone. */
export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Replace the item with the same id, or add it if it's new. */
function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [...list, item];
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // The latest data, for actions that finish after a wait (scheduling is async).
  const latest = useRef({ specialDays, wishes, settings });
  useEffect(() => {
    latest.current = { specialDays, wishes, settings };
  }, [specialDays, wishes, settings]);

  /** Stores freshly scheduled notification ids without touching anything else. */
  const applyIds = (reminderIds: Map<string, string | undefined>, wishIds: Map<string, WishNotificationIds>) => {
    setSpecialDays((list) => list.map((d) => (reminderIds.has(d.id) ? { ...d, reminderNotificationId: reminderIds.get(d.id) } : d)));
    setWishes((list) => list.map((w) => (wishIds.has(w.id) ? { ...w, notificationId: undefined, earlyNotificationId: undefined, ...wishIds.get(w.id) } : w)));
  };

  const rescheduleFrom = async (days: SpecialDay[], allWishes: Wish[], s: Settings) => {
    const { reminderIds, wishIds } = await rescheduleAll(days, allWishes, s);
    applyIds(reminderIds, wishIds);
  };

  // Read saved data once when the app opens, then refresh all notifications.
  // That moves days that have passed on to next year.
  useEffect(() => {
    Promise.all([storage.loadSpecialDays(), storage.loadWishes(), storage.loadSettings()]).then(([d, w, s]) => {
      setSpecialDays(d);
      setWishes(w);
      setSettings(s);
      setReady(true);
      rescheduleFrom(d, w, s).catch(() => {});
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
      setWishes((list) =>
        list.map((w) =>
          ids.includes(w.id) ? { ...w, status: 'sent', sentAt, notificationId: undefined, earlyNotificationId: undefined } : w,
        ),
      );
    };
    markAutoSent();
    const subscription = PhoneAppState.addEventListener('change', (state) => {
      if (state === 'active') markAutoSent();
    });
    return () => subscription.remove();
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

  const value = useMemo<AppState>(() => {
    const findDay = (id: string) => latest.current.specialDays.find((d) => d.id === id);
    const findWish = (id: string) => latest.current.wishes.find((w) => w.id === id);

    const scheduleDayReminder = async (day: SpecialDay) => {
      const id = await scheduleReminder(day, latest.current.settings).catch(() => undefined);
      setSpecialDays((list) => list.map((d) => (d.id === day.id ? { ...d, reminderNotificationId: id } : d)));
    };

    return {
      ready,
      specialDays,
      wishes,
      settings,

      saveDay: async (day) => {
        // An edit replaces the old reminder (the date or "remind me" choice may have changed).
        await cancelNotification(findDay(day.id)?.reminderNotificationId);
        const fresh = { ...day, reminderNotificationId: undefined, remindLaterAt: undefined };
        setSpecialDays((list) => upsert(list, fresh));
        await scheduleDayReminder(fresh);
      },

      deleteDay: async (id) => {
        await cancelNotification(findDay(id)?.reminderNotificationId);
        // A deleted person's wishes go too, with their notifications.
        for (const w of latest.current.wishes.filter((x) => x.specialDayId === id)) await cancelWishNotifications(w);
        setSpecialDays((list) => list.filter((d) => d.id !== id));
        setWishes((list) => list.filter((w) => w.specialDayId !== id));
      },

      saveWish: async (wish) => {
        await cancelWishNotifications(findWish(wish.id));
        const fresh = { ...wish, notificationId: undefined, earlyNotificationId: undefined };
        setWishes((list) => upsert(list, fresh));
        const day = findDay(wish.specialDayId);
        const ids = day
          ? await scheduleWishNotifications(fresh, day, autoSendActive(latest.current.settings)).catch(() => ({}))
          : {};
        setWishes((list) => list.map((w) => (w.id === wish.id ? { ...w, ...ids } : w)));
      },

      markWishSent: async (id) => {
        await cancelWishNotifications(findWish(id));
        const sentAt = new Date().toISOString();
        setWishes((list) =>
          list.map((w) =>
            w.id === id ? { ...w, status: 'sent', sentAt, notificationId: undefined, earlyNotificationId: undefined } : w,
          ),
        );
      },

      remindLater: async (dayId) => {
        const day = findDay(dayId);
        if (!day) return;
        await cancelNotification(day.reminderNotificationId);
        const snoozed = { ...day, remindLaterAt: remindLaterTime(day, latest.current.settings).toISOString() };
        setSpecialDays((list) => upsert(list, snoozed));
        await scheduleDayReminder(snoozed);
      },

      updateSettings: (changes) => setSettings((s) => ({ ...s, ...changes })),

      addMany: async (days, newWishes = []) => {
        const allDays = [...latest.current.specialDays, ...days];
        const allWishes = [...latest.current.wishes, ...newWishes];
        setSpecialDays(allDays);
        setWishes(allWishes);
        await rescheduleFrom(allDays, allWishes, latest.current.settings);
      },

      rescheduleNotifications: () =>
        rescheduleFrom(latest.current.specialDays, latest.current.wishes, latest.current.settings),

      resetAll: async () => {
        await cancelAllNotifications();
        await storage.clearAll();
        setSpecialDays([]);
        setWishes([]);
        setSettings(DEFAULT_SETTINGS);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, specialDays, wishes, settings]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
