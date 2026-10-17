import { useNavigation } from '@react-navigation/native';
import { AppState } from 'react-native';
import { openWhatsApp } from '../services/whatsapp';
import type { Wish } from '../types';
import { useApp } from './AppContext';

/**
 * Opens WhatsApp with the wish ready to send. When the person comes back to
 * AutoWish, it asks "Did you send it?". If WhatsApp can't be opened, it shows
 * a friendly message instead.
 */
export function useSendWish() {
  const navigation = useNavigation();
  const { specialDays } = useApp();

  return async (wish: Wish) => {
    const day = specialDays.find((d) => d.id === wish.specialDayId);
    if (!day) return;

    const opened = await openWhatsApp(day.phone, wish.text);
    if (!opened) {
      navigation.navigate('SendConfirm', { wishId: wish.id, failed: true });
      return;
    }

    // Wait until the person switches back from WhatsApp to AutoWish.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      subscription.remove();
      navigation.navigate('SendConfirm', { wishId: wish.id });
    });
  };
}
