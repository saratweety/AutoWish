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
export type RemindDays = 0 | 1 | 3 | 7 | 30; // 0 = on the day itself

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
  photoUri?: string; // LOCAL ONLY: the photo file on this phone
  photoUrl?: string; // the photo saved on our server ("/photos/..."), so other phones can show it
  photoUploadedFrom?: string; // LOCAL ONLY: which photoUri photoUrl was made from
  remindDaysBefore: RemindDays;
  reminderTime?: string; // "HH:mm" for this person; not set = use the default from Settings
  sendTime?: string; // "HH:mm" new wishes for this person go out at; not set = the default from Settings
  reminderNotificationId?: string; // LOCAL ONLY, never synced (see 14.4)
  remindLaterAt?: string; // LOCAL ONLY. Set by "Remind me later": the next reminder comes at this time instead
  createdAt: string;
  updatedAt: string; // ISO, set on every change, used for sync ("last change wins")
  deletedAt?: string; // soft delete, so other phones learn about deletions
}

export interface Wish {
  id: string;
  specialDayId: string;
  text: string;
  tone: Tone;
  sendAt: string; // ISO date-time (the server keeps it as local wall-clock time, see src/api/sync.ts)
  status: WishStatus;
  notificationId?: string; // LOCAL ONLY, never synced
  earlyNotificationId?: string; // LOCAL ONLY. The heads-up 5 minutes before
  sentAt?: string;
  updatedAt: string;
  deletedAt?: string;
}

/** A special day or wish before AppContext stamps its updatedAt. */
export type SpecialDayInput = Omit<SpecialDay, 'updatedAt' | 'deletedAt'> & { updatedAt?: string };
export type WishInput = Omit<Wish, 'updatedAt' | 'deletedAt'> & { updatedAt?: string };

export interface Settings {
  userName?: string;
  userPhone?: string; // the user's own WhatsApp number, digits only with country code
  userPhotoUri?: string; // LOCAL ONLY
  userBirthday?: { month: number; day: number; year?: number };
  defaultSendTime: string; // "00:00"
  defaultRemindDaysBefore: RemindDays;
  reminderTimeOfDay: string; // "10:00"
  onboardingDone: boolean; // LOCAL ONLY (per phone)
  autoSend: boolean; // LOCAL ONLY. Android: send scheduled wishes on WhatsApp automatically
  updatedAt: string; // when a synced setting last changed
}

/** My Gift and the daily Catch the Confetti game. */
export interface GiftState {
  stars: number; // stars to spend in My Gift
  unlocked: string[]; // item ids
  equipped: { hat: string; ribbon: string; theme: string; sticker: string };
  best: number; // best game score
  streak: number; // days in a row the game was played
  lastPlayed?: string; // "yyyy-MM-dd", the last day the game gave stars
  song: number; // game music: 0, 1, 2, or -1 for none
  sfx: boolean; // game sound effects
  updatedAt: string;
}
