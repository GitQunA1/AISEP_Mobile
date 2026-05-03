import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";

SplashScreen.preventAutoHideAsync();
import { AuthProvider, useAuth } from "../src/context/AuthContext";
import { ThemeProvider, useTheme } from "../src/context/ThemeContext";
import { SubscriptionProvider } from "../src/context/SubscriptionContext";
import { NotificationProvider } from "../src/context/NotificationContext";
import { useFonts } from "expo-font";
import { useEffect } from "react";
import { ThemeProvider as NavThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

function RootLayoutNav() {
  const { activeTheme, isDark } = useTheme();
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Let the splash screen or index handle loading
  }
  
  const customTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: activeTheme.colors.background,
      card: activeTheme.colors.background,
      text: activeTheme.colors.text,
      border: activeTheme.colors.border,
      primary: activeTheme.colors.primary,
    },
  };

  return (
    <NavThemeProvider value={customTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {/* Remove initialRouteName and let Expo Router use index.js, but order (tabs) first visually if needed */}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="startup/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="advisor/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="chat/[id]" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="subscription/management" options={{ presentation: 'card' }} />
      </Stack>
    </NavThemeProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    // Add custom fonts here if needed
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      const hideSplash = async () => {
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          console.warn('[RootLayout] SplashScreen.hideAsync failed:', e);
        }
      };
      hideSplash();
    }
  }, [loaded]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <NotificationProvider>
              <RootLayoutNav />
            </NotificationProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
