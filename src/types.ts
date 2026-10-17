// The app's data shapes (from the project brief, section 9).

export type Occasion = 'birthday' | 'anniversary' | 'mothers_day' | 'fathers_day' | 'other';
export type Relationship =
  | 'friend'
  | 'best_friend'
  | 'family'
  | 'wife'
  | 'husband'
  | 'girlfriend'
  | 'boyfriend'
  | 'colleague';
export type Tone = 'funny' | 'emotional' | 'formal' | 'urdu';
export type WishStatus = 'scheduled' | 'sent' | 'not_sent';
export type RemindDays = 1 | 3 | 7 | 30;

export interface SpecialDay {
  id: string;
  name: string;
  phone: string; // full international number, digits only, e.g. "923001234567"
  occasion: Occasion;
  customOccasion?: string; // when occasion === 'other'
  month: number; // 1-12
  day: number; // 1-31
  year?: number;
  relationship: Relationship;
  photoUri?: string;
  remindDaysBefore: RemindDays;
  reminderTime?: string; // "HH:mm" for this person; not set = use the default from Settings
  sendTime?: string; // "HH:mm" new wishes for this person go out at; not set = the default from Settings
  reminderNotificationId?: string;
  remindLaterAt?: string; // set by "Remind me later": the next reminder comes at this time instead
  createdAt: string;
}

export interface Wish {
  id: string;
  specialDayId: string;
  text: string;
  tone: Tone;
  sendAt: string; // ISO date-time
  status: WishStatus;
  notificationId?: string;
  earlyNotificationId?: string; // the heads-up 5 minutes before
  sentAt?: string;
}

export interface Settings {
  userName?: string;
  userPhone?: string; // the user's own WhatsApp number, digits only with country code
  userPhotoUri?: string;
  userBirthday?: { month: number; day: number };
  defaultSendTime: string; // "00:00"
  defaultRemindDaysBefore: RemindDays;
  reminderTimeOfDay: string; // "10:00"
  onboardingDone: boolean;
  autoSend: boolean; // Android: send scheduled wishes on WhatsApp automatically
}
