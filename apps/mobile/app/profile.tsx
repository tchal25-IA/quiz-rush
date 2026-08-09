import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { PublicUser } from '@quiz-rush/shared';
import { api } from '../src/api';
import { colors } from '../src/theme';

export default function ProfileScreen() {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [missions, setMissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authMsg, setAuthMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const [u, m] = await Promise.all([api.me(), api.missions()]);
      setUser(u);
      setMissions(m);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function claimAccount() {
    setBusy(true);
    setAuthMsg(null);
    try {
      const auth = await api.claim(email.trim(), username.trim(), password);
      setUser(auth.user);
      setAuthMsg('Compte créé — progression conservée');
      setPassword('');
      await refresh();
    } catch (e: any) {
      setAuthMsg(e.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  async function loginAccount() {
    setBusy(true);
    setAuthMsg(null);
    try {
      const auth = await api.login(email.trim() || username.trim(), password);
      setUser(auth.user);
      setAuthMsg(`Connecté : ${auth.user.username}`);
      setPassword('');
      await refresh();
    } catch (e: any) {
      setAuthMsg(e.message ?? 'Erreur');
    } finally {
      setBusy(false);
    }
  }

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.name}>{user.username}</Text>
      <Text style={styles.muted}>{user.isGuest ? 'Compte invité' : 'Compte lié'}</Text>

      <View style={styles.card}>
        <Text style={styles.line}>Niveau {user.level} · {user.xp} XP</Text>
        <Text style={styles.line}>Gems : {user.gems}</Text>
        <Text style={styles.line}>Streak : {user.streak} jour(s)</Text>
        <Text style={styles.line}>Premium : {user.isPremium ? 'Oui' : 'Non (stub MVP)'}</Text>
      </View>

      {user.isGuest ? (
        <>
          <Text style={styles.section}>Créer mon compte</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />
            <TextInput
              style={styles.input}
              placeholder="Mot de passe (6+)"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable style={styles.cta} disabled={busy} onPress={claimAccount}>
              <Text style={styles.ctaText}>{busy ? '…' : 'Sauvegarder ma progression'}</Text>
            </Pressable>
          </View>
        </>
      ) : null}

      <Text style={styles.section}>Se connecter</Text>
      <View style={styles.card}>
        <TextInput
          style={styles.input}
          placeholder="Email ou username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Mot de passe"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <Pressable style={styles.btn} disabled={busy} onPress={loginAccount}>
          <Text style={styles.btnText}>Connexion</Text>
        </Pressable>
      </View>
      {authMsg ? <Text style={styles.authMsg}>{authMsg}</Text> : null}

      <Text style={styles.section}>Jokers</Text>
      <View style={styles.card}>
        <Text style={styles.line}>50/50 : {user.jokers.fifty_fifty}</Text>
        <Text style={styles.line}>+5s : {user.jokers.time_bonus}</Text>
        <Text style={styles.line}>Communauté : {user.jokers.community}</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          style={styles.btn}
          onPress={async () => {
            await api.refillJoker('fifty_fifty', 'ad');
            refresh();
          }}
        >
          <Text style={styles.btnText}>Pub → 50/50</Text>
        </Pressable>
        <Pressable
          style={styles.btn}
          onPress={async () => {
            await api.refillJoker('time_bonus', 'gems');
            refresh();
          }}
        >
          <Text style={styles.btnText}>100 gems → +5s</Text>
        </Pressable>
      </View>

      <Text style={styles.section}>Missions</Text>
      {missions.map((m) => (
        <View key={m.id} style={styles.card}>
          <Text style={styles.line}>{m.title}</Text>
          <Text style={styles.muted}>
            {m.description} · {m.progress}/{m.target}
            {m.completed ? ' ✓' : ''}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 10, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { color: colors.text, fontSize: 28, fontWeight: '900' },
  muted: { color: colors.muted },
  section: { color: colors.primary, fontWeight: '800', fontSize: 16, marginTop: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  line: { color: colors.text, fontWeight: '600' },
  input: {
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
  },
  row: { flexDirection: 'row', gap: 8 },
  btn: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnText: { color: colors.accent, fontWeight: '700', fontSize: 12 },
  cta: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ctaText: { color: '#111', fontWeight: '800' },
  authMsg: { color: colors.accent, fontWeight: '600' },
});
