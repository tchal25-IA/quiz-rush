import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { api } from '../src/api';
import { colors } from '../src/theme';

export default function LeaderboardScreen() {
  const [type, setType] = useState<'global' | 'weekly'>('global');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .leaderboard(type)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <Tab label="Global" active={type === 'global'} onPress={() => setType('global')} />
        <Tab label="Hebdo" active={type === 'weekly'} onPress={() => setType('weekly')} />
      </View>
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 8, paddingBottom: 40 }}>
          {rows.length === 0 ? (
            <Text style={styles.empty}>Aucun score pour l’instant — joue une partie !</Text>
          ) : (
            rows.map((r) => (
              <View key={r.userId} style={styles.row}>
                <Text style={styles.rank}>#{r.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{r.username}</Text>
                  <Text style={styles.muted}>Niv. {r.level}</Text>
                </View>
                <Text style={styles.score}>{r.score}</Text>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.tabText, active && { color: '#111' }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: { color: colors.primary, fontWeight: '900', width: 40 },
  name: { color: colors.text, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  score: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40 },
});
