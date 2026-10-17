import type { NotificationResponse } from 'expo-notifications';
import type { NotificationData } from './notifications';
import { loadNotifications } from './notificationsModule';

// A notification can be tapped before the app is ready to show anything
// (still on the splash screen, or the app was closed). The tap waits here
// until the main screens are open and ask for it.

type Listener = (data: NotificationData) => void;
let pending: NotificationData | null = null;
let listener: Listener | null = null;

function readData(response: NotificationResponse): NotificationData | null {
  const data = response.notification.request.content.data as Record<string, unknown> | undefined;
  if (data?.kind === 'reminder' && typeof data.specialDayId === 'string') return { kind: 'reminder', specialDayId: data.specialDayId };
  if (data?.kind === 'send' && typeof data.wishId === 'string') return { kind: 'send', wishId: data.wishId };
  return null; // e.g. the test notification
}

function deliver(response: NotificationResponse) {
  const data = readData(response);
  if (!data) return;
  if (listener) listener(data);
  else pending = data;
}

/** Call once at start-up. */
export function startListeningForTaps() {
  const Notifications = loadNotifications();
  if (!Notifications) return;
  // The tap that opened the app from closed.
  const launch = Notifications.getLastNotificationResponse();
  if (launch) {
    deliver(launch);
    Notifications.clearLastNotificationResponse();
  }
  Notifications.addNotificationResponseReceivedListener(deliver);
}

/** The main screens call this to handle taps. Returns a function that stops listening. */
export function onNotificationTap(handler: Listener) {
  listener = handler;
  if (pending) {
    const waiting = pending;
    pending = null;
    handler(waiting);
  }
  return () => {
    if (listener === handler) listener = null;
  };
}
