import { addDays, addHours, differenceInCalendarDays, startOfDay, subDays } from 'date-fns';
import { milestone, possessiveOccasion } from '../data/labels';
import type { Settings, SpecialDay } from '../types';
import { nextOccurrence, withTime } from './dates';

// Working out WHEN to remind and WHAT it says. Kept apart from notifications.ts,
// which talks to the phone, so this date maths can be read and tested on its own.

/** "today", "tomorrow", "in 3 days", "in a week". */
export function whenText(daysAway: number) {
  if (daysAway <= 0) return 'today';
  if (daysAway === 1) return 'tomorrow';
  if (daysAway === 7) return 'in a week';
  if (daysAway === 30) return 'in a month';
  return `in ${daysAway} days`;
}

/** One reminder: when it goes off, and how far from the day that is. */
export type Reminder = { at: Date; daysAway: number };

/**
 * Every reminder still to come for a special day, soonest first.
 *
 * A person can be set to remind more than once (say a week before, the day before
 * and on the day), so this returns one entry per choice that hasn't passed yet.
 * If they have all passed (for example the day was added late), it falls back to
 * reminding on the day itself; if that has gone too, it uses next year's date.
 */
export function nextReminders(day: SpecialDay, settings: Settings, now = new Date()): Reminder[] {
  // "Remind me later" was tapped: that one time replaces the lot.
  if (day.remindLaterAt && new Date(day.remindLaterAt) > now) {
    const at = new Date(day.remindLaterAt);
    return [{ at, daysAway: differenceInCalendarDays(nextOccurrence(day, at), startOfDay(at)) }];
  }
  // This person's own reminder time, or the default from Settings.
  const time = reminderTimeFor(day, settings);
  // Largest first so they are scheduled soonest-first, and never the same day twice.
  const choices = [...new Set(day.remindDaysBefore)].sort((a, b) => b - a);
  let occurrence = nextOccurrence(day, now);
  for (let year = 0; year < 2; year++) {
    const due = choices
      .map((daysAway) => ({ at: withTime(subDays(occurrence, daysAway), time), daysAway: daysAway as number }))
      .filter((r) => r.at > now);
    if (due.length > 0) return due;
    // Nothing left for this date: at least say something on the day itself.
    const onTheDay = withTime(occurrence, time);
    if (onTheDay > now) return [{ at: onTheDay, daysAway: 0 }];
    occurrence = nextOccurrence(day, addDays(occurrence, 1));
  }
  return [];
}

/** The reminder time for one person: their own if set, otherwise the default. */
export function reminderTimeFor(day: SpecialDay, settings: Settings) {
  return day.reminderTime ?? settings.reminderTimeOfDay;
}

/** When "Remind me later" should remind again: on the day at the reminder time, or in 2 hours if that has passed. */
export function remindLaterTime(day: SpecialDay, settings: Settings, now = new Date()) {
  const onTheDay = withTime(nextOccurrence(day, now), reminderTimeFor(day, settings));
  return onTheDay > now ? onTheDay : addHours(now, 2);
}

/**
 * What a reminder says. With a year saved it leads with the milestone, because
 * "Ahmed turns 25 tomorrow" is worth more than "Ahmed's birthday is tomorrow".
 */
export function reminderText(day: SpecialDay, daysAway: number, on: Date) {
  const turns = milestone(day, on);
  // "Ahmed turns 26 tomorrow!" / "Ammi and Abbu's 25th anniversary is today!"
  if (turns && day.occasion === 'birthday') return `${day.name} ${turns} ${whenText(daysAway)}!`;
  if (turns) return `${day.name}'s ${turns} is ${whenText(daysAway)}!`;
  return `${possessiveOccasion(day)} is ${whenText(daysAway)}!`;
}

