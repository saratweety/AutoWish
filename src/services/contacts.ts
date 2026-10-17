import { Contact, ContactField } from 'expo-contacts';
import type { Occasion } from '../types';
import { toWhatsAppNumber } from './phone';

export type ContactDay = {
  key: string;
  name: string;
  phone: string | null; // WhatsApp-ready number, or null if the contact has none
  occasion: Extract<Occasion, 'birthday' | 'anniversary'>;
  month: number;
  day: number;
  year?: number;
  photoUri?: string;
};

const FIELDS = [ContactField.FULL_NAME, ContactField.BIRTHDAY, ContactField.DATES, ContactField.PHONES, ContactField.THUMBNAIL] as const;

/**
 * Reads the phone's contacts and returns every birthday and anniversary saved in them.
 * Contacts without any of these dates are skipped.
 */
export async function loadContactDays(): Promise<ContactDay[]> {
  const contacts = await Contact.getAllDetails(FIELDS);
  const result: ContactDay[] = [];

  for (const c of contacts) {
    const name = c.fullName?.trim();
    if (!name) continue;
    const firstPhone = c.phones?.find((p) => p.number)?.number;
    const phone = firstPhone ? toWhatsAppNumber(firstPhone) : null;
    const photoUri = c.thumbnail ?? undefined;

    if (c.birthday?.month && c.birthday.day) {
      const { month, day, year } = c.birthday;
      result.push({ key: `${c.id}-birthday`, name, phone, occasion: 'birthday', month, day, year, photoUri });
    }
    // Anniversaries are saved as an extra date labelled "anniversary".
    const anniversary = c.dates?.find((d) => d.label?.toLowerCase().includes('anniversary') && d.date);
    if (anniversary?.date) {
      const { month, day, year } = anniversary.date;
      result.push({ key: `${c.id}-anniversary`, name, phone, occasion: 'anniversary', month, day, year, photoUri });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
