import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { PublicUser } from '@quiz-rush/shared';
import { DUEL_MIN_LEVEL } from '@quiz-rush/shared';
import { api } from '../src/api';
import { analytics } from '../src/analytics';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function HomeScreen() {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const boot = useCallback(async () => {
    try {
      setError(null);
      const auth = await api.ensureGuest();
      setUser(auth.user);
      setShowOnboarding(!!auth.user.isGuest);
      const cats = await api.categories();
      setCategories(cats);
      analytics.track('app_open', { isGuest: auth.user.isGuest, level: auth.user.level });
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
        <TapButton
          style={styles.cta}
          onPress={() => {
            setLoading(true);
            boot();
          }}
        >
          <Text style={styles.ctaText}>Réessayer</Text>
        </TapButton>
      </View>
    );
  }

  const streakWarn = (user?.streak ?? 0) > 0;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.brand}>Quiz Rush</Text>
      <Text style={styles.tagline}>Le TikTok de la connaissance</Text>

      {showOnboarding ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Bienvenue !</Text>
          <Text style={styles.bannerText}>
            Joue en 1 tap. Sauvegarde ton compte dans Profil pour ne pas perdre ta progression.
          </Text>
          <View style={styles.bannerRow}>
            <TapButton style={styles.bannerBtn} onPress={() => setShowOnboarding(false)}>
              <Text style={styles.bannerBtnText}>Jouer</Text>
            </TapButton>
            <TapButton
              style={styles.bannerBtnAlt}
              onPress={() => {
                setShowOnboarding(false);
                router.push('/profile');
              }}
            >
              <Text style={styles.bannerBtnAltText}>Créer un compte</Text>
            </TapButton>
          </View>
        </View>
      ) : null}

      {streakWarn ? (
        <View style={styles.streak}>
          <Text style={styles.streakText}>
            🔥 Streak {user?.streak} jour{user && user.streak > 1 ? 's' : ''} — joue aujourd’hui pour le garder !
          </Text>
        </View>
      ) : (
        <View style={styles.streakMuted}>
          <Text style={styles.muted}>Lance une partie pour démarrer ton streak quotidien</Text>
        </View>
      )}

      <View style={styles.stats}>
        <Stat label="Niv." value={String(user?.level ?? 1)} />
        <Stat label="XP" value={String(user?.xp ?? 0)} />
        <Stat label="Gems" value={String(user?.gems ?? 0)} />
        <Stat label="Streak" value={String(user?.streak ?? 0)} />
      </View>

      <Text style={styles.section}>Catégories</Text>
      {categories.map((cat) => (
        <TapButton
          key={cat.id}
          style={{ ...styles.cat, borderLeftColor: cat.color }}
          onPress={() =>
            router.push({ pathname: '/quiz', params: { categoryId: cat.id, name: cat.name } })
          }
        >
          <Text style={styles.catIcon}>{cat.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.catName}>{cat.name}</Text>
            <Text style={styles.muted}>10 questions · 3 min</Text>
          </View>
          <Text style={styles.play}>JOUER</Text>
        </TapButton>
      ))}

      <TapButton style={styles.dailyBanner} onPress={() => router.push('/daily')}>
        <Text style={styles.dailyIcon}>🌟</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.dailyTitle}>Défi du jour</Text>
          <Text style={styles.dailyText}>Nouveau challenge quotidien disponible</Text>
        </View>
        <Text style={styles.dailyArrow}>→</Text>
      </TapButton>

      <View style={styles.row}>
        <NavBtn
          label="Duel"
          locked={(user?.level ?? 1) < DUEL_MIN_LEVEL}
          hint={`Niv. ${DUEL_MIN_LEVEL}+`}
          onPress={() => router.push('/duel')}
        />
        <TapButton style={styles.navBtn} onPress={() => router.push('/leaderboard')}>
          <Text style={styles.navText}>Classements</Text>
        </TapButton>
        <TapButton style={styles.navBtn} onPress={() => router.push('/profile')}>
          <Text style={styles.navText}>Profil</Text>
        </TapButton>
      </View>

      <TapButton style={styles.challengeLink} onPress={() => router.push('/challenge')}>
        <Text style={styles.challengeLinkText}>Entrer un code défi ami</Text>
      </TapButton>
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
    <TapButton style={styles.navBtn} disabled={locked} onPress={locked ? undefined : onPress}>
      <Text style={styles.navText}>{label}</Text>
      {locked && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </TapButton>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  brand: { fontSize: 40, fontWeight: '900', color: colors.primary, letterSpacing: -1 },
  tagline: { color: colors.muted, marginBottom: 8, fontSize: 16 },
  banner: {
    backgroundColor: colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 8,
  },
  bannerTitle: { color: colors.primary, fontWeight: '900', fontSize: 18 },
  bannerText: { color: colors.text, lineHeight: 20 },
  bannerRow: { flexDirection: 'row', gap: 8 },
  bannerBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  bannerBtnText: { color: '#111', fontWeight: '800' },
  bannerBtnAlt: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  bannerBtnAltText: { color: colors.accent, fontWeight: '700' },
  streak: {
    backgroundColor: '#3b1d0b',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.combo,
  },
  streakText: { color: colors.combo, fontWeight: '700' },
  streakMuted: { paddingVertical: 4 },
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
  dailyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  dailyIcon: { fontSize: 32 },
  dailyTitle: { color: colors.primary, fontWeight: '800', fontSize: 16 },
  dailyText: { color: colors.text, fontSize: 13 },
  dailyArrow: { color: colors.primary, fontSize: 24, fontWeight: '700' },
  challengeLink: { padding: 12, alignItems: 'center' },
  challengeLinkText: { color: colors.accent, fontWeight: '700' },
  cta: { backgroundColor: colors.primary, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12 },
  ctaText: { color: '#111', fontWeight: '800' },
  error: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
});
