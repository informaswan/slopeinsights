import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { checkPurchased } from './paywall';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  const [checking, setChecking] = useState(true);
  const [purchased, setPurchased] = useState(false);

  useEffect(() => {
    checkPurchased().then(setPurchased).finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator testID="layout-loading" size="large" color={Colors.epic} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <Stack>
        {purchased ? (
          <>
            <Stack.Screen testID="stack-index" name="index" options={{ title: 'PowderPass', headerLargeTitle: true }} />
            <Stack.Screen name="resort/[id]" options={{ headerBackTitle: 'Resorts' }} />
          </>
        ) : (
          <Stack.Screen testID="stack-paywall" name="paywall" options={{ headerShown: false }} />
        )}
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});
