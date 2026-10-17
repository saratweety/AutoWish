export const DEFAULT_COUNTRY_CODE = '92'; // Pakistan

/**
 * Cleans what's typed in the WhatsApp number box, which already shows +92 in front.
 * Removes a country code the person typed or pasted (+92, 92, 0092) and a leading 0,
 * so "+92 300 1234567", "0092300...", "0300-1234567" all become "3001234567".
 * Returns the cleaned digits and whether a country code was removed.
 */
export function cleanLocalNumber(typed: string, countryCode = DEFAULT_COUNTRY_CODE) {
  let digits = typed.replace(/\D/g, '');
  const before = digits;
  if (digits.startsWith('00' + countryCode)) digits = digits.slice(2 + countryCode.length);
  // "92" in front is only treated as the country code once the number is long enough
  // to include it (a full Pakistani mobile number is 10 digits without it).
  else if (digits.startsWith(countryCode) && (typed.trim().startsWith('+') || digits.length >= 12)) {
    digits = digits.slice(countryCode.length);
  }
  digits = digits.replace(/^0+/, '');
  return { digits, removedCode: digits.length > 0 && before.length - digits.length >= countryCode.length };
}

/**
 * Turns a phone number as saved in contacts ("0300-1234567", "+92 300 1234567",
 * "0092...") into the digits-only international form WhatsApp needs ("923001234567").
 * Returns null if there are too few digits to be a real number.
 */
export function toWhatsAppNumber(raw: string, countryCode = DEFAULT_COUNTRY_CODE) {
  let digits = raw.replace(/\D/g, '');
  const hadPlus = raw.trim().startsWith('+');
  if (digits.startsWith('00')) digits = digits.slice(2); // 0092... -> 92...
  else if (!hadPlus && digits.startsWith('0')) digits = countryCode + digits.slice(1); // 0300... -> 92300...
  else if (!hadPlus && digits.length === 10 && digits.startsWith('3')) digits = countryCode + digits; // 300... -> 92300...
  return digits.length >= 10 ? digits : null;
}
