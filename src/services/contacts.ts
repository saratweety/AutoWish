import { Contact, ContactField } from 'expo-contacts';
import { toWhatsAppNumber } from './phone';

export type ContactPhone = {
  key: string;
  name: string;
  phone: string; // WhatsApp-ready number with country code, e.g. "923001234567"
  label?: string; // "mobile", "work"...
  photoUri?: string;
};

const PHONE_FIELDS = [ContactField.FULL_NAME, ContactField.PHONES, ContactField.THUMBNAIL] as const;

/**
 * Reads every contact that has a phone number. A contact with two numbers
 * shows up twice, once per number, so the right one can be picked.
 *
 * `countryCode` is the dialling code to assume for a number saved without one
 * (e.g. "0300 1234567"), which is the country the person chose in the number box.
 */
export async function loadContactPhones(countryCode?: string): Promise<ContactPhone[]> {
  const contacts = await Contact.getAllDetails(PHONE_FIELDS);
  const result: ContactPhone[] = [];

  for (const c of contacts) {
    const name = c.fullName?.trim();
    if (!name) continue;
    const seen = new Set<string>();
    for (const p of c.phones ?? []) {
      const phone = p.number ? toWhatsAppNumber(p.number, countryCode) : null;
      // Skip numbers that are too short, and the same number saved twice.
      if (!phone || seen.has(phone)) continue;
      seen.add(phone);
      result.push({ key: `${c.id}-${phone}`, name, phone, label: p.label, photoUri: c.thumbnail ?? undefined });
    }
  }
  return result.sort((a, b) => a.name.localeCompare(b.name));
}
