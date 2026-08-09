import { Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { SessionResultDto } from '@quiz-rush/shared';
import { colors } from '../src/theme';

export default function ResultsScreen() {
  const router = useRouter();
  const { payload } = useLocalSearchParams<{ payload: string }>();
  const result: SessionResultDto = payload
    ? JSON.parse(payload)
    : {
        sessionId: '',
        score: 0,
        maxCombo: 0,
        correctCount: 0,
        totalQuestions: 10,
        xpGained: 0,
        gemsGained: 0,
        percentBeaten: 0,
        leveledUp: false,
        level: 1,
        perfect: false,
      };

  async function share() {
    const msg = result.perfect
      ? `🔥 PERFECT x5 sur Quiz Rush ! Score ${result.score} — je te défie !`
      : `🧠 Quiz Rush : ${result.score} pts, combo x${result.maxCombo}, meilleur que ${result.percentBeaten}% ! Relève le défi.`;
    await Share.share({ message: msg });
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

      <Pressable style={styles.cta} onPress={share}>
        <Text style={styles.ctaText}>Partager mon score</Text>
      </Pressable>
      <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
        <Text style={styles.secondaryText}>Retour accueil</Text>
      </Pressable>
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
  secondary: { padding: 14 },
  secondaryText: { color: colors.accent, fontWeight: '700' },
});
