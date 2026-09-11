import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { AuthResponse, PublicUser } from '@quiz-rush/shared';

const extra = Constants.expoConfig?.extra as { apiUrl?: string; wsUrl?: string } | undefined;

export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? extra?.apiUrl ?? 'http://localhost:3000/api';
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? extra?.wsUrl ?? 'http://localhost:3000/duel';

const TOKEN_KEY = 'qr_token';
const USER_KEY = 'qr_user';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(msg ?? `Erreur ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: any) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  async ensureGuest(): Promise<AuthResponse> {
    const existing = await AsyncStorage.getItem(TOKEN_KEY);
    if (existing) {
      try {
        const user = await request<PublicUser>('/users/me');
        return { accessToken: existing, user };
      } catch {
        await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
      }
    }
    const auth = await request<AuthResponse>('/auth/guest', { method: 'POST', body: '{}' });
    await AsyncStorage.setItem(TOKEN_KEY, auth.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    return auth;
  },

  getToken: () => AsyncStorage.getItem(TOKEN_KEY),

  me: () => request<PublicUser>('/users/me'),
  categories: () => request<any[]>('/quiz/categories'),
  startSolo: (categoryId?: string) =>
    request<any>('/quiz/solo/start', {
      method: 'POST',
      body: JSON.stringify(categoryId ? { categoryId } : {}),
    }),
  answer: (sessionId: string, answer: string, timeSpent: number) =>
    request<any>(`/quiz/solo/${sessionId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ answer, timeSpent }),
    }),
  joker: (sessionId: string, type: string) =>
    request<any>(`/quiz/solo/${sessionId}/joker`, {
      method: 'POST',
      body: JSON.stringify({ type }),
    }),
  leaderboard: (type: 'global' | 'weekly' = 'global') =>
    request<any[]>(`/leaderboard?type=${type}`),
  missions: () => request<any[]>('/missions'),
  claimMission: (id: string) =>
    request<any>(`/missions/${id}/claim`, { method: 'POST', body: '{}' }),
  queueDuel: (categoryId?: string) =>
    request<any>('/duel/queue', {
      method: 'POST',
      body: JSON.stringify(categoryId ? { categoryId } : {}),
    }),
  practiceDuel: (categoryId?: string) =>
    request<any>('/duel/practice', {
      method: 'POST',
      body: JSON.stringify(categoryId ? { categoryId } : {}),
    }),
  answerDuel: (duelId: string, questionIndex: number, answer: string) =>
    request<any>(`/duel/${duelId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionIndex, answer }),
    }),
  getDuel: (id: string) => request<any>(`/duel/${id}`),
  createChallenge: (sessionId: string) =>
    request<any>('/quiz/challenge', {
      method: 'POST',
      body: JSON.stringify({ sessionId }),
    }),
  getChallenge: (code: string) => request<any>(`/quiz/challenge/${code}`),
  startChallenge: (code: string) =>
    request<any>(`/quiz/challenge/${code}/start`, { method: 'POST', body: '{}' }),
  answerChallenge: (code: string, sessionId: string, answer: string, timeSpent: number) =>
    request<any>(`/quiz/challenge/${code}/answer`, {
      method: 'POST',
      body: JSON.stringify({ sessionId, answer, timeSpent }),
    }),
  refillJoker: (type: string, method: 'ad' | 'gems') =>
    request<PublicUser>('/users/jokers/refill', {
      method: 'POST',
      body: JSON.stringify({ type, method }),
    }),

  async claim(email: string, username: string, password: string): Promise<AuthResponse> {
    const auth = await request<AuthResponse>('/auth/claim', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    await AsyncStorage.setItem(TOKEN_KEY, auth.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    return auth;
  },

  async login(login: string, password: string): Promise<AuthResponse> {
    const auth = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    });
    await AsyncStorage.setItem(TOKEN_KEY, auth.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    return auth;
  },

  async register(email: string, username: string, password: string): Promise<AuthResponse> {
    const auth = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, username, password }),
    });
    await AsyncStorage.setItem(TOKEN_KEY, auth.accessToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(auth.user));
    return auth;
  },
};
