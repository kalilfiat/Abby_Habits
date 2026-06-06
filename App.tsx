/**
 * App entry — composition root.
 *
 * Waits for persisted state to hydrate, then either runs first-time onboarding
 * (ask the user's name) or the main navigation. The four architectural layers
 * (habit engine, mascot, data, UI) meet only here and in the store.
 */

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MASCOT } from './src/core/mascot';
import {
  ensureNotificationPermission,
  syncLocalNotifications,
} from './src/data/notifications';
import { useStore } from './src/store/useStore';
import { AbbyAvatar } from './src/ui/components/AbbyAvatar';
import { RootStackParamList } from './src/ui/navigation';
import { ChatScreen } from './src/ui/screens/ChatScreen';
import { HabitEditScreen } from './src/ui/screens/HabitEditScreen';
import { OnboardingScreen } from './src/ui/screens/OnboardingScreen';
import { NotificationsScreen } from './src/ui/screens/NotificationsScreen';
import { TodayScreen } from './src/ui/screens/TodayScreen';
import { ImmersiveSystemBars } from './src/ui/useImmersiveSystemUI';
import { useAppFonts } from './src/ui/useAppFonts';
import { colors, fontFamily } from './src/ui/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  const hydrated = useStore((s) => s.hydrated);
  const userName = useStore((s) => s.userName);
  const habits = useStore((s) => s.habits);
  const logs = useStore((s) => s.logs);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const fontsLoaded = useAppFonts();

  useEffect(() => {
    if (!hydrated || !userName) return;
    const run = async () => {
      if (notificationsEnabled && Platform.OS !== 'web') {
        await ensureNotificationPermission();
      }
      await syncLocalNotifications(habits, logs, userName, notificationsEnabled);
    };
    void run();
  }, [hydrated, userName, habits, logs, notificationsEnabled]);

  if (!hydrated || !fontsLoaded) {
    return (
      <View style={styles.loading}>
        <AbbyAvatar pose="hi" size={100} />
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ImmersiveSystemBars />
      {!userName ? (
        <OnboardingScreen />
      ) : (
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: colors.bg },
              headerShadowVisible: false,
              headerTintColor: colors.text,
              headerTitleStyle: {
                fontFamily: fontFamily.displaySemi,
                fontSize: 18,
                color: colors.heading,
              },
              contentStyle: { backgroundColor: colors.bg },
              animation: 'fade_from_bottom',
            }}
          >
            <Stack.Screen name="Today" component={TodayScreen} options={{ headerShown: false }} />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={{ title: `Hablá con ${MASCOT.name}`, headerBackTitle: 'Hoy' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationsScreen}
              options={{ title: 'Recordatorios', headerBackTitle: 'Hoy' }}
            />
            <Stack.Screen
              name="HabitEdit"
              component={HabitEditScreen}
              options={{ title: 'Ficha del hábito' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    overflow: 'hidden',
  },
});
