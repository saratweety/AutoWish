import { requireOptionalNativeModule } from 'expo-modules-core';

/** The Android auto-send module. Missing on iPhone and in Expo Go. */
export type AutoSendModule = {
  isServiceEnabled(): boolean;
  openAccessibilitySettings(): void;
  openAppInfo(): void;
  canScheduleExactAlarms(): boolean;
  openExactAlarmSettings(): void;
  isIgnoringBatteryOptimizations(): boolean;
  openBatterySettings(): void;
  isWhatsAppInstalled(): boolean;
  schedule(wishId: string, phone: string, text: string, name: string, atMillis: number): void;
  cancel(wishId: string): void;
  cancelAll(): void;
  consumeSentWishIds(): string[];
};

export default requireOptionalNativeModule<AutoSendModule>('AutoWishAutoSend');
