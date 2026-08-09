import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SessionResultDto } from '@quiz-rush/shared';

const KEY = 'qr_last_result';

export async function saveSessionResult(result: SessionResultDto) {
  await AsyncStorage.setItem(KEY, JSON.stringify(result));
}

export async function loadSessionResult(): Promise<SessionResultDto | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionResultDto;
  } catch {
    return null;
  }
}
