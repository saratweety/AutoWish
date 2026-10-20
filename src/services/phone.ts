import { dialOf, DEFAULT_COUNTRY } from '../data/countries';

/** The dialling code used before anyone picks a country (Pakistan). */
export const DEFAULT_COUNTRY_CODE = dialOf(DEFAULT_COUNTRY);

/**
 * Cleans what's typed in the WhatsApp number box, which already shows the chosen
 * code (+92, +44, +1…) in front. Removes a country code the person typed or pasted
 * (+92, 92, 0092) and a leading 0, so "+92 300 1234567", "0092300...",
 * "0300-1234567" all become "3001234567".
 * Returns the cleaned digits and whether a country code was removed.
 */
export function cleanLocalNumber(typed: string, countryCode = DEFAULT_COUNTRY_CODE) {
  let digits = typed.replace(/\D/g, '');
  const before = digits;
  if (digits.startsWith('00' + countryCode)) digits = digits.slice(2 + countryCode.length);
  // The code in front is only treated as a country code once the number is long
  // enough to still be a real number without it. Local numbers are about 9 to 11
  // digits, so we need that many left over before we take the code off.
  else if (digits.startsWith(countryCode) && (typed.trim().startsWith('+') || digits.length >= countryCode.length + 9)) {
    digits = digits.slice(countryCode.length);
  }
  digits = digits.replace(/^0+/, '');
  return { digits, removedCode: digits.length > 0 && before.length - digits.length >= countryCode.length };
}

/**
 * Turns a phone number as saved in contacts ("0300-1234567", "+92 300 1234567",
 * "0092...") into the digits-only international form WhatsApp needs ("923001234567").
 * `countryCode` is the code to assume for a local-looking number with no code of its own.
 * Returns null if there are too few digits to be a real number.
 */
export function toWhatsAppNumber(raw: string, countryCode = DEFAULT_COUNTRY_CODE) {
  let digits = raw.replace(/\D/g, '');
  const hadPlus = raw.trim().startsWith('+');
  if (digits.startsWith('00')) digits = digits.slice(2); // 0092... -> 92...
  else if (!hadPlus && digits.startsWith('0')) digits = countryCode + digits.slice(1); // 0300... -> 92300...
  // A bare local number with no code and no leading 0: add the chosen country's code.
  else if (!hadPlus && digits.length <= 10 && !digits.startsWith(countryCode)) digits = countryCode + digits;
  return digits.length >= 10 ? digits : null;
}
