import { differenceInCalendarDays, format, getDaysInMonth, startOfDay } from 'date-fns';
import type { SpecialDay } from '../types';

/** The nth Sunday of a month. monthIndex is 0-based (4 = May). */
export function nthSunday(year: number, monthIndex: number, n: number) {
  const first = new Date(year, monthIndex, 1);
  // How many days from the 1st until the first Sunday (Sunday = 0).
  const toFirstSunday = (7 - first.getDay()) % 7;
  return new Date(year, monthIndex, 1 + toFirstSunday + 7 * (n - 1));
}

/** The date this special day falls on in a given year. */
export function dateInYear(day: Pick<SpecialDay, 'occasion' | 'month' | 'day'>, year: number) {
  // Mother's Day is the 2nd Sunday of May, Father's Day the 3rd Sunday of June,
  // so they move every year.
  if (day.occasion === 'mothers_day') return nthSunday(year, 4, 2);
  if (day.occasion === 'fathers_day') return nthSunday(year, 5, 3);
  // A 29 Feb birthday is celebrated on 28 Feb in years without a 29th.
  const daysInMonth = getDaysInMonth(new Date(year, day.month - 1, 1));
  return new Date(year, day.month - 1, Math.min(day.day, daysInMonth));
}

/** The next time this day comes round: this year if it hasn't passed yet (today counts), else next year. */
export function nextOccurrence(day: Pick<SpecialDay, 'occasion' | 'month' | 'day'>, from = new Date()) {
  const today = startOfDay(from);
  const thisYear = dateInYear(day, today.getFullYear());
  return thisYear >= today ? thisYear : dateInYear(day, today.getFullYear() + 1);
}

export function daysUntil(day: Pick<SpecialDay, 'occasion' | 'month' | 'day'>, from = new Date()) {
  return differenceInCalendarDays(nextOccurrence(day, from), startOfDay(from));
}

/** Text for the orange countdown badge. */
export function countdownLabel(days: number) {
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  return `${days} days`;
}

export const formatShortDate = (d: Date) => format(d, 'd MMM'); // 17 Oct
export const formatLongDate = (d: Date) => format(d, 'd MMMM'); // 17 October
export const formatTime = (d: Date) => format(d, 'h:mm a'); // 12:00 AM

/** The same day at a "HH:mm" time, e.g. withTime(day, "00:00") = 12:00 AM that day. */
export function withTime(date: Date, hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

/** "00:00" -> "12:00 AM" */
export const formatClock = (hhmm: string) => formatTime(withTime(new Date(), hhmm));

/** Today as "yyyy-MM-dd" in the phone's own time zone, e.g. for "played the game today". */
export const todayKey = (d = new Date()) => format(d, 'yyyy-MM-dd');

/** The streak after playing today: one more if the last play was yesterday, otherwise a fresh 1. */
export function nextStreak(lastPlayed: string | undefined, streak: number, today = new Date()) {
  if (!lastPlayed) return 1;
  if (lastPlayed === todayKey(today)) return Math.max(1, streak);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return lastPlayed === todayKey(yesterday) ? streak + 1 : 1;
}
