import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null | undefined;

/**
 * Loads expo-notifications only when it's first needed.
 * Expo Go on Android is missing part of this library, and just loading it there
 * crashes the whole app. So in that case we never load it and return null, and
 * callers treat notifications as unavailable. A development build (set up in
 * milestone 6) includes everything, so there this returns the real module.
 */
export function loadNotifications(): NotificationsModule | null {
  if (cached !== undefined) return cached;
  if (isRunningInExpoGo() && Platform.OS === 'android') {
    cached = null;
    return cached;
  }
  try {
    // Loaded here instead of at the top of the file, so the check above runs first.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
  } catch {
    cached = null;
  }
  return cached;
}
