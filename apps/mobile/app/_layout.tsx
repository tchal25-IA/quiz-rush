import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../src/theme';

export default function RootLayout() {
  return (
    <>
      <Head>
        <title>Quiz Rush</title>
        <meta name="description" content="Le TikTok de la connaissance — quiz 3 min, combos, duels." />
      </Head>
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
        <Stack.Screen name="challenge" options={{ title: 'Défi ami' }} />
      </Stack>
    </>
  );
}
