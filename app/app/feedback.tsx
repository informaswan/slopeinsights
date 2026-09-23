import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet } from 'react-native';
import { api, type FeedbackPayload } from '../lib/api';
import { useTheme } from '../contexts/ThemeContext';
import { useIsWide } from '../hooks/useIsWide';
import { FontSize, Radius, Spacing } from '../constants/theme';

const CATEGORIES: { value: FeedbackPayload['category']; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'bug', label: 'Something is broken' },
  { value: 'data', label: 'Wrong data' },
  { value: 'other', label: 'Other' },
];

const MAX_LENGTH = 2000;
const noOutline = { outlineStyle: 'none', outlineWidth: 0 } as object;

type Status = 'idle' | 'sending' | 'sent' | 'error' | 'limited';

export default function FeedbackScreen() {
  const { colors } = useTheme();
  const isWide = useIsWide();
  const [category, setCategory] = useState<FeedbackPayload['category']>('idea');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [status, setStatus] = useState<Status>('idle');

  const canSend = message.trim().length >= 3 && status !== 'sending';

  const submit = async () => {
    if (!canSend) return;
    setStatus('sending');
    try {
      await api.sendFeedback({ category, message: message.trim(), email: email.trim() || undefined, website });
      setStatus('sent');
      setMessage('');
    } catch (e: any) {
      setStatus(e?.status === 429 ? 'limited' : 'error');
    }
  };

  const field = [styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }, noOutline];

  if (status === 'sent') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, padding: isWide ? Spacing.lg : Spacing.md }]}>
        <View style={styles.column}>
          <Text style={[styles.title, { color: colors.text }]}>Thanks, we got it</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            We read everything people send. If you left an email, we may write back.
          </Text>
          <Pressable
            accessibilityLabel="Send more feedback"
            onPress={() => setStatus('idle')}
            style={[styles.button, { borderColor: colors.epic }]}
          >
            <Text style={[styles.buttonText, { color: colors.epic }]}>Send more feedback</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[styles.root, { padding: isWide ? Spacing.lg : Spacing.md }]}
    >
      <View style={styles.column}>
        <Text style={[styles.title, { color: colors.text }]}>Feedback</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          Found something wrong, or want a mountain or feature added? Tell us. This goes straight to the people who build the site.
        </Text>

        <View style={styles.chips}>
          {CATEGORIES.map((c) => {
            const active = category === c.value;
            return (
              <Pressable
                key={c.value}
                accessibilityLabel={`Category: ${c.label}`}
                onPress={() => setCategory(c.value)}
                style={[styles.chip, { borderColor: active ? colors.epic : colors.border, backgroundColor: active ? colors.epicBg : colors.surface }]}
              >
                <Text style={[styles.chipText, { color: active ? colors.epic : colors.textSecondary }]}>{c.label}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInput
          accessibilityLabel="Your feedback"
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textMuted}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={MAX_LENGTH}
          style={[...field, styles.textarea]}
        />
        <Text style={[styles.count, { color: colors.textMuted }]}>{message.length}/{MAX_LENGTH}</Text>

        <TextInput
          accessibilityLabel="Your email (optional)"
          placeholder="Email (optional, only if you want a reply)"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={field}
        />

        {/* Honeypot: invisible to people, tempting to bots. */}
        <TextInput
          accessibilityLabel="Leave this field empty"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          value={website}
          onChangeText={setWebsite}
          autoComplete="off"
          tabIndex={-1}
          style={styles.honeypot}
        />

        <Pressable
          accessibilityLabel="Send feedback"
          disabled={!canSend}
          onPress={submit}
          style={[styles.send, { backgroundColor: colors.epic, opacity: canSend ? 1 : 0.5 }]}
        >
          <Text style={styles.sendText}>{status === 'sending' ? 'Sending…' : 'Send feedback'}</Text>
        </Pressable>

        {status === 'error' && (
          <Text style={[styles.error, { color: colors.crowdHigh }]}>Couldn't send that. Please try again in a moment.</Text>
        )}
        {status === 'limited' && (
          <Text style={[styles.error, { color: colors.crowdHigh }]}>You've sent a few already. Please try again in a bit.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flexGrow: 1 },
  column: { maxWidth: 620, width: '100%', gap: Spacing.sm },
  title: { fontSize: FontSize.xl, fontWeight: '700', letterSpacing: -0.4 },
  body: { fontSize: FontSize.md, lineHeight: 24 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.xs },
  chip: { borderWidth: 1, borderRadius: Radius.full, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.xs + 2 },
  chipText: { fontSize: FontSize.sm, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.sm + 2, paddingVertical: Spacing.sm, fontSize: FontSize.md },
  textarea: { minHeight: 140, textAlignVertical: 'top' },
  count: { fontSize: FontSize.xs, alignSelf: 'flex-end' },
  honeypot: { position: 'absolute', left: -10000, width: 1, height: 1, opacity: 0 },
  send: { borderRadius: Radius.md, paddingVertical: Spacing.sm + 2, alignItems: 'center', marginTop: Spacing.xs },
  sendText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  error: { fontSize: FontSize.sm },
  button: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2 },
  buttonText: { fontSize: FontSize.sm, fontWeight: '600' },
});
