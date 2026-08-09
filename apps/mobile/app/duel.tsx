import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { DUEL_MIN_LEVEL } from '@quiz-rush/shared';
import { api, WS_URL } from '../src/api';
import { colors } from '../src/theme';

export default function DuelScreen() {
  const [status, setStatus] = useState<'idle' | 'matching' | 'ready' | 'playing' | 'finished' | 'timeout'>('idle');
  const [message, setMessage] = useState('Affronte un adversaire en temps réel');
  const [duel, setDuel] = useState<any>(null);
  const [level, setLevel] = useState(1);
  const [qIndex, setQIndex] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myScore, setMyScore] = useState(0);

  useEffect(() => {
    api.me().then((u) => setLevel(u.level)).catch(() => undefined);
    return () => {
      socket?.disconnect();
    };
  }, []);

  async function startQueue() {
    if (level < DUEL_MIN_LEVEL) {
      setMessage(`Niveau ${DUEL_MIN_LEVEL} requis`);
      return;
    }
    setStatus('matching');
    setMessage('Recherche d’adversaire (≤30s)…');

    const token = await api.getToken();
    const s = io(WS_URL, { auth: { token }, transports: ['websocket'] });
    setSocket(s);

    s.on('connect', () => {
      s.emit('duel:queue', {});
    });

    s.on('duel:queued', (payload) => {
      setDuel(payload);
      setStatus('matching');
    });

    s.on('duel:matched', (payload) => {
      setDuel(payload);
      setStatus('ready');
      setMessage(`Match trouvé vs ${payload.opponent?.username ?? 'adversaire'} !`);
      setTimeout(() => setStatus('playing'), 800);
    });

    s.on('duel:timeout', () => {
      setStatus('timeout');
      setMessage('Aucun adversaire trouvé. Réessaie !');
      s.disconnect();
    });

    s.on('duel:finished', (payload) => {
      setStatus('finished');
      setMyScore(payload.myScore ?? myScore);
      setMessage(payload.winnerId ? 'Duel terminé' : 'Égalité !');
    });

    // REST fallback if alone
    try {
      const queued = await api.queueDuel();
      if (queued.status === 'ready') {
        setDuel(queued);
        setStatus('playing');
        setMessage(`Match vs ${queued.opponent?.username}`);
      } else {
        setDuel(queued);
      }
    } catch (e: any) {
      setMessage(e.message);
      setStatus('idle');
    }
  }

  async function answer(key: string) {
    if (!duel?.duelId && !duel?.questions) return;
    const duelId = duel.duelId;
    socket?.emit(
      'duel:answer',
      { duelId, questionIndex: qIndex, answer: key },
      (res: any) => {
        if (res?.myScore != null) setMyScore(res.myScore);
        if (res?.finished) {
          setStatus('finished');
          setMessage(res.winnerId ? 'Victoire ou défaite — voir score' : 'Égalité');
          return;
        }
        setQIndex((i) => i + 1);
      },
    );
  }

  const question = duel?.questions?.[qIndex];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Duel</Text>
      <Text style={styles.muted}>{message}</Text>
      <Text style={styles.muted}>Ton niveau : {level}</Text>

      {status === 'idle' || status === 'timeout' ? (
        <Pressable style={styles.cta} onPress={startQueue}>
          <Text style={styles.ctaText}>Trouver un adversaire</Text>
        </Pressable>
      ) : null}

      {status === 'matching' ? <ActivityIndicator color={colors.primary} style={{ marginTop: 24 }} /> : null}

      {status === 'playing' && question ? (
        <View style={{ width: '100%', gap: 10, marginTop: 20 }}>
          <Text style={styles.score}>Score : {myScore}</Text>
          <Text style={styles.q}>
            Q{qIndex + 1}. {question.text}
          </Text>
          {question.answers.map((a: any) => (
            <Pressable key={a.key} style={styles.answer} onPress={() => answer(a.key)}>
              <Text style={styles.answerText}>
                {a.key}. {a.text}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {status === 'finished' ? (
        <Text style={[styles.title, { marginTop: 24 }]}>Score final : {myScore}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, alignItems: 'center' },
  title: { color: colors.primary, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted, marginTop: 8, textAlign: 'center' },
  cta: {
    marginTop: 32,
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaText: { color: '#111', fontWeight: '800' },
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
});
