// The app's data shapes (from the project brief, section 9).

export type Occasion = 'birthday' | 'anniversary' | 'mothers_day' | 'fathers_day' | 'other';
/** The group a person belongs to. Still stored as `relationship` on a special day. */
export type Relationship = 'university' | 'school' | 'office' | 'cousin' | 'family' | 'friend';
export type Tone = 'funny' | 'emotional' | 'formal' | 'urdu';
export type WishStatus = 'scheduled' | 'sent' | 'not_sent';
export type RemindDays = 0 | 1 | 3 | 7 | 30; // 0 = on the day itself
/** How long before the day a "buy the gift" reminder goes out. Longer than a wish
 *  reminder, because a gift has to be found, bought and sometimes delivered. */
export type GiftRemindDays = 3 | 5 | 7 | 14 | 30;
/** idea = still thinking, bought = it's ready, given = handed over on the day. */
export type GiftStatus = 'idea' | 'bought' | 'given';

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
  remindDaysBefore: RemindDays[]; // one or more: e.g. [7, 1, 0] = a week before, the day before, and on the day
  likes?: string[]; // "Things Ahmad loves": short tags like "Chocolate", "Cricket"
  notes?: string; // anything worth remembering: sizes, allergies, favourite colour
  giftBudget?: number; // what you mean to spend on them this time
  reminderTime?: string; // "HH:mm" for this person; not set = use the default from Settings
  sendTime?: string; // "HH:mm" new wishes for this person go out at; not set = the default from Settings
  reminderNotificationIds?: string[]; // LOCAL ONLY, never synced (see 14.4). One per reminder above
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

/** Something to give this person: an idea, or a gift already bought. */
export interface GiftIdea {
  id: string;
  specialDayId: string;
  title: string;
  price?: number;
  where?: string; // shop name or a link
  status: GiftStatus;
  boughtAt?: string; // ISO date, set when it's marked bought
  givenYear?: number; // the year it was actually given, for "Given before"
  remindToBuy: boolean;
  remindDaysBefore: GiftRemindDays;
  notificationId?: string; // LOCAL ONLY, never synced
  createdAt: string;
  updatedAt: string; // ISO, set on every change, used for sync ("last change wins")
  deletedAt?: string; // soft delete, so other phones learn about deletions
}

/** A special day or wish before AppContext stamps its updatedAt. */
export type SpecialDayInput = Omit<SpecialDay, 'updatedAt' | 'deletedAt'> & { updatedAt?: string };
export type WishInput = Omit<Wish, 'updatedAt' | 'deletedAt'> & { updatedAt?: string };
export type GiftIdeaInput = Omit<GiftIdea, 'updatedAt' | 'deletedAt'> & { updatedAt?: string };

export interface Settings {
  userName?: string;
  userPhone?: string; // the user's own WhatsApp number, digits only with country code
  userPhotoUri?: string; // LOCAL ONLY
  userBirthday?: { month: number; day: number; year?: number };
  defaultSendTime: string; // "00:00"
  defaultRemindDaysBefore: RemindDays[];
  reminderTimeOfDay: string; // "10:00"
  onboardingDone: boolean; // LOCAL ONLY (per phone)
  autoSend: boolean; // LOCAL ONLY. Android: send scheduled wishes on WhatsApp automatically
  defaultCountry?: string; // LOCAL ONLY (per phone). ISO code the number boxes start on, e.g. "PK"
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
