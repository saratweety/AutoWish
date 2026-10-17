// Sample people and wishes for testing. Added only when you tap
// Settings > "Add sample people"; a new user starts with nothing.
import { addDays, startOfDay, subDays } from 'date-fns';
import { newId } from '../state/AppContext';
import { nextOccurrence } from '../services/dates';
import type { SpecialDay, Wish } from '../types';

export function makeSampleData(): { days: SpecialDay[]; wishes: Wish[] } {
  const today = startOfDay(new Date());
  const created = new Date().toISOString();

  /** Month and day `offset` days from today, so the countdowns always look right. */
  const inDays = (offset: number) => {
    const d = addDays(today, offset);
    return { month: d.getMonth() + 1, day: d.getDate() };
  };

  const person = (name: string, rest: Omit<SpecialDay, 'id' | 'name' | 'phone' | 'createdAt'>): SpecialDay => ({
    id: newId(),
    name,
    phone: '923001234567',
    createdAt: created,
    ...rest,
  });

  const ahmed = person('Ahmed', { occasion: 'birthday', ...inDays(0), relationship: 'friend', remindDaysBefore: 1 });
  const parents = person('Ammi and Abbu', { occasion: 'anniversary', ...inDays(3), relationship: 'family', remindDaysBefore: 3 });
  const sara = person('Sara', { occasion: 'birthday', ...inDays(9), relationship: 'friend', remindDaysBefore: 1 });
  const abbu = person('Abbu', { occasion: 'fathers_day', month: 6, day: 1, relationship: 'family', remindDaysBefore: 7 });
  const zainab = person('Zainab', { occasion: 'birthday', ...inDays(-14), relationship: 'colleague', remindDaysBefore: 1 });
  const usman = person('Usman', { occasion: 'birthday', ...inDays(-18), relationship: 'friend', remindDaysBefore: 1 });

  const wish = (day: SpecialDay, rest: Omit<Wish, 'id' | 'specialDayId'>): Wish => ({ id: newId(), specialDayId: day.id, ...rest });

  return {
    days: [ahmed, parents, sara, abbu, zainab, usman],
    wishes: [
      wish(ahmed, {
        tone: 'funny',
        status: 'scheduled',
        // Later today, so it still shows as Scheduled.
        sendAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        text: 'Happy birthday Ahmed! Wishing you a year full of laughter, good health and big wins. Have the best day!',
      }),
      wish(parents, {
        tone: 'emotional',
        status: 'scheduled',
        sendAt: nextOccurrence(parents).toISOString(),
        text: 'Happy anniversary Ammi and Abbu! Thank you for showing us what love looks like.',
      }),
      wish(zainab, {
        tone: 'formal',
        status: 'sent',
        sendAt: subDays(today, 14).toISOString(),
        sentAt: subDays(today, 14).toISOString(),
        text: 'Happy birthday Zainab! Wishing you a wonderful year ahead.',
      }),
      // Send time passed without being sent, so it shows as "Not sent".
      wish(usman, { tone: 'urdu', status: 'scheduled', sendAt: subDays(today, 18).toISOString(), text: 'Saalgirah mubarak ho, Usman!' }),
    ],
  };
}
