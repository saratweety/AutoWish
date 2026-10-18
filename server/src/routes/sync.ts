import { Prisma } from '@prisma/client';
import { Router } from 'express';
import { currentUserId, ensureUserRow } from '../lib/auth';
import { deletePhoto } from '../lib/photoStore';
import { prisma } from '../lib/prisma';
import {
  describeError,
  sinceSchema,
  syncBodySchema,
  type GiftStateInput,
  type SettingsInput,
  type SpecialDayInput,
  type WishInput,
} from '../lib/validate';

export const syncRouter = Router();

/*
 * HOW SYNC WORKS (CLAUDE.md 14.4)
 *
 * The phone keeps a full copy of the data. It sends us its changes (POST /sync),
 * and asks what changed on other phones since it last asked (GET /sync?since=...).
 *
 * Rules, applied to every row:
 * 1. The owner is ALWAYS the logged-in user from the Clerk token. Any userId in
 *    the body was already dropped by zod; we set userId ourselves.
 * 2. If a row id already exists but belongs to someone else, we reject that row
 *    and never change it.
 * 3. Conflicts: LAST CHANGE WINS. We only overwrite a stored row when the incoming
 *    updatedAt (set by the phone when the user made the change) is newer than the
 *    stored one. An older or equal change is ignored.
 * 4. Deletes are SOFT: the phone sends the row with deletedAt set. We keep the row,
 *    so other phones learn about the delete next time they sync. The cleanup job
 *    in index.ts removes them for good after 30 days.
 */

type SaveResult = 'saved' | 'skipped' | 'rejected';

// We look back a few extra seconds when answering "what changed since X".
// A row saved by another request at almost the same moment might be written
// with a time just before X but finish saving just after we looked. Sending a
// few rows twice is harmless (the phone ignores rows it already has).
const OVERLAP_MS = 5_000;

const date = (iso: string | null | undefined) => (iso ? new Date(iso) : null);

function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

/**
 * The shared logic for SpecialDay and Wish rows (rules 2 and 3 above).
 * `create` and `update` do the actual writes for one table.
 */
async function saveRow(
  existing: { userId: string; updatedAt: Date } | null,
  userId: string,
  incomingUpdatedAt: Date,
  create: () => Promise<unknown>,
  update: () => Promise<{ count: number }>,
): Promise<SaveResult> {
  if (!existing) {
    try {
      await create();
      return 'saved';
    } catch (error) {
      // Someone created the same id a moment ago. Treat it like any other old change.
      if (isUniqueViolation(error)) return 'skipped';
      throw error;
    }
  }
  if (existing.userId !== userId) return 'rejected'; // rule 2
  if (incomingUpdatedAt <= existing.updatedAt) return 'skipped'; // rule 3: ours is newer or the same
  // The "updatedAt < incoming" condition is checked again inside the update itself,
  // so two phones syncing at the same moment can't overwrite a newer change.
  const { count } = await update();
  return count > 0 ? 'saved' : 'skipped';
}

async function saveSpecialDay(userId: string, row: SpecialDayInput): Promise<SaveResult> {
  const updatedAt = new Date(row.updatedAt);
  // A photo must be one of this user's own uploads (rule 1: never point at someone else's).
  const photoUrl = row.photoUrl?.startsWith(`/photos/${userId}/`) ? row.photoUrl : null;
  const data = {
    name: row.name,
    phone: row.phone,
    occasion: row.occasion,
    customOccasion: row.customOccasion ?? null,
    month: row.month,
    day: row.day,
    year: row.year ?? null,
    relationship: row.relationship,
    photoUrl,
    remindDaysBefore: row.remindDaysBefore,
    reminderTime: row.reminderTime ?? null,
    sendTime: row.sendTime ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt,
    deletedAt: date(row.deletedAt),
    syncedAt: new Date(),
  };
  const existing = await prisma.specialDay.findUnique({
    where: { id: row.id },
    select: { userId: true, updatedAt: true, photoUrl: true },
  });
  const result = await saveRow(
    existing,
    userId,
    updatedAt,
    () => prisma.specialDay.create({ data: { id: row.id, userId, ...data } }),
    () => prisma.specialDay.updateMany({ where: { id: row.id, userId, updatedAt: { lt: updatedAt } }, data }),
  );
  // The photo was replaced: the old file is no longer needed.
  if (result === 'saved' && existing?.photoUrl && existing.photoUrl !== photoUrl) await deletePhoto(existing.photoUrl);
  return result;
}

async function saveWish(userId: string, row: WishInput): Promise<SaveResult> {
  const updatedAt = new Date(row.updatedAt);
  const data = {
    specialDayId: row.specialDayId,
    text: row.text,
    tone: row.tone,
    sendAtLocal: row.sendAtLocal,
    status: row.status,
    sentAt: date(row.sentAt),
    updatedAt,
    deletedAt: date(row.deletedAt),
    syncedAt: new Date(),
  };
  const existing = await prisma.wish.findUnique({ where: { id: row.id }, select: { userId: true, updatedAt: true } });
  return saveRow(
    existing,
    userId,
    updatedAt,
    () => prisma.wish.create({ data: { id: row.id, userId, ...data } }),
    () => prisma.wish.updateMany({ where: { id: row.id, userId, updatedAt: { lt: updatedAt } }, data }),
  );
}

// Settings and GiftState have one row per user (the id IS the user id),
// so rule 2 can't happen; only rule 3 (last change wins) applies.

