// The sync engine (CLAUDE.md 14.4 and 14.5).
//
// The phone keeps a FULL copy of the data in AsyncStorage and the screens only
// ever read that copy, so the app is fast and works offline. This file keeps
// that copy and the server's copy the same:
//
// 1. Every local add, edit or delete gets updatedAt = now and goes into the
//    OUTBOX (saved on the phone, so it survives closing the app or being offline).
// 2. syncNow() sends the outbox to the server, gets back everything that changed
//    on other phones, merges it in, empties the sent part of the outbox, and
//    remembers the server's time for next time (lastSyncedAt).
// 3. AppContext then reschedules this phone's notifications from the merged data.
//
// Some fields only make sense on this phone and are NEVER uploaded: notification
// ids, "Remind me later", the photo file path, onboardingDone and auto-send.
// We strip them before uploading (toServer...) and keep the phone's own values
// when a newer version arrives from the server (fromServer...).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { useSyncExternalStore } from 'react';
import type { GiftState, Settings, SpecialDay, Wish } from '../types';
import { api, ApiError } from './client';
import { uploadPhoto } from './photos';

// ---------- What the server sends and receives (server/src/lib/validate.ts) ----------

export type ServerDay = {
  id: string;
  name: string;
  phone: string;
  occasion: SpecialDay['occasion'];
  customOccasion?: string | null;
  month: number;
  day: number;
  year?: number | null;
  relationship: SpecialDay['relationship'];
  photoUrl?: string | null;
  remindDaysBefore: SpecialDay['remindDaysBefore'];
  reminderTime?: string | null;
  sendTime?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ServerWish = {
  id: string;
  specialDayId: string;
  text: string;
  tone: Wish['tone'];
  sendAtLocal: string; // "2026-11-02T00:00", wall-clock time with no time zone
  status: Wish['status'];
  sentAt?: string | null;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ServerSettings = {
  userName?: string | null;
  userPhone?: string | null;
  userBirthday?: { month: number; day: number; year?: number | null } | null;
  defaultSendTime: string;
  defaultRemindDaysBefore: Settings['defaultRemindDaysBefore'];
  reminderTimeOfDay: string;
  updatedAt: string;
};

export type ServerGift = {
  stars: number;
  unlocked: string[];
  equipped: GiftState['equipped'];
  best: number;
  streak: number;
  lastPlayed?: string | null;
  song: number;
  sfx: boolean;
  updatedAt: string;
};

export type SyncResponse = {
  specialDays: ServerDay[];
  wishes: ServerWish[];
  settings: ServerSettings | null;
  giftState: ServerGift | null;
  serverTime: string;
  rejected?: { specialDays: string[]; wishes: string[] };
};

// ---------- Time zones: sendAt <-> sendAtLocal ----------
//
// On the phone a wish's sendAt is an exact moment (ISO, e.g. "2026-11-01T19:00:00.000Z"
// for 12:00 AM in Pakistan). The server stores the wall-clock time instead
// ("2026-11-02T00:00"). When the wish comes down to a phone, we rebuild the moment
// in THAT phone's current time zone, so "12:00 AM on the 2nd" stays 12:00 AM on the
// 2nd even after a move from Karachi to Dubai or a new phone set to another zone.

export function toLocalClock(iso: string) {
  return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
}

export function fromLocalClock(local: string) {
  const [date, time] = local.split('T');
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  return new Date(y, m - 1, d, h, min).toISOString();
}

// ---------- Local record <-> server row ----------

const orUndefined = <T>(value: T | null | undefined) => (value === null ? undefined : value);

/** A special day as uploaded: local-only fields removed. */
export function toServerDay(d: SpecialDay): ServerDay {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone,
    occasion: d.occasion,
    customOccasion: d.customOccasion,
    month: d.month,
    day: d.day,
    year: d.year,
    relationship: d.relationship,
    photoUrl: d.photoUrl,
    remindDaysBefore: d.remindDaysBefore,
    reminderTime: d.reminderTime,
    sendTime: d.sendTime,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
    deletedAt: d.deletedAt,
  };
}

/** A downloaded special day, keeping this phone's own local-only fields. */
function fromServerDay(r: ServerDay, mine: SpecialDay | undefined): SpecialDay {
  // Keep the photo file on this phone only if it is still the same photo.
  // If another phone changed or removed the photo, we show theirs instead.
  const samePhoto = mine && (mine.photoUrl ?? null) === (r.photoUrl ?? null);
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    occasion: r.occasion,
    customOccasion: orUndefined(r.customOccasion),
    month: r.month,
    day: r.day,
    year: orUndefined(r.year),
    relationship: r.relationship,
    photoUrl: orUndefined(r.photoUrl),
    photoUri: samePhoto ? mine.photoUri : undefined,
    photoUploadedFrom: samePhoto ? mine.photoUploadedFrom : undefined,
    remindDaysBefore: r.remindDaysBefore,
    reminderTime: orUndefined(r.reminderTime),
    sendTime: orUndefined(r.sendTime),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    // Notifications are rescheduled after every merge; "Remind me later" stays on this phone.
    reminderNotificationIds: mine?.reminderNotificationIds,
    remindLaterAt: mine?.remindLaterAt,
  };
}

