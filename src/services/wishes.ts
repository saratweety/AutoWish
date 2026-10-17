import { differenceInCalendarDays } from 'date-fns';
import type { SpecialDay, Wish, WishStatus } from '../types';
import { nextOccurrence } from './dates';

/**
 * The status to show. A wish still "scheduled" after its send time has passed
 * was missed, so it shows as "Not sent" with a "Send now" button.
 */
export function displayStatus(wish: Wish, now = new Date()): WishStatus {
  if (wish.status === 'scheduled' && new Date(wish.sendAt) < now) return 'not_sent';
  return wish.status;
}

/**
 * The wish to show for a special day's next date: one still waiting to go out,
 * or else one already sent for this date (sent within the month before it, or on the day).
 * Wishes sent in earlier years don't count.
 */
export function wishForNextDate(day: SpecialDay, wishes: Wish[], now = new Date()) {
  const forDay = wishes.filter((w) => w.specialDayId === day.id);
  const waiting = forDay.find((w) => w.status !== 'sent');
  if (waiting) return waiting;
  const date = nextOccurrence(day, now);
  return forDay.find((w) => {
    if (w.status !== 'sent') return false;
    const daysBefore = differenceInCalendarDays(date, new Date(w.sentAt ?? w.sendAt));
    return daysBefore >= 0 && daysBefore <= 31;
  });
}
