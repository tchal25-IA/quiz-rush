import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { DUEL_MIN_LEVEL } from '@quiz-rush/shared';
import { api, WS_URL } from '../src/api';
import { analytics } from '../src/analytics';
import { colors } from '../src/theme';
import { TapButton } from '../src/ui/TapButton';

export default function DuelScreen() {
  const [status, setStatus] = useState<'idle' | 'matching' | 'ready' | 'playing' | 'finished' | 'timeout'>('idle');
  const [message, setMessage] = useState('Affronte un adversaire en temps réel');
  const [duel, setDuel] = useState<any>(null);
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const busyRef = useRef(false);

  useEffect(() => {
    api.me().then((u) => setLevel(u.level)).catch(() => undefined);
    return () => {
      socket?.disconnect();
    };
  }, []);

  function attachSocketHandlers(s: Socket) {
    s.on('duel:queued', (payload) => {
      setDuel(payload);
      setStatus('matching');
    });

    s.on('duel:matched', (payload) => {
      setDuel(payload);
      setStatus('ready');
      setMessage(`Match trouvé vs ${payload.opponent?.username ?? 'adversaire'} !`);
      setQIndex(0);
      setMyScore(0);
      setOppScore(0);
      setTimeout(() => setStatus('playing'), 600);
      analytics.track('duel_matched', { duelId: payload.duelId });
    });

    s.on('duel:timeout', () => {
      setStatus('timeout');
      setMessage('Aucun adversaire. Essaie l’entraînement bot.');
      s.disconnect();
    });

    s.on('duel:progress', (payload) => {
      if (payload.opponentScore != null) setOppScore(payload.opponentScore);
    });

    s.on('duel:finished', (payload) => {
      setStatus('finished');
      setMyScore(payload.myScore ?? myScore);
      setOppScore(payload.opponentScore ?? oppScore);
      setMessage(payload.winnerId ? 'Duel terminé' : 'Égalité !');
      analytics.track('duel_finish', { winnerId: payload.winnerId ?? null });
    });
  }

  async function startQueue() {
    if (level < DUEL_MIN_LEVEL) {
      setMessage(`Niveau ${DUEL_MIN_LEVEL} requis pour le PvP — utilise l’entraînement`);
      return;
    }
    setStatus('matching');
    setMessage('Recherche d’adversaire (≤30s)…');
    analytics.track('duel_queue', {});

    const token = await api.getToken();
    const s = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    setSocket(s);
    attachSocketHandlers(s);

    s.on('connect', () => {
      s.emit('duel:queue', {});
    });

    try {
      const queued = await api.queueDuel();
      if (queued.status === 'ready') {
        setDuel(queued);
        setStatus('playing');
        setMessage(`Match vs ${queued.opponent?.username}`);
        setQIndex(0);
      } else {
        setDuel(queued);
      }
    } catch (e: any) {
      setMessage(e.message);
      setStatus('idle');
    }
  }

  async function startPractice() {
    setStatus('matching');
    setMessage('Préparation du bot…');
    try {
      const data = await api.practiceDuel();
      setDuel(data);
      setStatus('playing');
      setMessage(`Entraînement vs ${data.opponent?.username ?? 'Bot'}`);
      setQIndex(0);
      setMyScore(0);
      setOppScore(0);
      analytics.track('duel_practice', { duelId: data.duelId });
    } catch (e: any) {
      setMessage(e.message);
      setStatus('idle');
    }
  }

  async function answer(key: string) {
    if (!duel?.duelId || busyRef.current || feedback) return;
    busyRef.current = true;
    const duelId = duel.duelId;

    const apply = (res: any) => {
      if (res?.myScore != null) setMyScore(res.myScore);
      if (res?.opponentScore != null) setOppScore(res.opponentScore);
      setFeedback(res.correct ? '✅' : `❌ ${res.correctAnswer}`);
      setTimeout(() => {
        if (res?.finished) {
          setStatus('finished');
          setMessage(res.winnerId ? 'Duel terminé' : 'Égalité');
          busyRef.current = false;
          return;
        }
        setQIndex((i) => i + 1);
        setFeedback(null);
        busyRef.current = false;
      }, 700);
    };

    if (socket?.connected) {
      socket.emit('duel:answer', { duelId, questionIndex: qIndex, answer: key }, (res: any) => {
        apply(res);
      });
      return;
    }

    try {
      const res = await api.answerDuel(duelId, qIndex, key);
      apply(res);
    } catch (e: any) {
      setFeedback(e.message);
      busyRef.current = false;
    }
  }

  const question = duel?.questions?.[qIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duel</Text>
      <Text style={styles.muted}>{message}</Text>
      <Text style={styles.muted}>Ton niveau : {level}</Text>

      {status === 'idle' || status === 'timeout' ? (
        <View style={{ width: '100%', gap: 10, marginTop: 24 }}>
          <TapButton style={styles.cta} onPress={startQueue}>
            <Text style={styles.ctaText}>
              {level < DUEL_MIN_LEVEL ? `PvP (Niv. ${DUEL_MIN_LEVEL}+)` : 'Trouver un adversaire'}
            </Text>
          </TapButton>
          <TapButton style={styles.secondary} onPress={startPractice}>
            <Text style={styles.secondaryText}>Entraînement vs Bot</Text>
          </TapButton>
        </View>
      ) : null}

      {status === 'matching' ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}

      {status === 'playing' && question ? (
        <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
          <Text style={styles.score}>
            Toi {myScore} — Adv. {oppScore}
          </Text>
          <Text style={styles.q}>
            Q{qIndex + 1}. {question.text}
          </Text>
          {question.answers.map((a: any) => (
            <TapButton key={a.key} style={styles.answer} disabled={!!feedback} onPress={() => answer(a.key)}>
              <Text style={styles.answerText}>
                {a.key}. {a.text}
              </Text>
            </TapButton>
          ))}
          {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}
        </View>
      ) : null}

      {status === 'finished' ? (
        <View style={{ marginTop: 24, alignItems: 'center', gap: 8 }}>
          <Text style={styles.title}>Score final</Text>
          <Text style={styles.score}>
            {myScore} — {oppScore}
          </Text>
          <TapButton style={styles.secondary} onPress={() => setStatus('idle')}>
            <Text style={styles.secondaryText}>Rejouer</Text>
          </TapButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted, marginTop: 8, textAlign: 'center' },
  cta: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  ctaText: { color: '#111', fontWeight: '800' },
  secondary: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  secondaryText: { color: colors.accent, fontWeight: '800' },
  score: { color: colors.accent, fontWeight: '800', fontSize: 18 },
  q: { color: colors.text, fontWeight: '700', fontSize: 18 },
  answer: {
    backgroundColor: colors.card,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  answerText: { color: colors.text, fontWeight: '600' },
  feedback: { color: colors.text, fontWeight: '800', textAlign: 'center' },
});
