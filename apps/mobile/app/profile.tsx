import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PublicUser } from '@quiz-rush/shared';
import { api } from '../src/api';
import { colors } from '../src/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([api.me(), api.missions()]);
      setUser(u);
      setMissions(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{user.username}</Text>
      <Text style={styles.muted}>{user.isGuest ? 'Compte invité' : 'Compte lié'}</Text>

      <View style={styles.card}>
        <Text style={styles.line}>Niveau {user.level} · {user.xp} XP</Text>
        <Text style={styles.line}>Gems : {user.gems}</Text>
        <Text style={styles.line}>Streak : {user.streak} jour(s)</Text>
        <Text style={styles.line}>Premium : {user.isPremium ? 'Oui' : 'Non (stub MVP)'}</Text>
      </View>

      <Text style={styles.section}>Jokers</Text>
      <View style={styles.card}>
        <Text style={styles.line}>50/50 : {user.jokers.fifty_fifty}</Text>
        <Text style={styles.line}>+5s : {user.jokers.time_bonus}</Text>
        <Text style={styles.line}>Communauté : {user.jokers.community}</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.btn}
          onPress={async () => {
            await api.refillJoker('fifty_fifty', 'ad');
            refresh();
          }}
        >
          <Text style={styles.btnText}>Pub → 50/50</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={async () => {
            await api.refillJoker('time_bonus', 'gems');
            refresh();
          }}
        >
          <Text style={styles.btnText}>100 gems → +5s</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Missions</Text>
      {missions.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.line}>{m.title}</Text>
          <Text style={styles.muted}>
            {m.description} · {m.progress}/{m.target}
            {m.completed ? ' ✅' : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted },
  section: { color: colors.primary, fontWeight: '800', fontSize: 16, marginTop: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  line: { color: colors.text, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
});
