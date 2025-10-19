import { AuthProvider, useAuth } from '@/context/AuthContext';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import Toast from 'react-native-toast-message';
import "../../global.css";

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
    Inter: require('../assets/fonts/KoPubBatang-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

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
      <StatusBar style="auto" hidden />
      <Slot />
      <Toast />
    </>
  );
}