export function toServerWish(w: Wish): ServerWish {
  return {
    id: w.id,
    specialDayId: w.specialDayId,
    text: w.text,
    tone: w.tone,
    sendAtLocal: toLocalClock(w.sendAt),
    status: w.status,
    sentAt: w.sentAt,
    updatedAt: w.updatedAt,
    deletedAt: w.deletedAt,
  };
}

function fromServerWish(r: ServerWish, mine: Wish | undefined): Wish {
  return {
    id: r.id,
    specialDayId: r.specialDayId,
    text: r.text,
    tone: r.tone,
    sendAt: fromLocalClock(r.sendAtLocal),
    status: r.status,
    sentAt: orUndefined(r.sentAt),
    updatedAt: r.updatedAt,
    notificationId: mine?.notificationId,
    earlyNotificationId: mine?.earlyNotificationId,
  };
}

function toServerSettings(s: Settings): ServerSettings {
  return {
    userName: s.userName,
    userPhone: s.userPhone,
    userBirthday: s.userBirthday,
    defaultSendTime: s.defaultSendTime,
    defaultRemindDaysBefore: s.defaultRemindDaysBefore,
    reminderTimeOfDay: s.reminderTimeOfDay,
    updatedAt: s.updatedAt,
  };
}

function fromServerSettings(r: ServerSettings, mine: Settings): Settings {
  const b = r.userBirthday;
  return {
    ...mine, // keeps onboardingDone, autoSend and the photo, which are per phone
    userName: orUndefined(r.userName),
    userPhone: orUndefined(r.userPhone),
    userBirthday: b ? { month: b.month, day: b.day, year: orUndefined(b.year) } : undefined,
    defaultSendTime: r.defaultSendTime,
    defaultRemindDaysBefore: r.defaultRemindDaysBefore,
    reminderTimeOfDay: r.reminderTimeOfDay,
    updatedAt: r.updatedAt,
  };
}

function toServerGift(g: GiftState): ServerGift {
  return {
    stars: g.stars,
    unlocked: g.unlocked,
    equipped: g.equipped,
    best: g.best,
    streak: g.streak,
    lastPlayed: g.lastPlayed,
    song: g.song,
    sfx: g.sfx,
    updatedAt: g.updatedAt,
  };
}

function fromServerGift(r: ServerGift, mine: GiftState): GiftState {
  return { ...mine, ...r, lastPlayed: orUndefined(r.lastPlayed) };
}

// ---------- The merge ----------

/** True if time a is later than time b ("last change wins"). */
function isNewer(a: string, b: string) {
  return Date.parse(a) > Date.parse(b);
}

export type LocalData = { specialDays: SpecialDay[]; wishes: Wish[]; settings: Settings; gift: GiftState };

/**
 * Merges rows from the server into a local list. For each row:
 * - If our copy is the same age or newer, we keep ours (it's waiting in the outbox).
 * - If the server's row is newer and soft-deleted, we remove ours from the screens.
 * - If the server's row is newer, it replaces ours (keeping our local-only fields).
 * `deletedHere` holds records deleted on this phone that the server hasn't heard
 * about yet, so an older copy coming down doesn't bring them back.
 */
