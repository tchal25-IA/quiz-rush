import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Quiz Rush' }} />
        <Stack.Screen name="quiz" options={{ title: 'Solo', headerBackTitle: 'Retour' }} />
        <Stack.Screen name="results" options={{ title: 'Résultats', headerBackVisible: false }} />
        <Stack.Screen name="leaderboard" options={{ title: 'Classements' }} />
        <Stack.Screen name="duel" options={{ title: 'Duel' }} />
        <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      </Stack>
    </>
  );
}
