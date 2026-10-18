import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AccountProvider } from './src/auth/AccountProvider';
import { RootNavigator } from './src/navigation/RootNavigator';
import { setUpNotificationDisplay } from './src/services/notifications';
import { startListeningForTaps } from './src/services/notificationTaps';
import { AppProvider } from './src/state/AppContext';
import { fontAssets } from './src/theme';

// Keep the native splash (gift on off-white) visible until the fonts are ready,
// so text never flashes in the wrong font.
SplashScreen.preventAutoHideAsync();
setUpNotificationDisplay();
startListeningForTaps();

export default function App() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AccountProvider>
        <AppProvider>
          <RootNavigator />
        </AppProvider>
      </AccountProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