function mergeList<L extends { id: string; updatedAt: string }, R extends { id: string; updatedAt: string; deletedAt?: string | null }>(
  local: L[],
  remote: R[],
  deletedHere: Map<string, string>,
  convert: (row: R, mine: L | undefined) => L,
) {
  const byId = new Map(local.map((x) => [x.id, x]));
  let changed = 0;
  for (const row of remote) {
    const mine = byId.get(row.id);
    if (mine && !isNewer(row.updatedAt, mine.updatedAt)) continue;
    const deletedAt = deletedHere.get(row.id);
    if (deletedAt && !isNewer(row.updatedAt, deletedAt)) continue;
    if (row.deletedAt) {
      if (mine) {
        byId.delete(row.id);
        changed++;
      }
      continue;
    }
    byId.set(row.id, convert(row, mine));
    changed++;
  }
  return { list: changed > 0 ? [...byId.values()] : local, changed };
}

/** The local data with the server's answer merged in, and how many records changed. */
export function mergeRemote(local: LocalData, response: SyncResponse, box: Outbox): LocalData & { changed: number } {
  const deletedDays = new Map(Object.values(box.days).flatMap((v) => (v === true ? [] : [[v.id, v.updatedAt] as const])));
  const deletedWishes = new Map(Object.values(box.wishes).flatMap((v) => (v === true ? [] : [[v.id, v.updatedAt] as const])));
  const days = mergeList(local.specialDays, response.specialDays, deletedDays, fromServerDay);
  const wishes = mergeList(local.wishes, response.wishes, deletedWishes, fromServerWish);
  const newSettings = response.settings && isNewer(response.settings.updatedAt, local.settings.updatedAt);
  const newGift = response.giftState && isNewer(response.giftState.updatedAt, local.gift.updatedAt);
  return {
    specialDays: days.list,
    wishes: wishes.list,
    settings: newSettings && response.settings ? fromServerSettings(response.settings, local.settings) : local.settings,
    gift: newGift && response.giftState ? fromServerGift(response.giftState, local.gift) : local.gift,
    changed: days.changed + wishes.changed + (newSettings ? 1 : 0) + (newGift ? 1 : 0),
  };
}

// ---------- The outbox ----------
//
// days / wishes: id -> true (send the record as it is now on the phone)
//                id -> a "tombstone" (the record was deleted here; send it with deletedAt set)
// settings / gift: true = send them.

export type Outbox = {
  days: Record<string, true | ServerDay>;
  wishes: Record<string, true | ServerWish>;
  settings: boolean;
  gift: boolean;
};

const KEYS = {
  outbox: 'autowish.sync.outbox',
  lastSyncedAt: 'autowish.sync.lastSyncedAt',
  owner: 'autowish.sync.owner', // the user the local data belongs to
} as const;

const emptyOutbox = (): Outbox => ({ days: {}, wishes: {}, settings: false, gift: false });

let outbox: Outbox | null = null;

async function getOutbox() {
  if (!outbox) {
    try {
      const raw = await AsyncStorage.getItem(KEYS.outbox);
      outbox = raw ? { ...emptyOutbox(), ...(JSON.parse(raw) as Outbox) } : emptyOutbox();
    } catch {
      outbox = emptyOutbox();
    }
  }
  return outbox;
}

async function saveOutbox() {
  if (outbox) await AsyncStorage.setItem(KEYS.outbox, JSON.stringify(outbox)).catch(() => {});
}

function outboxSize(box: Outbox) {
  return Object.keys(box.days).length + Object.keys(box.wishes).length + (box.settings ? 1 : 0) + (box.gift ? 1 : 0);
}

export type Change =
  | { kind: 'day'; id: string; deleted?: SpecialDay }
  | { kind: 'wish'; id: string; deleted?: Wish }
  | { kind: 'settings' }
  | { kind: 'gift' };

/**
 * Called by AppContext after every local change. Adds it to the outbox and
 * syncs about 2 seconds later (several quick changes go up together).
 */
