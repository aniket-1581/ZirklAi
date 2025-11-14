import { AuthProvider, useAuth } from '@/context/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Slot, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import "../../global.css";
import { initMixpanel, track } from '@/lib/mixpanel';

// Prevent auto-hide until we say so
SplashScreen.preventAutoHideAsync();

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(protected)',
};

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter: require('../assets/fonts/Inter_18pt-Regular.ttf'),
    ...FontAwesome.font,
  });
  const segments = useSegments();

  useEffect(() => {
    const screenName = segments.join('/');
    if (screenName) {
      track("Screen View", { screen: screenName });
    }
  }, [segments]);

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  useEffect(() => {
    initMixpanel();
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

function AppLayout() {
  const { ready } = useAuth();

  if (!ready) {
    return null; // Or <SplashScreen />
  }

  return (
    <>
      <StatusBar hidden />
      <Slot />
      <Toast />
    </>
  );
}
