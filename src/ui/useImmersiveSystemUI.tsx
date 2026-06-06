/**
 * Hides OS status bar (time, battery) and Android navigation buttons so the app
 * uses the full screen. Safe areas (notch, home indicator) stay via insets in screens.
 */

import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

const isNativeMobile = Platform.OS === 'ios' || Platform.OS === 'android';

function applyImmersive() {
  StatusBar.setHidden(true);
  if (Platform.OS === 'android') {
    NavigationBar.setHidden(true);
  }
}

/** Re-applies immersive mode when returning from background (OS may restore bars). */
export function useImmersiveSystemUI() {
  useEffect(() => {
    if (!isNativeMobile) return;
    applyImmersive();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyImmersive();
    });
    return () => sub.remove();
  }, []);
}

/** Mount once at the app root. Web keeps a normal status bar (N/A in browser chrome). */
export function ImmersiveSystemBars() {
  useImmersiveSystemUI();

  if (!isNativeMobile) {
    return <StatusBar style="dark" />;
  }

  return (
    <>
      <StatusBar hidden />
      {Platform.OS === 'android' ? <NavigationBar hidden /> : null}
    </>
  );
}