export async function recordChanges(changes: Change[]) {
  const box = await getOutbox();
  for (const c of changes) {
    if (c.kind === 'day') box.days[c.id] = c.deleted ? toServerDay(c.deleted) : true;
    else if (c.kind === 'wish') box.wishes[c.id] = c.deleted ? toServerWish(c.deleted) : true;
    else if (c.kind === 'settings') box.settings = true;
    else box.gift = true;
  }
  await saveOutbox();
  setStatus({ pending: outboxSize(box) });
  syncSoon();
}

/** After logging in: put every local record in the outbox, so nothing on the phone is lost. */
async function queueEverything(local: LocalData) {
  const box = await getOutbox();
  for (const d of local.specialDays) box.days[d.id] ??= true;
  for (const w of local.wishes) box.wishes[w.id] ??= true;
  box.settings = true;
  box.gift = true;
  await saveOutbox();
}

/** Builds the POST /sync body from the outbox and the phone's current data. */
function buildChanges(box: Outbox, local: LocalData) {
  const days = new Map(local.specialDays.map((d) => [d.id, d]));
  const wishes = new Map(local.wishes.map((w) => [w.id, w]));
  const specialDays = Object.entries(box.days).flatMap(([id, v]) => {
    if (v !== true) return [v];
    const d = days.get(id);
    return d ? [toServerDay(d)] : [];
  });
  const wishRows = Object.entries(box.wishes).flatMap(([id, v]) => {
    if (v !== true) return [v];
    const w = wishes.get(id);
    return w ? [toServerWish(w)] : [];
  });
  return {
    specialDays,
    wishes: wishRows,
    settings: box.settings ? toServerSettings(local.settings) : undefined,
    giftState: box.gift ? toServerGift(local.gift) : undefined,
  };
}

/**
 * Removes what was just sent from the outbox, but only if it hasn't changed again
 * while we were waiting for the server (then it must go up next time).
 */
function clearSent(box: Outbox, sent: ReturnType<typeof buildChanges>, now: LocalData, rejected: SyncResponse['rejected']) {
  const sentDays = new Map(sent.specialDays.map((d) => [d.id, d.updatedAt]));
  const sentWishes = new Map(sent.wishes.map((w) => [w.id, w.updatedAt]));
  const currentDay = new Map(now.specialDays.map((d) => [d.id, d.updatedAt]));
  const currentWish = new Map(now.wishes.map((w) => [w.id, w.updatedAt]));
  for (const [id, v] of Object.entries(box.days)) {
    const current = v === true ? currentDay.get(id) : v.updatedAt;
    if (!sentDays.has(id) && v === true && current === undefined) delete box.days[id]; // deleted without a tombstone
    else if (sentDays.get(id) === current) delete box.days[id];
  }
  for (const [id, v] of Object.entries(box.wishes)) {
    const current = v === true ? currentWish.get(id) : v.updatedAt;
    if (!sentWishes.has(id) && v === true && current === undefined) delete box.wishes[id];
    else if (sentWishes.get(id) === current) delete box.wishes[id];
  }
  // Rows another account owns can never be saved; stop retrying them.
  for (const id of rejected?.specialDays ?? []) delete box.days[id];
  for (const id of rejected?.wishes ?? []) delete box.wishes[id];
  if (sent.settings && sent.settings.updatedAt === now.settings.updatedAt) box.settings = false;
  if (sent.giftState && sent.giftState.updatedAt === now.gift.updatedAt) box.gift = false;
}

// ---------- Sync status (shown in the Settings account card) ----------

export type SyncState = 'idle' | 'saving' | 'offline' | 'error';

export type SyncStatus = {
  state: SyncState;
  /** When the phone and the account last matched (phone time, ISO). */
  savedAt?: string;
  /** Changes waiting to go up. */
  pending: number;
  /** A friendly sentence when state is 'error'. */
  message?: string;
  /** True while a just-logged-in phone downloads everything ("Getting your special days…"). */
  downloading: boolean;
  /** Set after a login that brought data down; Home shows the welcome toast once. */
  welcomeBack: boolean;
};

let status: SyncStatus = { state: 'idle', pending: 0, downloading: false, welcomeBack: false };
const listeners = new Set<() => void>();

