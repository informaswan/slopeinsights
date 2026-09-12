import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../contexts/AuthContext';
import { MountainLogo } from '../components/MountainLogo';
import { LightColors, Spacing, FontSize, Radius } from '../constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { signInDev, signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasGoogleCreds = !!process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
  const googleAuthResult = hasGoogleCreds
    ? Google.useIdTokenAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      })
    : [null, null, () => {}];
  const [, googleResponse, googlePromptAsync] = googleAuthResult;

  React.useEffect(() => {
    if (hasGoogleCreds && googleResponse?.type === 'success') {
      const idToken = googleResponse.params.id_token;
      setLoading(true);
      signInWithGoogle(idToken)
        .catch(() => setError('Google sign-in failed'))
        .finally(() => setLoading(false));
    }
  }, [googleResponse, hasGoogleCreds, signInWithGoogle]);

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'web') {
      setError('Apple Sign-In is not available on web');
      return;
    }
    try {
      setLoading(true);
      const AppleAuth = require('expo-apple-authentication');
      const credential = await AppleAuth.signInAsync({
        requestedScopes: [
          AppleAuth.AppleAuthenticationScope.FULL_NAME,
          AppleAuth.AppleAuthenticationScope.EMAIL,
        ],
      });
      const name = credential.fullName
        ? `${credential.fullName.givenName ?? ''} ${credential.fullName.familyName ?? ''}`.trim()
        : undefined;
      await signInWithApple(credential.identityToken!, name || undefined);
    } catch {
      setError('Apple sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[LightColors.headerGradientStart, LightColors.headerGradientEnd, LightColors.background]}
      locations={[0, 0.4, 1]}
      style={styles.container}
    >
      <View style={styles.logoArea}>
        <MountainLogo size={64} color="#fff" snowColor="#BAE6FD" />
        <Text style={styles.wordmark}>SlopeInsights</Text>
        <Text style={styles.tagline}>Real-time ski conditions at a glance</Text>
      </View>

      <View style={styles.buttonArea}>
        {loading ? (
          <ActivityIndicator size="large" color={LightColors.headerGradientStart} />
        ) : (
          <>
            {hasGoogleCreds && (
              <Pressable style={styles.googleButton} onPress={() => googlePromptAsync()}>
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>
            )}

            {Platform.OS !== 'web' && (
              <Pressable style={styles.appleButton} onPress={handleAppleSignIn}>
                <Text style={styles.appleText}>Continue with Apple</Text>
              </Pressable>
            )}

            <Pressable
              style={styles.devButton}
              onPress={async () => {
                setLoading(true);
                setError(null);
                try { await signInDev(); }
                catch { setError('Dev sign-in failed — is the backend running?'); }
                finally { setLoading(false); }
              }}
            >
              <Text style={styles.devText}>Dev Login (no auth)</Text>
            </Pressable>
          </>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      <Text style={styles.terms}>
        By continuing, you agree to SlopeInsights Terms of Service and Privacy Policy
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg },
  logoArea: { alignItems: 'center', marginBottom: Spacing.xxl },
  wordmark: { color: '#fff', fontSize: 28, fontWeight: '800', marginTop: Spacing.md, letterSpacing: -0.5 },
  tagline: { color: '#a8d4f0', fontSize: FontSize.md, marginTop: Spacing.xs },
  buttonArea: { width: '100%', maxWidth: 320, gap: Spacing.md },
  googleButton: {
    backgroundColor: '#fff', borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  googleText: { fontSize: FontSize.md, fontWeight: '600', color: '#1a1a2e' },
  appleButton: {
    backgroundColor: '#000', borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  appleText: { fontSize: FontSize.md, fontWeight: '600', color: '#fff' },
  devButton: {
    backgroundColor: 'transparent', borderRadius: Radius.lg, padding: Spacing.md,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  devText: { fontSize: FontSize.sm, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  errorText: { color: '#ef4444', fontSize: FontSize.sm, textAlign: 'center', marginTop: Spacing.sm },
  terms: { color: '#7a9cc6', fontSize: FontSize.xs, textAlign: 'center', marginTop: Spacing.lg, maxWidth: 280 },
});
