import type { GiftRemindDays, Occasion, Relationship, RemindDays, SpecialDay, Tone } from '../types';

export const OCCASION_LABELS: Record<Occasion, string> = {
  birthday: 'Birthday',
  anniversary: 'Anniversary',
  mothers_day: "Mother's Day",
  fathers_day: "Father's Day",
  other: 'Other',
};

export const RELATIONSHIP_LABELS: Record<Relationship, string> = {
  friend: 'Friend',
  best_friend: 'Best friend',
  family: 'Family',
  wife: 'Wife',
  husband: 'Husband',
  girlfriend: 'Girlfriend',
  boyfriend: 'Boyfriend',
  colleague: 'Colleague',
};

/** The order relationship chips appear in. */
export const RELATIONSHIPS = Object.keys(RELATIONSHIP_LABELS) as Relationship[];

export const TONE_LABELS: Record<Tone, string> = {
  funny: 'Funny',
  emotional: 'Emotional',
  formal: 'Formal',
  urdu: 'Urdu',
};

export const REMIND_LABELS: Record<RemindDays, string> = {
  0: 'On the day',
  1: '1 day before',
  3: '3 days before',
  7: '1 week before',
  30: '1 month before',
};

/** The order reminder choices appear in. */
export const REMIND_CHOICES: RemindDays[] = [0, 1, 3, 7, 30];

/** How long before the day a "buy the gift" nudge can be set to. */
export const GIFT_REMIND_CHOICES: GiftRemindDays[] = [3, 5, 7, 14, 30];

export const GIFT_REMIND_LABELS: Record<GiftRemindDays, string> = {
  3: '3 days',
  5: '5 days',
  7: '1 week',
  14: '2 weeks',
  30: '1 month',
};

/** Short form for a list of reminders: "1 month, 1 week and 1 day before". */
export const REMIND_SHORT: Record<RemindDays, string> = {
  0: 'on the day',
  1: '1 day',
  3: '3 days',
  7: '1 week',
  30: '1 month',
};

/**
 * How a set of reminders reads in a sentence, earliest first:
 * [1] -> "1 day before", [7, 1, 0] -> "1 week and 1 day before, and on the day".
 */
export function remindSummary(choices: RemindDays[]) {
  if (choices.length === 0) return 'No reminder';
  const sorted = [...new Set(choices)].sort((a, b) => b - a);
  const onTheDay = sorted.includes(0);
  const before = sorted.filter((d) => d !== 0).map((d) => REMIND_SHORT[d]);
  if (before.length === 0) return 'On the day';
  const list = before.length === 1 ? before[0] : `${before.slice(0, -1).join(', ')} and ${before[before.length - 1]}`;
  return `${list} before${onTheDay ? ', and on the day' : ''}`;
}

/** "Birthday", or the custom name for "Other". */
export function occasionName(day: Pick<SpecialDay, 'occasion' | 'customOccasion'>) {
  if (day.occasion === 'other') return day.customOccasion?.trim() || 'Special day';
  return OCCASION_LABELS[day.occasion];
}

/** The occasion as it reads mid-sentence: "birthday", "anniversary", "Father's Day". */
export function occasionWord(day: Pick<SpecialDay, 'occasion' | 'customOccasion'>) {
  const name = occasionName(day);
  return day.occasion === 'birthday' || day.occasion === 'anniversary' ? name.toLowerCase() : name;
}

/** "Ahmed's birthday", "Ammi and Abbu's anniversary", "Abbu's Father's Day". */
export function possessiveOccasion(day: Pick<SpecialDay, 'name' | 'occasion' | 'customOccasion'>) {
  return `${day.name}'s ${occasionWord(day)}`;
}

/** 1st, 2nd, 3rd, 4th ... 11th, 12th, 13th ... 21st */
export function ordinal(n: number) {
  const teens = n % 100 >= 11 && n % 100 <= 13;
  const suffix = teens ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ?? 'th';
  return `${n}${suffix}`;
}

/**
 * What the day means this time round, when the year is known:
 * "turns 25" for a birthday, "25th anniversary" for an anniversary.
 * Undefined when no year was saved, or for days where a count makes no sense
 * (Mother's Day, Father's Day, "Other").
 *
 * `on` is the date it next falls on, so the number is right in December and January.
 */
export function milestone(day: Pick<SpecialDay, 'occasion' | 'year'>, on: Date) {
  if (!day.year) return undefined;
  const years = on.getFullYear() - day.year;
  if (years <= 0) return undefined;
  if (day.occasion === 'birthday') return `turns ${years}`;
  if (day.occasion === 'anniversary') return `${ordinal(years)} anniversary`;
  return undefined;
}
