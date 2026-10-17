import type { Wish, WishStatus } from '../types';

/**
 * The status to show. A wish still "scheduled" after its send time has passed
 * was missed, so it shows as "Not sent" with a "Send now" button.
 */
export function displayStatus(wish: Wish, now = new Date()): WishStatus {
  if (wish.status === 'scheduled' && new Date(wish.sendAt) < now) return 'not_sent';
  return wish.status;
}
