import * as Contacts from 'expo-contacts';
import { Platform } from 'react-native';
import { loadNotifications } from './notificationsModule';

export const REMINDER_CHANNEL_ID = 'autowish-reminders';

/** False in Expo Go on Android, where notifications can't load. */
export function notificationsAvailable() {
  return loadNotifications() !== null;
}

let channelReady: Promise<unknown> | null = null;

/**
 * Android shows a notification only if its channel exists. A notification sent to a
 * missing channel is silently dropped, so this runs before anything is scheduled
 * (and before asking permission, which Android 13+ also needs). Safe to call often.
 */
export function ensureChannel() {
  const Notifications = loadNotifications();
  if (!Notifications || Platform.OS !== 'android') return Promise.resolve();
  channelReady ??= Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Reminders and wishes',
    importance: Notifications.AndroidImportance.HIGH,
  }).catch(() => {
    channelReady = null; // try again next time
  });
  return channelReady;
}

export async function notificationsAllowed() {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

export async function requestNotifications() {
  const Notifications = loadNotifications();
  if (!Notifications) return false;
  await ensureChannel();
  return (await Notifications.requestPermissionsAsync()).granted;
}

export async function contactsAllowed() {
  return (await Contacts.getPermissionsAsync()).granted;
}

export async function requestContacts() {
  return (await Contacts.requestPermissionsAsync()).granted;
}
