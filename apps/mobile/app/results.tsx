import { useEffect, useState } from 'react';
import { ActivityIndicator, Share, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { SessionResultDto } from '@quiz-rush/shared';
import { api } from '../src/api';
import { analytics } from '../src/analytics';
import { loadSessionResult } from '../src/sessionResult';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

const WEB_ORIGIN =
  typeof window !== 'undefined' && window.location?.origin
    ? window.location.origin
    : 'https://quiz-rush-web.vercel.app';

export default function ResultsScreen() {
  const router = useRouter();
  const [result, setResult] = useState<SessionResultDto | null>(null);
  const [challengeMsg, setChallengeMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadSessionResult().then(setResult);
  }, []);

  if (!result) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <TapButton style={styles.secondary} onPress={() => router.replace('/')}>
          <Text style={styles.secondaryText}>Retour accueil</Text>
        </TapButton>
      </View>
    );
  }

  async function share() {
    const msg = result!.perfect
      ? `🔥 PERFECT x5 sur Quiz Rush ! Score ${result!.score} — je te défie !\n${WEB_ORIGIN}`
      : `🧠 Quiz Rush : ${result!.score} pts, combo max ${result!.maxCombo}, meilleur que ${result!.percentBeaten}% !\n${WEB_ORIGIN}`;
    analytics.track('share_click', { score: result!.score, perfect: result!.perfect });
    await Share.share({ message: msg, url: WEB_ORIGIN });
  }

  async function challengeFriend() {
    setBusy(true);
    setChallengeMsg(null);
    try {
      const ch = await api.createChallenge(result!.sessionId);
      const link = `${WEB_ORIGIN}/challenge?code=${ch.code}`;
      analytics.track('challenge_create', { code: ch.code });
      setChallengeMsg(`Code ${ch.code} — lien copié dans le partage`);
      await Share.share({
        message: `⚔️ Défi Quiz Rush ! Peux-tu battre mon score de ${result!.score} pts ?\nCode : ${ch.code}\n${link}`,
        url: link,
      });
    } catch (e: any) {
      setChallengeMsg(e.message ?? 'Impossible de créer le défi');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{result.perfect ? 'PERFECT x5!' : 'Fin de partie'}</Text>
      <Text style={styles.score}>{result.score}</Text>
      <Text style={styles.muted}>points</Text>

      <View style={styles.grid}>
        <Row label="Bonnes réponses" value={`${result.correctCount}/${result.totalQuestions}`} />
        <Row label="Combo max" value={`x${result.maxCombo}`} />
        <Row label="Joueurs battus" value={`${result.percentBeaten}%`} />
        <Row label="XP" value={`+${result.xpGained}`} />
        <Row label="Gems" value={`+${result.gemsGained}`} />
        {result.leveledUp ? <Row label="Niveau" value={`↑ ${result.level}`} /> : null}
      </View>

      <TapButton style={styles.cta} onPress={share}>
        <Text style={styles.ctaText}>Partager mon score</Text>
      </TapButton>
      <TapButton style={styles.challenge} disabled={busy} onPress={challengeFriend}>
        <Text style={styles.challengeText}>{busy ? '…' : 'Défier un ami'}</Text>
      </TapButton>
      {challengeMsg ? <Text style={styles.hint}>{challengeMsg}</Text> : null}
      <TapButton style={styles.secondary} onPress={() => router.replace('/')}>
        <Text style={styles.secondaryText}>Retour accueil</Text>
      </TapButton>
      <TapButton style={styles.secondary} onPress={() => router.push('/leaderboard')}>
        <Text style={styles.secondaryText}>Voir les classements</Text>
      </TapButton>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, alignItems: 'center', gap: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { color: colors.primary, fontWeight: '900', fontSize: 28, marginTop: 24 },
  score: { color: colors.text, fontSize: 64, fontWeight: '900' },
  muted: { color: colors.muted },
  grid: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 10,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { color: colors.text, fontWeight: '700' },
  cta: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: { color: '#111', fontWeight: '800', fontSize: 16 },
  challenge: {
    backgroundColor: colors.bgElevated,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  challengeText: { color: colors.accent, fontWeight: '800', fontSize: 16 },
  hint: { color: colors.muted, textAlign: 'center', fontSize: 13 },
  secondary: { padding: 14 },
  secondaryText: { color: colors.accent, fontWeight: '700' },
});
