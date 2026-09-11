import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { AnswerKey } from '@quiz-rush/shared';
import { api } from '../src/api';
import { analytics } from '../src/analytics';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function DailyChallengeScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [playing, setPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const startedAt = useRef(Date.now());
  const busyRef = useRef(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      await api.ensureGuest();
      const data = await api.get('/daily-challenge/today');
      setChallenge(data);

      const lb = await api.get('/daily-challenge/leaderboard');
      setLeaderboard(lb.leaderboard ?? []);

      analytics.track('daily_challenge_view', { challengeId: data.challengeId });
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const data = await api.post('/daily-challenge/start', {});
      setSessionId(data.sessionId);
      setQuestion(data.question);
      setIndex(data.questionIndex);
      setTotal(data.totalQuestions);
      setScore(0);
      setPlaying(true);
      startedAt.current = Date.now();
      analytics.track('daily_challenge_start', { challengeId: challenge.challengeId });
    } catch (e: any) {
      setError(e.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function submit(answer: AnswerKey) {
    if (!sessionId || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const timeSpent = Math.min(60, Math.round((Date.now() - startedAt.current) / 1000));
    try {
      const res = await api.post(`/daily-challenge/answer/${sessionId}`, { answer, timeSpent });
      setScore(res.score);
      setFeedback(res.correct ? `✅ +${res.pointsEarned}` : `❌ ${res.correctAnswer}`);
      setTimeout(() => {
        if (res.finished) {
          setResult(res.result);
          setPlaying(false);
          analytics.track('daily_challenge_finish', { score: res.score });
          return;
        }
        setQuestion(res.nextQuestion);
        setIndex((i) => i + 1);
        setFeedback(null);
        startedAt.current = Date.now();
        busyRef.current = false;
        setBusy(false);
      }, 900);
    } catch (e: any) {
      setFeedback(e.message);
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Défi du jour terminé !</Text>
        <Text style={styles.score}>Score : {result.score}</Text>
        <Text style={styles.line}>
          {result.correctCount}/10 correctes · Combo max x{result.maxCombo}
        </Text>
        <TapButton style={styles.cta} onPress={() => router.replace('/')}>
          <Text style={styles.ctaText}>Accueil</Text>
        </TapButton>
        <TapButton style={styles.btn} onPress={() => setResult(null)}>
          <Text style={styles.btnText}>Voir le classement</Text>
        </TapButton>
      </View>
    );
  }

  if (playing && question) {
    return (
      <View style={styles.container}>
        <Text style={styles.meta}>
          Défi du jour · Q{index + 1}/{total} · {score} pts
        </Text>
        <Text style={styles.question}>{question.text}</Text>
        {question.answers.map((a: { key: AnswerKey; text: string }) => (
          <TapButton
            key={a.key}
            disabled={busy || !!feedback}
            style={styles.answer}
            onPress={() => submit(a.key)}
          >
            <Text style={styles.answerText}>
              {a.key}. {a.text}
            </Text>
          </TapButton>
        ))}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
        <TapButton style={styles.btn} onPress={load}>
          <Text style={styles.btnText}>Réessayer</Text>
        </TapButton>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌟 Défi du jour</Text>
      {challenge?.category ? (
        <View style={styles.card}>
          <Text style={styles.catIcon}>{challenge.category.icon}</Text>
          <Text style={styles.catName}>{challenge.category.name}</Text>
          <Text style={styles.muted}>10 questions · Un seul essai</Text>
          {challenge.hasParticipated ? (
            <View style={styles.done}>
              <Text style={styles.doneText}>✅ Déjà complété aujourd'hui</Text>
              <Text style={styles.line}>
                Ton score : {challenge.userScore} ({challenge.userCorrect}/10)
              </Text>
            </View>
          ) : (
            <TapButton style={styles.cta} disabled={busy} onPress={start}>
              <Text style={styles.ctaText}>{busy ? '…' : 'Commencer'}</Text>
            </TapButton>
          )}
        </View>
      ) : null}

      <Text style={styles.section}>🏆 Classement du jour</Text>
      {leaderboard.length === 0 ? (
        <Text style={styles.muted}>Sois le premier à relever le défi !</Text>
      ) : (
        leaderboard.slice(0, 10).map((entry) => (
          <View key={entry.rank} style={styles.entry}>
            <Text style={styles.rank}>#{entry.rank}</Text>
            <Text style={styles.username}>{entry.username}</Text>
            <Text style={styles.entryScore}>{entry.score}</Text>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  score: { color: colors.text, fontSize: 24, fontWeight: '700' },
  line: { color: colors.text, fontWeight: '600' },
  section: { color: colors.text, fontWeight: '700', fontSize: 18, marginTop: 16 },
  muted: { color: colors.muted },
  meta: { color: colors.accent, fontWeight: '700' },
  question: { color: colors.text, fontSize: 20, fontWeight: '700' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
    alignItems: 'center',
  },
  catIcon: { fontSize: 40 },
  catName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  done: {
    backgroundColor: colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    width: '100%',
    gap: 4,
  },
  doneText: { color: colors.accent, fontWeight: '700' },
  cta: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  ctaText: { color: '#111', fontWeight: '800' },
  btn: {
    backgroundColor: colors.bgElevated,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { color: colors.accent, fontWeight: '700' },
  answer: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerText: { color: colors.text, fontWeight: '600' },
  feedback: { color: colors.text, fontWeight: '800', textAlign: 'center' },
  entry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rank: { color: colors.primary, fontWeight: '800', fontSize: 16, width: 40 },
  username: { color: colors.text, fontWeight: '600', flex: 1 },
  entryScore: { color: colors.accent, fontWeight: '700' },
  error: { color: colors.danger, textAlign: 'center', fontWeight: '600' },
});
