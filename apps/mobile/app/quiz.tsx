import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getComboMultiplier } from '@quiz-rush/shared';
import type { AnswerKey } from '@quiz-rush/shared';
import { api } from '../src/api';
import { colors } from '../src/theme';

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
  const [eliminated, setEliminated] = useState<AnswerKey[]>([]);
  const [community, setCommunity] = useState<Partial<Record<AnswerKey, number>> | null>(null);
  const [jokers, setJokers] = useState({ fifty_fifty: false, time_bonus: false, community: false });
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const data = await api.startSolo(categoryId);
        setSessionId(data.sessionId);
        setQuestion(data.question);
        setIndex(data.questionIndex);
        setTotal(data.totalQuestions);
        setScore(data.score);
        setCombo(data.combo);
        setTimeLeft(data.question.timeLimit);
        startedAt.current = Date.now();
      } catch (e: any) {
        setFeedback(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  useEffect(() => {
    if (!question || feedback || busy) return;
    if (timeLeft <= 0) {
      submit('A', true);
      return;
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [timeLeft, question, feedback, busy]);

  const multiplier = useMemo(() => getComboMultiplier(combo), [combo]);

  async function submit(answer: AnswerKey, timedOut = false) {
    if (!sessionId || busy) return;
    setBusy(true);
    const timeSpent = Math.min(60, Math.round((Date.now() - startedAt.current) / 1000));
    try {
      const res = await api.answer(sessionId, answer, timeSpent);
      setScore(res.score);
      setCombo(res.combo);
      setFeedback(
        timedOut && !res.correct
          ? `⏱ Temps écoulé — réponse : ${res.correctAnswer}`
          : res.correct
            ? `✅ +${res.pointsEarned} (x${res.multiplier})`
            : `❌ Bonne réponse : ${res.correctAnswer}`,
      );

      setTimeout(() => {
        if (res.finished && res.result) {
          router.replace({
            pathname: '/results',
            params: { payload: JSON.stringify(res.result) },
          });
          return;
        }
        setQuestion(res.nextQuestion);
        setIndex((i) => i + 1);
        setTimeLeft(res.nextQuestion.timeLimit);
        setFeedback(null);
        setEliminated([]);
        setCommunity(null);
        startedAt.current = Date.now();
        setBusy(false);
      }, 1200);
    } catch (e: any) {
      setFeedback(e.message);
      setBusy(false);
    }
  }

  async function useJoker(type: 'fifty_fifty' | 'time_bonus' | 'community') {
    if (!sessionId || jokers[type] || busy) return;
    try {
      const res = await api.joker(sessionId, type);
      setJokers((j) => ({ ...j, [type]: true }));
      if (res.eliminatedKeys) setEliminated(res.eliminatedKeys);
      if (res.bonusSeconds) setTimeLeft((t) => t + res.bonusSeconds);
      if (res.communityPercents) setCommunity(res.communityPercents);
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
        <Text style={{ color: colors.danger }}>{feedback ?? 'Erreur'}</Text>
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
        <Text style={styles.combo}>COMBO x{multiplier}{combo >= 10 ? ' PERFECT!' : ''}</Text>
      ) : null}

      <Text style={styles.question}>{question.text}</Text>

      <View style={styles.answers}>
        {question.answers.map((a: { key: AnswerKey; text: string }) => {
          const disabled = eliminated.includes(a.key) || !!feedback || busy;
          return (
            <Pressable
              key={a.key}
              disabled={disabled}
              style={[styles.answer, eliminated.includes(a.key) && styles.eliminated]}
              onPress={() => submit(a.key)}
            >
              <Text style={styles.answerKey}>{a.key}</Text>
              <Text style={styles.answerText}>{a.text}</Text>
              {community?.[a.key] != null ? (
                <Text style={styles.comm}>{community[a.key]}%</Text>
              ) : null}
            </Pressable>
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
    <Pressable
      onPress={onPress}
      disabled={used}
      style={[styles.joker, used && { opacity: 0.35 }]}
    >
      <Text style={styles.jokerText}>{label}</Text>
    </Pressable>
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
  eliminated: { opacity: 0.3 },
  answerKey: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    color: '#111',
    textAlign: 'center',
    fontWeight: '900',
    overflow: 'hidden',
    lineHeight: 28,
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
