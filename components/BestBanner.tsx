import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { ResortSummary } from '../lib/types';
import { Colors, Spacing, FontSize, Radius } from '../constants/theme';

interface Props { resorts: ResortSummary[]; }

export function BestBanner({ resorts }: Props) {
  const router = useRouter();
  if (resorts.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Best Conditions Today</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {resorts.map((r) => {
          const passColor = r.pass_type === 'epic' ? Colors.epic : Colors.ikon;
          const passLabel = r.pass_type === 'epic' ? 'EPIC' : 'IKON';
          const snow24h = r.snow?.new_24h_in;
          return (
            <Pressable key={r.id} style={[styles.card, { borderColor: passColor }]} onPress={() => router.push(`/resort/${r.id}`)}>
              <Text style={styles.name} numberOfLines={2}>{r.name}</Text>
              <Text style={styles.snow}>{snow24h != null ? `${snow24h}"` : 'No snow data'}</Text>
              <View style={[styles.passBadge, { backgroundColor: passColor }]}>
                <Text style={styles.passLabel}>{passLabel}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: Spacing.sm },
  heading: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginHorizontal: Spacing.md, marginBottom: Spacing.sm },
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.sm },
  card: { width: 130, backgroundColor: Colors.surface, borderRadius: Radius.md, borderWidth: 2, padding: Spacing.sm, gap: Spacing.xs },
  name: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  snow: { fontSize: FontSize.md, fontWeight: '700', color: Colors.snowBlue },
  passBadge: { borderRadius: Radius.sm, paddingHorizontal: Spacing.xs, paddingVertical: 2, alignSelf: 'flex-start' },
  passLabel: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
});
