import { Platform } from 'react-native';
import AutoSend from '../../modules/autowish-autosend';
import type { SpecialDay, Wish } from '../types';

/**
 * Automatic WhatsApp sending (Android only, in the AutoWish app, not Expo Go).
 * Everything here quietly does nothing where it isn't supported.
 */
export const autoSendSupported = Platform.OS === 'android' && AutoSend !== null;

export type AutoSendStatus = {
  serviceOn: boolean; // AutoWish switched on in Accessibility settings
  exactTiming: boolean; // "Alarms & reminders" allowed
  batteryUnrestricted: boolean; // battery optimisation off for AutoWish
  whatsAppInstalled: boolean;
};

export function autoSendStatus(): AutoSendStatus | null {
  if (!AutoSend) return null;
  try {
    return {
      serviceOn: AutoSend.isServiceEnabled(),
      exactTiming: AutoSend.canScheduleExactAlarms(),
      batteryUnrestricted: AutoSend.isIgnoringBatteryOptimizations(),
      whatsAppInstalled: AutoSend.isWhatsAppInstalled(),
    };
  } catch {
    return null;
  }
}

export const openAccessibilitySettings = () => AutoSend?.openAccessibilitySettings();
export const openExactAlarmSettings = () => AutoSend?.openExactAlarmSettings();
export const openBatterySettings = () => AutoSend?.openBatterySettings();

/** Hands a scheduled wish to Android to send at its time. Past or sent wishes are ignored. */
export function scheduleAutoSend(wish: Wish, day: SpecialDay) {
  if (!AutoSend) return;
  const at = new Date(wish.sendAt).getTime();
  if (wish.status !== 'scheduled' || at <= Date.now()) return;
  try {
    AutoSend.schedule(wish.id, day.phone, wish.text, day.name, at);
  } catch {
    // If it can't be scheduled, the person still gets the 5-minute heads-up.
  }
}

export function cancelAutoSend(wishId: string) {
  try {
    AutoSend?.cancel(wishId);
  } catch {}
}

export function cancelAllAutoSends() {
  try {
    AutoSend?.cancelAll();
  } catch {}
}

/** Ids of wishes Android sent while the app was closed (each is returned once). */
export function takeAutoSentWishIds(): string[] {
  try {
    return AutoSend?.consumeSentWishIds() ?? [];
  } catch {
    return [];
  }
}
