import type { Occasion, Relationship, RemindDays, SpecialDay, Tone } from '../types';

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
