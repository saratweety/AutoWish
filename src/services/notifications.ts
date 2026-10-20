import { subDays, subMinutes } from 'date-fns';
import { occasionWord, possessiveOccasion } from '../data/labels';
import type { GiftIdea, Settings, SpecialDay, Wish } from '../types';
import { autoSendSupported, cancelAllAutoSends, cancelAutoSend, scheduleAutoSend } from './autoSend';
import { nextOccurrence, withTime } from './dates';
import { nextReminders, reminderText, reminderTimeFor } from './reminderPlan';
import { loadNotifications } from './notificationsModule';
import { ensureChannel, notificationsAllowed, REMINDER_CHANNEL_ID, requestNotifications } from './permissions';

export { nextReminders, reminderText, reminderTimeFor, remindLaterTime } from './reminderPlan';
export type { Reminder } from './reminderPlan';

/** What a notification is about. Stored inside it, so a tap knows what to open. */
export type NotificationData =
  | { kind: 'reminder'; specialDayId: string }
  | { kind: 'send'; wishId: string }
  // "Time to buy Ahmad's gift": opens that person's page, where the idea is listed.
  | { kind: 'gift'; specialDayId: string; giftIdeaId: string };

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

/** Schedules every reminder for a day. The caller cancels the old ones first. */
export async function scheduleReminders(day: SpecialDay, settings: Settings) {
  const ids: string[] = [];
  for (const next of nextReminders(day, settings)) {
    const id = await scheduleAt(
      next.at,
      reminderText(day, next.daysAway, nextOccurrence(day, next.at)),
      'Busy? Tap to schedule your wish now.',
      { kind: 'reminder', specialDayId: day.id },
    );
    if (id) ids.push(id);
  }
  return ids;
}

/**
 * Schedules the "buy this gift" nudge, N days before the day at the reminder time.
 * Nothing is scheduled once the gift is bought, or if the moment has passed.
 */
export async function scheduleGiftReminder(idea: GiftIdea, day: SpecialDay, settings: Settings) {
  if (!idea.remindToBuy || idea.status !== 'idea') return undefined;
  const at = withTime(subDays(nextOccurrence(day), idea.remindDaysBefore), reminderTimeFor(day, settings));
  return scheduleAt(at, `Time to buy ${day.name}'s gift`, `${idea.title} — ${possessiveOccasion(day)} is in ${idea.remindDaysBefore} days.`, {
    kind: 'gift',
    specialDayId: day.id,
    giftIdeaId: idea.id,
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
  const reminderIds = new Map<string, string[]>();
  for (const day of days) reminderIds.set(day.id, await scheduleReminders(day, settings).catch(() => []));
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