async function saveSettings(userId: string, row: SettingsInput) {
  const updatedAt = new Date(row.updatedAt);
  const data = {
    userName: row.userName ?? null,
    userPhone: row.userPhone ?? null,
    userBirthday: row.userBirthday ?? Prisma.DbNull,
    defaultSendTime: row.defaultSendTime,
    defaultRemindDaysBefore: row.defaultRemindDaysBefore,
    reminderTimeOfDay: row.reminderTimeOfDay,
    updatedAt,
    syncedAt: new Date(),
  };
  const existing = await prisma.settings.findUnique({ where: { userId }, select: { userId: true, updatedAt: true } });
  return saveRow(
    existing,
    userId,
    updatedAt,
    () => prisma.settings.create({ data: { userId, ...data } }),
    () => prisma.settings.updateMany({ where: { userId, updatedAt: { lt: updatedAt } }, data }),
  );
}

async function saveGiftState(userId: string, row: GiftStateInput) {
  const updatedAt = new Date(row.updatedAt);
  const data = {
    stars: row.stars,
    unlocked: row.unlocked,
    equipped: row.equipped,
    best: row.best,
    streak: row.streak,
    lastPlayed: row.lastPlayed ?? null,
    song: row.song,
    sfx: row.sfx,
    updatedAt,
    syncedAt: new Date(),
  };
  const existing = await prisma.giftState.findUnique({ where: { userId }, select: { userId: true, updatedAt: true } });
  return saveRow(
    existing,
    userId,
    updatedAt,
    () => prisma.giftState.create({ data: { userId, ...data } }),
    () => prisma.giftState.updateMany({ where: { userId, updatedAt: { lt: updatedAt } }, data }),
  );
}

// Columns sent back to the phone (never userId or syncedAt).
const dayColumns = {
  id: true, name: true, phone: true, occasion: true, customOccasion: true, month: true, day: true, year: true,
  relationship: true, photoUrl: true, remindDaysBefore: true, reminderTime: true, sendTime: true,
  createdAt: true, updatedAt: true, deletedAt: true,
} satisfies Prisma.SpecialDaySelect;
const wishColumns = {
  id: true, specialDayId: true, text: true, tone: true, sendAtLocal: true, status: true, sentAt: true,
  updatedAt: true, deletedAt: true,
} satisfies Prisma.WishSelect;
const settingsColumns = {
  userName: true, userPhone: true, userBirthday: true, defaultSendTime: true, defaultRemindDaysBefore: true,
  reminderTimeOfDay: true, updatedAt: true,
} satisfies Prisma.SettingsSelect;
const giftColumns = {
  stars: true, unlocked: true, equipped: true, best: true, streak: true, lastPlayed: true, song: true, sfx: true,
  updatedAt: true,
} satisfies Prisma.GiftStateSelect;

/**
 * Everything of this user that was saved on the server after `since`
 * (null = everything), INCLUDING soft-deleted rows, so phones can remove them.
 * `serverTime` is what the phone sends as `since` next time.
 */
async function changesSince(userId: string, since: Date | null) {
  const startedAt = Date.now();
  const changed = since ? { syncedAt: { gt: since } } : {};
  const [specialDays, wishes, settings, giftState] = await Promise.all([
    prisma.specialDay.findMany({ where: { userId, ...changed }, select: dayColumns }),
    prisma.wish.findMany({ where: { userId, ...changed }, select: wishColumns }),
    prisma.settings.findFirst({ where: { userId, ...changed }, select: settingsColumns }),
    prisma.giftState.findFirst({ where: { userId, ...changed }, select: giftColumns }),
  ]);
  return {
    specialDays,
    wishes,
    settings,
    giftState,
    serverTime: new Date(startedAt - OVERLAP_MS).toISOString(),
  };
}

function parseSince(value: unknown) {
  const parsed = sinceSchema.safeParse(value === '' ? undefined : value);
  if (!parsed.success) return { error: 'since must be 0 or an ISO date' } as const;
  return { since: parsed.data && parsed.data !== '0' ? new Date(parsed.data) : null } as const;
}

// GET /sync?since=<ISO>  ->  what changed after `since` (since=0 = everything)
syncRouter.get('/sync', async (req, res) => {
  const result = parseSince(req.query.since);
  if ('error' in result) {
    res.status(400).json({ error: result.error });
    return;
  }
  res.json(await changesSince(currentUserId(res), result.since));
});

// POST /sync  ->  save the phone's changes, then answer like GET /sync?since=lastSyncedAt
syncRouter.post('/sync', async (req, res) => {
  const parsed = syncBodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: describeError(parsed.error) });
    return;
  }
  const userId = currentUserId(res);
  const { lastSyncedAt, changes } = parsed.data;
  await ensureUserRow(userId);

  // Ids of rows we refused because another user owns them, so the phone stops retrying.
  const rejected = { specialDays: [] as string[], wishes: [] as string[] };
  for (const day of changes.specialDays) {
    if ((await saveSpecialDay(userId, day)) === 'rejected') rejected.specialDays.push(day.id);
  }
  for (const wish of changes.wishes) {
    if ((await saveWish(userId, wish)) === 'rejected') rejected.wishes.push(wish.id);
  }
  if (changes.settings) await saveSettings(userId, changes.settings);
  if (changes.giftState) await saveGiftState(userId, changes.giftState);

  res.json({ ...(await changesSince(userId, date(lastSyncedAt))), rejected });
});
