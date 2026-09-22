import React from 'react';
import { StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { FavoritesProvider } from '../contexts/FavoritesContext';
import { AppShell } from '../components/AppShell';

function AppNavigator() {
  const { colors } = useTheme();

  return (
    <AppShell>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="mine" />
        <Stack.Screen name="road-cameras" />
        <Stack.Screen name="resort/[id]" />
        <Stack.Screen name="about" />
      </Stack>
    </AppShell>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider>
        <FavoritesProvider>
          <AppNavigator />
        </FavoritesProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
