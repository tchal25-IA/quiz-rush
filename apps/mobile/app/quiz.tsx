import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getComboMultiplier } from '@quiz-rush/shared';
import type { AnswerKey } from '@quiz-rush/shared';
import { api } from '../src/api';
import { analytics } from '../src/analytics';
import { saveSessionResult } from '../src/sessionResult';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function QuizScreen() {
  const { categoryId } = useLocalSearchParams<{ categoryId?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [selected, setSelected] = useState<AnswerKey | null>(null);
  const [correctKey, setCorrectKey] = useState<AnswerKey | null>(null);
  const [eliminated, setEliminated] = useState<AnswerKey[]>([]);
  const [community, setCommunity] = useState<Partial<Record<AnswerKey, number>> | null>(null);
  const [jokers, setJokers] = useState({ fifty_fifty: false, time_bonus: false, community: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const busyRef = useRef(false);
  const feedbackRef = useRef(false);
  const sessionRef = useRef<string | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);
  useEffect(() => {
    feedbackRef.current = !!feedback;
  }, [feedback]);
  useEffect(() => {
    sessionRef.current = sessionId;
  }, [sessionId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.startSolo(categoryId || undefined);
        if (cancelled) return;
        setSessionId(data.sessionId);
        sessionRef.current = data.sessionId;
        setQuestion(data.question);
        setIndex(data.questionIndex);
        setTotal(data.totalQuestions);
        setScore(data.score);
        setCombo(data.combo);
        setTimeLeft(data.question.timeLimit);
        startedAt.current = Date.now();
        analytics.track('solo_start', { categoryId: categoryId ?? null, sessionId: data.sessionId });
      } catch (e: any) {
        if (!cancelled) setError(e.message ?? 'Erreur démarrage');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    };
  }, [categoryId]);

  const submit = useCallback(async (answer: AnswerKey, timedOut = false) => {
    const sid = sessionRef.current;
    if (!sid || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setSelected(answer);
    const timeSpent = Math.min(60, Math.max(0, Math.round((Date.now() - startedAt.current) / 1000)));
    try {
      const res = await api.answer(sid, answer, timeSpent);
      setScore(res.score);
      setCombo(res.combo);
      setCorrectKey(res.correctAnswer);
      setFeedback(
        timedOut && !res.correct
          ? `⏱ Temps écoulé — réponse : ${res.correctAnswer}`
          : res.correct
            ? `✅ +${res.pointsEarned} (x${res.multiplier})`
            : `❌ Bonne réponse : ${res.correctAnswer}`,
      );
      analytics.track('solo_answer', {
        correct: res.correct,
        timedOut,
        score: res.score,
        combo: res.combo,
      });

      advanceTimer.current = setTimeout(async () => {
        if (res.finished && res.result) {
          await saveSessionResult(res.result);
          analytics.track('solo_finish', {
            score: res.result.score,
            correctCount: res.result.correctCount,
            perfect: res.result.perfect,
          });
          router.replace('/results');
          return;
        }
        setQuestion(res.nextQuestion);
        setIndex((i) => i + 1);
        setTimeLeft(res.nextQuestion?.timeLimit ?? 10);
        setFeedback(null);
        setSelected(null);
        setCorrectKey(null);
        setEliminated([]);
        setCommunity(null);
        startedAt.current = Date.now();
        busyRef.current = false;
        setBusy(false);
      }, 1100);
    } catch (e: any) {
      setFeedback(e.message ?? 'Erreur');
      busyRef.current = false;
      setBusy(false);
    }
  }, [router]);

  useEffect(() => {
    if (!question || feedbackRef.current || busyRef.current) return;
    if (timeLeft <= 0) {
      submit('A', true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, feedback, busy, submit]);

  const multiplier = useMemo(() => getComboMultiplier(combo), [combo]);

  async function useJoker(type: 'fifty_fifty' | 'time_bonus' | 'community') {
    const sid = sessionRef.current;
    if (!sid || jokers[type] || busyRef.current) return;
    try {
      const res = await api.joker(sid, type);
      setJokers((j) => ({ ...j, [type]: true }));
      if (res.eliminatedKeys) setEliminated(res.eliminatedKeys);
      if (res.bonusSeconds) setTimeLeft((t) => t + res.bonusSeconds);
      if (res.communityPercents) setCommunity(res.communityPercents);
      analytics.track('joker_use', { type });
    } catch (e: any) {
      setFeedback(e.message);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!question) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.danger }}>{error ?? feedback ?? 'Erreur'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Text style={styles.meta}>
          Q{index + 1}/{total}
        </Text>
        <Text style={[styles.timer, timeLeft <= 3 && { color: colors.danger }]}>{timeLeft}s</Text>
        <Text style={styles.meta}>
          {score} pts · x{multiplier}
        </Text>
      </View>

      {combo >= 3 ? (
        <Text style={styles.combo}>
          COMBO x{multiplier}
          {combo >= 10 ? ' PERFECT!' : ''}
        </Text>
      ) : null}

      <Text style={styles.question}>{question.text}</Text>

      <View style={styles.answers}>
        {question.answers.map((a: { key: AnswerKey; text: string }) => {
          const isElim = eliminated.includes(a.key);
          const showCorrect = !!feedback && correctKey === a.key;
          const showWrong = !!feedback && selected === a.key && correctKey !== a.key;
          const disabled = isElim || !!feedback || busy;
          return (
            <TapButton
              key={a.key}
              disabled={disabled}
              style={{
                ...styles.answer,
                ...(isElim ? styles.eliminated : null),
                ...(showCorrect ? styles.correct : null),
                ...(showWrong ? styles.wrong : null),
              }}
              onPress={() => submit(a.key)}
            >
              <View style={styles.keyBadge}>
                <Text style={styles.answerKey}>{a.key}</Text>
              </View>
              <Text style={styles.answerText}>{a.text}</Text>
              {community?.[a.key] != null ? (
                <Text style={styles.comm}>{community[a.key]}%</Text>
              ) : null}
            </TapButton>
          );
        })}
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <View style={styles.jokers}>
        <JokerBtn label="50/50" used={jokers.fifty_fifty} onPress={() => useJoker('fifty_fifty')} />
        <JokerBtn label="+5s" used={jokers.time_bonus} onPress={() => useJoker('time_bonus')} />
        <JokerBtn label="Commu" used={jokers.community} onPress={() => useJoker('community')} />
      </View>
    </View>
  );
}

function JokerBtn({ label, used, onPress }: { label: string; used: boolean; onPress: () => void }) {
  return (
    <TapButton onPress={onPress} disabled={used} style={styles.joker}>
      <Text style={styles.jokerText}>{label}</Text>
    </TapButton>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  meta: { color: colors.muted, fontWeight: '600' },
  timer: { color: colors.accent, fontSize: 28, fontWeight: '900' },
  combo: { color: colors.combo, fontWeight: '900', fontSize: 18, textAlign: 'center' },
  question: { color: colors.text, fontSize: 22, fontWeight: '700', marginVertical: 8 },
  answers: { gap: 10 },
  answer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  correct: { borderColor: colors.success, backgroundColor: '#052e16' },
  wrong: { borderColor: colors.danger, backgroundColor: '#450a0a' },
  eliminated: { opacity: 0.3 },
  keyBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerKey: {
    color: '#111',
    fontWeight: '900',
  },
  answerText: { color: colors.text, flex: 1, fontWeight: '600' },
  comm: { color: colors.accent, fontWeight: '700' },
  feedback: { textAlign: 'center', color: colors.text, fontWeight: '700', fontSize: 16 },
  jokers: { flexDirection: 'row', gap: 8, marginTop: 'auto' },
  joker: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  jokerText: { color: colors.text, fontWeight: '700' },
});
