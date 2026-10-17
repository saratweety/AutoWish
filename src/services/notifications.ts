import { addDays, addHours, differenceInCalendarDays, startOfDay, subDays, subMinutes } from 'date-fns';
import { occasionWord, possessiveOccasion } from '../data/labels';
import type { Settings, SpecialDay, Wish } from '../types';
import { autoSendSupported, cancelAllAutoSends, cancelAutoSend, scheduleAutoSend } from './autoSend';
import { nextOccurrence, withTime } from './dates';
import { loadNotifications } from './notificationsModule';
import { ensureChannel, notificationsAllowed, REMINDER_CHANNEL_ID, requestNotifications } from './permissions';

/** What a notification is about. Stored inside it, so a tap knows what to open. */
export type NotificationData = { kind: 'reminder'; specialDayId: string } | { kind: 'send'; wishId: string };

/** Show AutoWish notifications even while the app is open. Call once at start-up. */
export function setUpNotificationDisplay() {
  ensureChannel();
  loadNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Schedules one notification at an exact time. Returns its id, or undefined if not possible. */
async function scheduleAt(date: Date, title: string, body: string, data: NotificationData) {
  const Notifications = loadNotifications();
  if (!Notifications || date.getTime() <= Date.now()) return undefined;
  await ensureChannel();
  return Notifications.scheduleNotificationAsync({
    content: { title, body, data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: REMINDER_CHANNEL_ID },
  });
}

export async function cancelNotification(id: string | undefined) {
  if (!id) return;
  await loadNotifications()
    ?.cancelScheduledNotificationAsync(id)
    .catch(() => {});
}

/** Auto-send is used only when it's switched on and this phone supports it. */
export function autoSendActive(settings: Settings) {
  return settings.autoSend && autoSendSupported;
}

export async function cancelAllNotifications() {
  cancelAllAutoSends();
  await loadNotifications()
    ?.cancelAllScheduledNotificationsAsync()
    .catch(() => {});
}

/** "today", "tomorrow", "in 3 days", "in a week". */
function whenText(daysAway: number) {
  if (daysAway <= 0) return 'today';
  if (daysAway === 1) return 'tomorrow';
  if (daysAway === 7) return 'in a week';
  if (daysAway === 30) return 'in a month';
  return `in ${daysAway} days`;
}

/**
 * Works out when the next reminder for a special day should go off.
 * Normally: N days before the day (1, 3 or 7) at the reminder time (10:00 AM).
 * If that moment has already passed (for example the day was added late),
 * it reminds on the day itself instead. If the day has passed too, it uses next year's date.
 */
export function nextReminder(day: SpecialDay, settings: Settings, now = new Date()) {
  // "Remind me later" was tapped: use that time instead.
  if (day.remindLaterAt && new Date(day.remindLaterAt) > now) {
    const at = new Date(day.remindLaterAt);
    return { at, daysAway: differenceInCalendarDays(nextOccurrence(day, at), startOfDay(at)) };
  }
  // This person's own reminder time, or the default from Settings.
  const time = reminderTimeFor(day, settings);
  let occurrence = nextOccurrence(day, now);
  for (let year = 0; year < 2; year++) {
    const early = withTime(subDays(occurrence, day.remindDaysBefore), time);
    if (early > now) return { at: early, daysAway: day.remindDaysBefore as number };
    const onTheDay = withTime(occurrence, time);
    if (onTheDay > now) return { at: onTheDay, daysAway: 0 };
    occurrence = nextOccurrence(day, addDays(occurrence, 1));
  }
  return null;
}

/** The reminder time for one person: their own if set, otherwise the default. */
export function reminderTimeFor(day: SpecialDay, settings: Settings) {
  return day.reminderTime ?? settings.reminderTimeOfDay;
}

/** When "Remind me later" should remind again: on the day at the reminder time, or in 2 hours if that has passed. */
export function remindLaterTime(day: SpecialDay, settings: Settings, now = new Date()) {
  const onTheDay = withTime(nextOccurrence(day, now), reminderTimeFor(day, settings));
  return onTheDay > now ? onTheDay : addHours(now, 2);
}

/** Schedules the reminder for a day. The caller cancels any old one first. */
export async function scheduleReminder(day: SpecialDay, settings: Settings) {
  const next = nextReminder(day, settings);
  if (!next) return undefined;
  return scheduleAt(next.at, `${possessiveOccasion(day)} is ${whenText(next.daysAway)}!`, 'Busy? Tap to schedule your wish now.', {
    kind: 'reminder',
    specialDayId: day.id,
  });
}

/** How long before the send time the heads-up arrives. */
export const HEADS_UP_MINUTES = 5;

export type WishNotificationIds = { notificationId?: string; earlyNotificationId?: string };

/**
 * Schedules what happens for a wish:
 * - a heads-up 5 minutes before ("In 5 minutes: wish Ahmed!"),
 * - at the send time, either the "Tap to send" notification, or, with auto-send on,
 *   Android sends it by itself and tells the person whether it worked.
 * Tapping a notification opens WhatsApp with the wish ready.
 */
export async function scheduleWishNotifications(wish: Wish, day: SpecialDay, autoSend = false): Promise<WishNotificationIds> {
  if (wish.status !== 'scheduled') return {};
  const sendAt = new Date(wish.sendAt);
  const data: NotificationData = { kind: 'send', wishId: wish.id };
  const earlyNotificationId = await scheduleAt(
    subMinutes(sendAt, HEADS_UP_MINUTES),
    `In ${HEADS_UP_MINUTES} minutes: wish ${day.name}!`,
    autoSend
      ? `AutoWish will send your ${occasionWord(day)} wish automatically (when your phone is unlocked). Or tap to send it now.`
      : `Your ${occasionWord(day)} wish is ready. Tap to send it now on WhatsApp.`,
    data,
  );
  if (autoSend) {
    scheduleAutoSend(wish, day);
    return { earlyNotificationId };
  }
  const notificationId = await scheduleAt(sendAt, `It's time to wish ${day.name}!`, `Tap to send your ${occasionWord(day)} wish on WhatsApp`, data);
  return { notificationId, earlyNotificationId };
}

/** Cancels everything scheduled for a wish (both notifications and any automatic send). */
export async function cancelWishNotifications(wish: (WishNotificationIds & { id: string }) | undefined) {
  if (!wish) return;
  cancelAutoSend(wish.id);
  await cancelNotification(wish.notificationId);
  await cancelNotification(wish.earlyNotificationId);
}

/**
 * Clears every scheduled notification and schedules them again from the saved data.
 * Run when the app opens: this rolls past days over to next year, and fixes times
 * after a change of time zone. Returns the new notification ids.
 */
export async function rescheduleAll(days: SpecialDay[], wishes: Wish[], settings: Settings) {
  await cancelAllNotifications();
  const reminderIds = new Map<string, string | undefined>();
  for (const day of days) reminderIds.set(day.id, await scheduleReminder(day, settings).catch(() => undefined));
  const wishIds = new Map<string, WishNotificationIds>();
  for (const wish of wishes) {
    const day = days.find((d) => d.id === wish.specialDayId);
    if (day) wishIds.set(wish.id, await scheduleWishNotifications(wish, day, autoSendActive(settings)).catch(() => ({})));
  }
  return { reminderIds, wishIds };
}

export type TestResult = 'sent' | 'not_allowed' | 'unavailable';

/** Sends a sample notification in 5 seconds. */
export async function sendTestNotification(): Promise<TestResult> {
  const Notifications = loadNotifications();
  if (!Notifications) return 'unavailable';
  const allowed = (await notificationsAllowed()) || (await requestNotifications());
  if (!allowed) return 'not_allowed';
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: { title: 'AutoWish is working!', body: 'Your reminders and wishes will arrive like this.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5, channelId: REMINDER_CHANNEL_ID },
  });
  return 'sent';
}
