import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import type { PublicUser } from '@quiz-rush/shared';
import { DUEL_MIN_LEVEL } from '@quiz-rush/shared';
import { api } from '../src/api';
import { colors } from '../src/theme';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const boot = useCallback(async () => {
    try {
      setError(null);
      const auth = await api.ensureGuest();
      setUser(auth.user);
      const cats = await api.categories();
      setCategories(cats);
    } catch (e: any) {
      setError(e.message ?? 'Impossible de joindre l’API');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    boot();
  }, [boot]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.muted}>Connexion…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <Text style={styles.muted}>Lance l’API : npm run dev:api</Text>
        <Pressable style={styles.cta} onPress={() => { setLoading(true); boot(); }}>
          <Text style={styles.ctaText}>Réessayer</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>Quiz Rush</Text>
      <Text style={styles.tagline}>Le TikTok de la connaissance</Text>

      <View style={styles.stats}>
        <Stat label="Niv." value={String(user?.level ?? 1)} />
        <Stat label="XP" value={String(user?.xp ?? 0)} />
        <Stat label="Gems" value={String(user?.gems ?? 0)} />
        <Stat label="Streak" value={String(user?.streak ?? 0)} />
      </View>

      <Text style={styles.section}>Catégories</Text>
      {categories.map((cat) => (
        <Pressable
          key={cat.id}
          style={[styles.cat, { borderLeftColor: cat.color }]}
          onPress={() => router.push({ pathname: '/quiz', params: { categoryId: cat.id, name: cat.name } })}
        >
          <Text style={styles.catIcon}>{cat.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.muted}>10 questions · 3 min</Text>
          </View>
          <Text style={styles.play}>JOUER</Text>
        </Pressable>
      ))}

      <View style={styles.row}>
        <NavBtn
          label="Duel"
          locked={(user?.level ?? 1) < DUEL_MIN_LEVEL}
          hint={`Niv. ${DUEL_MIN_LEVEL}+`}
          onPress={() => router.push('/duel')}
        />
        <Link href="/leaderboard" asChild>
          <Pressable style={styles.navBtn}>
            <Text style={styles.navText}>Classements</Text>
          </Pressable>
        </Link>
        <Link href="/profile" asChild>
          <Pressable style={styles.navBtn}>
            <Text style={styles.navText}>Profil</Text>
          </Pressable>
        </Link>
      </View>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.muted}>{label}</Text>
    </View>
  );
}

function NavBtn({
  label,
  onPress,
  locked,
  hint,
}: {
  label: string;
  onPress: () => void;
  locked?: boolean;
  hint?: string;
}) {
  return (
    <Pressable
      style={[styles.navBtn, locked && { opacity: 0.45 }]}
      onPress={locked ? undefined : onPress}
    >
      <Text style={styles.navText}>{label}</Text>
      {locked && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  brand: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: -1 },
  tagline: { color: colors.muted, marginBottom: 8, fontSize: 16 },
  stats: { flexDirection: 'row', gap: 8, marginVertical: 8 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { color: colors.text, fontWeight: '800', fontSize: 18 },
  section: { color: colors.text, fontWeight: '700', fontSize: 18, marginTop: 12 },
  cat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 14,
    borderLeftWidth: 4,
    borderColor: colors.border,
  },
  catIcon: { fontSize: 28 },
  catName: { color: colors.text, fontWeight: '700', fontSize: 16 },
  play: { color: colors.primary, fontWeight: '800' },
  muted: { color: colors.muted, fontSize: 13 },
  row: { flexDirection: 'row', gap: 8, marginTop: 16 },
  navBtn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  navText: { color: colors.text, fontWeight: '700' },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4 },
  cta: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  ctaText: { color: '#111', fontWeight: '800' },
  error: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
});