function setStatus(changes: Partial<SyncStatus>) {
  status = { ...status, ...changes };
  listeners.forEach((l) => l());
}

export function useSyncStatus() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => status,
  );
}

/** Home calls this after showing the welcome toast, so it shows only once. */
export function clearWelcomeBack() {
  setStatus({ welcomeBack: false });
}

// ---------- Connecting the engine to AppContext ----------

export type LocalStore = {
  /** The phone's data right now. */
  read: () => LocalData;
  /** Saves merged data and (unless reschedule is false) reschedules notifications if anything changed. */
  write: (data: LocalData, changed: number, reschedule?: boolean) => Promise<void>;
  /** Cancels all notifications and removes the account's data from the phone. */
  clear: () => Promise<void>;
};

let store: LocalStore | null = null;
/** Logged-in Clerk user id, or null when logged out. */
let userId: string | null = null;
// Goes up on every logout, so a sync that was still running can't write old data back.
let session = 0;

export function connectLocalStore(s: LocalStore) {
  store = s;
}

/** The phone's data right now (e.g. to check the user's name right after a login download). */
export function localSnapshot() {
  return store?.read();
}

// Resolves once the logged-in account's data is on this phone
// (after the first download following a login, or straight away on app start).
let markAccountReady: () => void = () => {};
let accountReady = new Promise<void>((resolve) => (markAccountReady = resolve));

/** Waits (at most timeoutMs) until the account's data has been downloaded to this phone. */
export function whenAccountReady(timeoutMs = 20_000) {
  return Promise.race([accountReady, new Promise<void>((resolve) => setTimeout(resolve, timeoutMs))]);
}

/**
 * Tells the engine who is logged in (null = nobody). Called whenever Clerk's
 * login state changes, and on app start.
 * - The same user as last time (app start): sync normally.
 * - A different user, or the first login on this phone: upload everything that is
 *   on the phone, then download everything from the account.
 */
export async function setSyncUser(id: string | null) {
  if (id === userId) return;
  userId = id;
  if (!id) return;
  const owner = await AsyncStorage.getItem(KEYS.owner).catch(() => null);
  if (owner === id) {
    markAccountReady();
    syncNow();
    return;
  }
  if (owner && store) {
    // The data on this phone belongs to ANOTHER account (its login ended without
    // "Log out", e.g. it expired). Never upload it into this account: remove it.
    outbox = emptyOutbox();
    await saveOutbox();
    await store.clear();
  }
  await startAccountOnThisPhone(id);
  markAccountReady();
}

async function startAccountOnThisPhone(id: string) {
  if (!store) return;
  setStatus({ downloading: true });
  try {
    // Everything on the phone goes into the outbox, and lastSyncedAt is cleared so
    // the next sync downloads the whole account. Both are saved on the phone, so if
    // we're offline right now, the next successful sync still does all of it.
    await queueEverything(store.read());
    await AsyncStorage.removeItem(KEYS.lastSyncedAt);
    await AsyncStorage.setItem(KEYS.owner, id);
    // Creates the User row on the server the first time (POST /sync does it too, so a failure here is fine).
    await api('/me').catch(() => {});
    const before = store.read();
    const hadData = before.specialDays.length + before.wishes.length;
    await syncNow();
    const after = store.read();
    // Something came down from the account: say welcome back on Home.
    if (status.state === 'idle' && after.specialDays.length + after.wishes.length > hadData) setStatus({ welcomeBack: true });
  } finally {
    setStatus({ downloading: false });
  }
}

function errorStatus(error: unknown): Partial<SyncStatus> {
  if (error instanceof ApiError && (error.kind === 'offline' || error.kind === 'timeout')) return { state: 'offline' };
  return { state: 'error', message: error instanceof ApiError ? error.message : 'Something went wrong while saving.' };
}

// ---------- syncNow ----------

let running: Promise<void> | null = null;
let again = false;
let timer: ReturnType<typeof setTimeout> | null = null;

/** Syncs ~2 seconds after the last local change. */
function syncSoon() {
  if (!userId) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    syncNow();
  }, 2000);
}

/**
 * Sends the outbox and merges what comes back. Safe to call any time and often:
 * if a sync is already running, one more runs right after it (never two at once).
 * Never throws; the result shows in useSyncStatus().
 */
