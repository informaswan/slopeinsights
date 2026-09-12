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

const FEATURES = [
  { icon: '❄', label: 'Live snow depths & new-snow alerts' },
  { icon: '🚡', label: 'Real-time lift & trail status' },
  { icon: '👥', label: 'Crowd forecasts, hour by hour' },
  { icon: '📷', label: 'Live webcams from the mountain' },
];

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
      {/* Header wordmark */}
      <View style={styles.wordmark}>
        <View style={styles.wordmarkAccent} />
        <Text style={styles.appName}>PowderPass</Text>
      </View>

      {/* Tagline */}
      <Text style={styles.tagline}>45 Epic & Ikon resorts — snow, lifts, crowds, cams</Text>

      {/* Feature list */}
      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <View style={styles.featureIconBg}>
              <Text style={styles.featureIcon}>{f.icon}</Text>
            </View>
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Price block */}
      <View style={styles.priceBlock}>
        <View style={styles.priceLine}>
          <Text style={styles.priceAmount}>$4.99</Text>
          <Text style={styles.pricePeriod}> once</Text>
        </View>
        <Text style={styles.finePrint}>One-time purchase. No subscription.</Text>
      </View>

      {/* CTA */}
      <TouchableOpacity style={styles.unlockButton} onPress={handleUnlock} activeOpacity={0.85}>
        <Text style={styles.unlockText}>Unlock Full Access — $4.99</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: 72,
    paddingBottom: 52,
  },
  wordmark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  wordmarkAccent: {
    width: 4,
    height: 32,
    backgroundColor: Colors.snowBlue,
    borderRadius: 2,
  },
  appName: {
    fontSize: FontSize.hero,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -1.5,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  features: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureIcon: {
    fontSize: 18,
  },
  featureText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  priceBlock: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 4,
  },
  priceLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceAmount: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  pricePeriod: {
    fontSize: FontSize.md,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  finePrint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    letterSpacing: 0.2,
  },
  unlockButton: {
    backgroundColor: Colors.epic,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: Colors.epic,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  unlockText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
