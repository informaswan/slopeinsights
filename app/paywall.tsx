import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

const PURCHASE_KEY = 'powderpass_purchased';

/** Returns true if the user has purchased, or if the dev skip flag is set. */
export async function checkPurchased(): Promise<boolean> {
  if (process.env.EXPO_PUBLIC_SKIP_PAYWALL === 'true') return true;
  return (await AsyncStorage.getItem(PURCHASE_KEY)) === 'true';
}

/** Persist purchase so future launches skip the paywall. */
export async function markPurchased(): Promise<void> {
  await AsyncStorage.setItem(PURCHASE_KEY, 'true');
}

export default function PaywallScreen() {
  const router = useRouter();

  async function handleUnlock() {
    // TODO: Replace with real IAP before App Store submission.
    // Use expo-in-app-purchases (or RevenueCat) to purchase product
    // `com.yourcompany.powderpass.fullaccess`. Only call markPurchased()
    // after a confirmed successful transaction.
    await markPurchased();
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.appName}>PowderPass</Text>
        <Text style={styles.tagline}>45 Epic & Ikon resorts — snow, lifts, crowds, cams</Text>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock}>
          <Text style={styles.unlockText}>Unlock Full Access — $4.99</Text>
        </TouchableOpacity>
        <Text style={styles.finePrint}>One-time purchase. No subscription.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: 48 },
  content: { alignItems: 'center', gap: Spacing.md },
  appName: { fontSize: 36, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  tagline: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  footer: { alignItems: 'center', gap: Spacing.md },
  unlockButton: { width: '100%', paddingVertical: Spacing.md, borderRadius: Radius.lg, backgroundColor: Colors.epic, alignItems: 'center' },
  unlockText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
  finePrint: { fontSize: FontSize.xs, color: Colors.textMuted },
});