export function syncNow(): Promise<void> {
  if (!userId || !store) return Promise.resolve();
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await syncOnce();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

// Photos that failed to upload for a reason other than the internet (e.g. the file is gone).
// Not retried until the app restarts, so they don't slow down every sync.
const failedPhotos = new Set<string>();

/**
 * Uploads photos picked on this phone that the account doesn't have yet
 * (photoUri changed since photoUploadedFrom), then saves the new photoUrl on the
 * special day and puts it in the outbox. A photo that can't upload never stops the
 * rest of the sync: the person just shows their initial on other phones for now.
 */
async function uploadPendingPhotos(box: Outbox, mySession: number) {
  if (!store) return;
  const waiting = store.read().specialDays.filter((d) => d.photoUri && d.photoUri !== d.photoUploadedFrom && !failedPhotos.has(d.photoUri));
  for (const day of waiting) {
    const localUri = day.photoUri as string;
    let photoUrl: string | null;
    try {
      photoUrl = await uploadPhoto(localUri);
    } catch (error) {
      if (error instanceof ApiError && (error.kind === 'offline' || error.kind === 'timeout')) return; // try next sync
      failedPhotos.add(localUri);
      continue;
    }
    if (!photoUrl) return; // photo storage isn't set up on the server
    if (mySession !== session) return;
    const now = store.read();
    const current = now.specialDays.find((d) => d.id === day.id);
    if (!current || current.photoUri !== localUri) continue; // changed or deleted meanwhile
    const updated: SpecialDay = { ...current, photoUrl, photoUploadedFrom: localUri, updatedAt: new Date().toISOString() };
    await store.write({ ...now, specialDays: now.specialDays.map((d) => (d.id === day.id ? updated : d)) }, 1, false);
    if (box.days[day.id] === undefined || box.days[day.id] === true) box.days[day.id] = true;
  }
  await saveOutbox();
}

async function syncOnce() {
  if (!userId || !store) return;
  const mySession = session;
  const box = await getOutbox();
  setStatus({ state: 'saving', pending: outboxSize(box) });
  try {
    await uploadPendingPhotos(box, mySession);
    if (mySession !== session) return;
    const lastSyncedAt = await AsyncStorage.getItem(KEYS.lastSyncedAt);
    const changes = buildChanges(box, store.read());
    const hasChanges = outboxSize(box) > 0;
    // Nothing to send: just ask what changed. Otherwise send our changes too.
    const response = hasChanges
      ? await api<SyncResponse>('/sync', { method: 'POST', json: { lastSyncedAt, changes }, timeoutMs: 30_000 })
      : await api<SyncResponse>(`/sync?since=${encodeURIComponent(lastSyncedAt ?? '0')}`, { timeoutMs: 30_000 });
    if (mySession !== session) return; // logged out while we were waiting

    const merged = mergeRemote(store.read(), response, box);
    await store.write(merged, merged.changed);
    clearSent(box, changes, store.read(), response.rejected);
    await saveOutbox();
    await AsyncStorage.setItem(KEYS.lastSyncedAt, response.serverTime);
    setStatus({ state: 'idle', savedAt: new Date().toISOString(), pending: outboxSize(box), message: undefined });
  } catch (error) {
    if (mySession !== session) return;
    setStatus({ ...errorStatus(error), pending: outboxSize(box) });
  }
}

// ---------- Logout and account deletion (14.5) ----------

/** How many changes haven't reached the account yet. */
export async function pendingChanges() {
  return outboxSize(await getOutbox());
}

/**
 * Forgets everything sync knows about this account on this phone:
 * outbox, lastSyncedAt and owner. The caller clears the data and notifications.
 */
export async function forgetAccount() {
  session++;
  userId = null;
  if (timer) clearTimeout(timer);
  timer = null;
  outbox = emptyOutbox();
  accountReady = new Promise<void>((resolve) => (markAccountReady = resolve));
  await AsyncStorage.multiRemove(Object.values(KEYS)).catch(() => {});
  setStatus({ state: 'idle', savedAt: undefined, pending: 0, message: undefined, downloading: false, welcomeBack: false });
}
