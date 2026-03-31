import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { checkPurchased } from './paywall';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LightColors } from '../constants/theme';

function AppNavigator() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading: authLoading, savedResortIds } = useAuth();
  const [paywallChecking, setPaywallChecking] = useState(true);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    checkPurchased().then(setPurchased).finally(() => setPaywallChecking(false));
  }, []);

  if (paywallChecking || authLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator testID="layout-loading" size="large" color={colors.epic} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.headerGradientStart },
        headerTintColor: colors.headerText,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      {!purchased ? (
        <Stack.Screen testID="stack-paywall" name="paywall" options={{ headerShown: false }} />
      ) : !isAuthenticated ? (
        <Stack.Screen name="login" options={{ headerShown: false }} />
      ) : savedResortIds.length === 0 ? (
        <Stack.Screen name="onboarding" options={{ title: 'Pick Your Mountains' }} />
      ) : (
        <>
          <Stack.Screen testID="stack-index" name="index" options={{ headerShown: false }} />
          <Stack.Screen name="resort/[id]" options={{ headerBackTitle: 'Home' }} />
          <Stack.Screen name="explore" options={{ title: 'Explore Resorts' }} />
          <Stack.Screen name="profile" options={{ title: 'Profile' }} />
        </>
      )}
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
