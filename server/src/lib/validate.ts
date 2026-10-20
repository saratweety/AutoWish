import { z } from 'zod';

// Every request body is checked against these shapes before we touch the database.
// Unknown fields (for example a "userId" someone adds) are dropped automatically.

const isoDate = z.iso.datetime({ offset: true });
const clock = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:mm');
const digits = z.string().regex(/^\d{0,20}$/, 'Digits only');
const remindDays = z.union([z.literal(0), z.literal(1), z.literal(3), z.literal(7), z.literal(30)]);
// One person can have several reminders (a week before, the day before, on the day).
// At least one, and no repeats.
const remindDaysList = z
  .array(remindDays)
  .min(1)
  .max(5)
  .refine((list) => new Set(list).size === list.length, 'No repeated reminders');
const id = z.string().min(1).max(100);

export const specialDaySchema = z.object({
  id,
  name: z.string().min(1).max(200),
  phone: digits,
  occasion: z.enum(['birthday', 'anniversary', 'mothers_day', 'fathers_day', 'other']),
  customOccasion: z.string().max(100).nullish(),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  year: z.number().int().min(1800).max(2200).nullish(),
  // The six groups, plus the relationship names older app versions still send.
  // Phones map the old names to a group when they read their own saved data.
  relationship: z.enum([
    'university', 'school', 'office', 'cousin', 'family', 'friend',
    'best_friend', 'wife', 'husband', 'girlfriend', 'boyfriend', 'colleague',
  ]),
  photoUrl: z.string().max(500).regex(/^\/photos\//, 'Must be a /photos/ path').nullish(),
  remindDaysBefore: remindDaysList,
  reminderTime: clock.nullish(),
  sendTime: clock.nullish(),
  createdAt: isoDate,
  updatedAt: isoDate,
  deletedAt: isoDate.nullish(),
});

export const wishSchema = z.object({
  id,
  specialDayId: id,
  text: z.string().max(5000),
  tone: z.enum(['funny', 'emotional', 'formal', 'urdu']),
  // Local wall-clock time without a time zone, e.g. "2026-11-02T00:00".
  sendAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use yyyy-MM-ddTHH:mm'),
  status: z.enum(['scheduled', 'sent', 'not_sent']),
  sentAt: isoDate.nullish(),
  updatedAt: isoDate,
  deletedAt: isoDate.nullish(),
});

export const settingsSchema = z.object({
  userName: z.string().max(100).nullish(),
  userPhone: digits.nullish(),
  userBirthday: z
    .object({
      month: z.number().int().min(1).max(12),
      day: z.number().int().min(1).max(31),
      year: z.number().int().min(1800).max(2200).optional(),
    })
    .nullish(),
  defaultSendTime: clock,
  defaultRemindDaysBefore: remindDaysList,
  reminderTimeOfDay: clock,
  updatedAt: isoDate,
});

export const giftStateSchema = z.object({
  stars: z.number().int().min(0).max(10_000_000),
  unlocked: z.array(z.string().max(50)).max(1000),
  equipped: z.object({
    hat: z.string().max(50),
    ribbon: z.string().max(50),
    theme: z.string().max(50),
    sticker: z.string().max(50),
  }),
  best: z.number().int().min(0).max(10_000_000),
  streak: z.number().int().min(0).max(100_000),
  lastPlayed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish(),
  song: z.number().int().min(-1).max(20),
  sfx: z.boolean(),
  updatedAt: isoDate,
});

export const syncBodySchema = z.object({
  // null or missing = "I have nothing yet, send me everything".
  lastSyncedAt: isoDate.nullish(),
  changes: z.object({
    specialDays: z.array(specialDaySchema).max(1000).default([]),
    wishes: z.array(wishSchema).max(2000).default([]),
    settings: settingsSchema.nullish(),
    giftState: giftStateSchema.nullish(),
  }),
});

export type SpecialDayInput = z.infer<typeof specialDaySchema>;
export type WishInput = z.infer<typeof wishSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type GiftStateInput = z.infer<typeof giftStateSchema>;

/** "since" from the query string: "0" or empty means everything. */
export const sinceSchema = z.union([z.literal('0'), isoDate]).optional();

/** A short, friendly explanation of what was wrong with the request. */
export function describeError(error: z.ZodError) {
  const first = error.issues[0];
  return first ? `Invalid data at ${first.path.join('.') || 'body'}: ${first.message}` : 'Invalid data';
}
