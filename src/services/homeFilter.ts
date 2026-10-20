import { RELATIONSHIP_LABELS } from '../data/labels';
import type { Relationship, SpecialDay } from '../types';

/**
 * Which filter chip is picked on Home. Saved on this phone only (never synced),
 * because it's a view choice, not data about a person.
 *
 * 'all'          = show everyone
 * 'rel:friend'   = only people whose relationship is Friend
 * 'group:<id>'   = only people in that group (added in milestone B)
 */
export type HomeFilter = 'all' | `rel:${Relationship}` | `group:${string}`;

export const ALL_FILTER: HomeFilter = 'all';

/** The filter token for a relationship, e.g. 'rel:best_friend'. */
export const relFilter = (relationship: Relationship): HomeFilter => `rel:${relationship}`;

/** Does this person belong under this filter? */
export function matchesFilter(day: SpecialDay, filter: HomeFilter) {
  if (filter === ALL_FILTER) return true;
  if (filter.startsWith('rel:')) return day.relationship === filter.slice(4);
  return false;
}

/** Anything we don't understand (an old or removed filter) becomes "All". */
export function readFilter(saved: unknown): HomeFilter {
  if (typeof saved !== 'string') return ALL_FILTER;
  if (saved === ALL_FILTER || saved.startsWith('rel:') || saved.startsWith('group:')) return saved as HomeFilter;
  return ALL_FILTER;
}

/** How the picked filter reads in the "Showing ..." line, e.g. "Best friend". */
export function filterLabel(filter: HomeFilter) {
  if (filter.startsWith('rel:')) return RELATIONSHIP_LABELS[filter.slice(4) as Relationship] ?? 'All';
  return 'All';
}
