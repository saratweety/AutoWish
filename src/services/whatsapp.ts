import { Linking } from 'react-native';

/**
 * Opens the WhatsApp chat with this number and the message already typed.
 * The person still taps Send in WhatsApp (Apple and Google don't allow apps to send for you).
 * Returns false if it couldn't be opened.
 */
export async function openWhatsApp(phone: string, text: string) {
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  try {
    await Linking.openURL(url);
    return true;
  } catch {
    return false;
  }
}
