import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { api } from '../src/api';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function LeaderboardScreen() {
  const [type, setType] = useState<'global' | 'weekly'>('global');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .leaderboard(type)
      .then(setRows)
      .finally(() => setLoading(false));
  }, [type]);

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TapButton
          style={{ ...styles.tab, ...(type === 'global' ? styles.tabOn : null) }}
          onPress={() => setType('global')}
        >
          <Text style={styles.tabText}>Global</Text>
        </TapButton>
        <TapButton
          style={{ ...styles.tab, ...(type === 'weekly' ? styles.tabOn : null) }}
          onPress={() => setType('weekly')}
        >
          <Text style={styles.tabText}>Hebdo</Text>
        </TapButton>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} />
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
      {!loading && rows.length === 0 ? (
        <Text style={styles.muted}>Aucun score pour l’instant — lance une partie !</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 8 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  tab: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabOn: { borderColor: colors.primary },
  tabText: { color: colors.text, fontWeight: '700' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: { color: colors.primary, fontWeight: '900', width: 36 },
  name: { color: colors.text, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12 },
  score: { color: colors.accent, fontWeight: '800' },
});
