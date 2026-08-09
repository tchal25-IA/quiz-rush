import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { AnswerKey } from '@quiz-rush/shared';
import { api } from '../src/api';
import { analytics } from '../src/analytics';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function ChallengeScreen() {
  const { code: codeParam } = useLocalSearchParams<{ code?: string }>();
  const router = useRouter();
  const [code, setCode] = useState(codeParam ?? '');
  const [info, setInfo] = useState<any>(null);
  const [playing, setPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<any>(null);
  const [index, setIndex] = useState(0);
  const [total, setTotal] = useState(10);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const startedAt = useRef(Date.now());
  const busyRef = useRef(false);

  useEffect(() => {
    if (codeParam) {
      setCode(codeParam);
      load(codeParam);
    }
  }, [codeParam]);

  async function load(c: string) {
    setError(null);
    try {
      await api.ensureGuest();
      const data = await api.getChallenge(c.trim().toUpperCase());
      setInfo(data);
      analytics.track('challenge_view', { code: c });
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const data = await api.startChallenge(code.trim().toUpperCase());
      setSessionId(data.sessionId);
      setQuestion(data.question);
      setIndex(data.questionIndex);
      setTotal(data.totalQuestions);
      setScore(0);
      setPlaying(true);
      startedAt.current = Date.now();
      analytics.track('challenge_start', { code });
    } catch (e: any) {
      setError(e.message);
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
      const res = await api.answerChallenge(code.trim().toUpperCase(), sessionId, answer, timeSpent);
      setScore(res.score);
      setFeedback(res.correct ? `✅ +${res.pointsEarned}` : `❌ ${res.correctAnswer}`);
      setTimeout(() => {
        if (res.finished) {
          setResult(res.challengeResult ?? res.result);
          setPlaying(false);
          analytics.track('challenge_finish', { score: res.score });
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

  if (result) {
    const won = (result.challengerScore ?? 0) > (result.creatorScore ?? 0);
    const draw = result.challengerScore === result.creatorScore;
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{draw ? 'Égalité !' : won ? 'Défi gagné !' : 'Défi perdu'}</Text>
        <Text style={styles.scoreLine}>
          Toi {result.challengerScore} — {result.creatorUsername} {result.creatorScore}
        </Text>
        <TapButton style={styles.cta} onPress={() => router.replace('/')}>
          <Text style={styles.ctaText}>Accueil</Text>
        </TapButton>
      </View>
    );
  }

  if (playing && question) {
    return (
      <View style={styles.container}>
        <Text style={styles.meta}>
          Défi · Q{index + 1}/{total} · {score} pts
        </Text>
        <Text style={styles.question}>{question.text}</Text>
        {question.answers.map((a: { key: AnswerKey; text: string }) => (
          <TapButton key={a.key} disabled={busy || !!feedback} style={styles.answer} onPress={() => submit(a.key)}>
            <Text style={styles.answerText}>
              {a.key}. {a.text}
            </Text>
          </TapButton>
        ))}
        {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Défi ami</Text>
      <Text style={styles.muted}>Entre un code ou ouvre un lien de défi</Text>
      <TextInput
        style={styles.input}
        placeholder="Code (ex: AB12CD)"
        placeholderTextColor={colors.muted}
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      <TapButton style={styles.btn} onPress={() => load(code)}>
        <Text style={styles.btnText}>Vérifier</Text>
      </TapButton>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {info ? (
        <View style={styles.card}>
          <Text style={styles.line}>
            Défi de {info.creatorUsername} — score à battre : {info.creatorScore}
          </Text>
          <Text style={styles.muted}>
            {info.categoryName} · expire {new Date(info.expiresAt).toLocaleString()}
          </Text>
          {info.status === 'open' ? (
            <TapButton style={styles.cta} disabled={busy} onPress={start}>
              <Text style={styles.ctaText}>{busy ? '…' : 'Relever le défi'}</Text>
            </TapButton>
          ) : (
            <Text style={styles.muted}>Défi déjà terminé ou expiré</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
