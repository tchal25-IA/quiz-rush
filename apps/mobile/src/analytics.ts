import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

type Props = Record<string, string | number | boolean | null | undefined>;

const QUEUE_KEY = 'qr_analytics_queue';
const SESSION_KEY = 'qr_analytics_session';

function sessionIdSync(): string {
  // fallback sync id; hydrated async on first track
  return `s_${Date.now().toString(36)}`;
}

let sessionId = sessionIdSync();

async function ensureSession() {
  const existing = await AsyncStorage.getItem(SESSION_KEY);
  if (existing) {
    sessionId = existing;
    return existing;
  }
  sessionId = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  await AsyncStorage.setItem(SESSION_KEY, sessionId);
  return sessionId;
}

export const analytics = {
  async track(name: string, props: Props = {}) {
    try {
      await ensureSession();
      const event = {
        name,
        props: { ...props, sessionId },
        ts: new Date().toISOString(),
      };
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      const queue = raw ? (JSON.parse(raw) as typeof event[]) : [];
      queue.push(event);
      const batch = queue.splice(0, 20);
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

      const token = await AsyncStorage.getItem('qr_token');
      await fetch(`${API_URL}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ events: batch }),
      }).catch(() => undefined);
    } catch {
      // analytics never block gameplay
    }
  },
};
