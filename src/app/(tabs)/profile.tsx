import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Screen } from '@/components/app-shell';
import { Action, Chip, palette, ui } from '@/components/event-ui';
import { authenticate, endSession } from '@/lib/auth';
import { useEvents } from '@/lib/event-provider';
import { configured } from '@/lib/feed';

export default function Profile() {
  const { account, setAccount } = useEvents();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function submit() {
    if (!configured || busy) return;
    if (!email.trim() || !password) { setMessage('Enter your email and password.'); return; }
    setBusy(true);
    setMessage('');
    try {
      const session = await authenticate(mode, email.trim(), password);
      setPassword('');
      if (session) setAccount(session);
      else {
        setMode('signin');
        setMessage('Check your email to confirm your account, then sign in.');
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The account request failed.');
    } finally { setBusy(false); }
  }

  async function signOut() {
    if (!account || busy) return;
    setBusy(true);
    try { await endSession(account); setMessage(''); }
    catch { setMessage('Signed out on this device. The server could not confirm sign-out.'); }
    finally { setBusy(false); setAccount(null); }
  }

  return <Screen>
    <ScrollView contentContainerStyle={ui.content} keyboardShouldPersistTaps="handled">
      <AppHeader title="Profile" subtitle={account ? 'Your MTL NOW account' : 'You’re browsing as a guest.'} />
      {account ? <View style={ui.panel}>
        <Text style={ui.label}>Signed in as</Text>
        <Text style={ui.text}>{account.email}</Text>
        <Text style={ui.muted}>Chillz, likes, and favourites are stored on this device.</Text>
        <Action label={busy ? 'Signing out…' : 'Sign out'} onPress={() => void signOut()} />
      </View> : <View style={ui.panel}>
        <View style={[ui.row, { flexWrap: 'wrap' }]}>
          {(['signin', 'signup'] as const).map(value => <Chip key={value} selected={value === mode}
            label={value === 'signin' ? 'Sign in' : 'Create account'} onPress={() => {
              if (!busy) { setMode(value); setMessage(''); }
            }} />)}
        </View>
        <Text style={ui.label}>Email</Text>
        <TextInput style={styles.input} accessibilityLabel="Email" value={email} onChangeText={setEmail}
          autoCapitalize="none" autoCorrect={false} textContentType="emailAddress" keyboardType="email-address"
          placeholder="you@example.com" placeholderTextColor={palette.muted} editable={configured && !busy} />
        <Text style={ui.label}>Password</Text>
        <TextInput style={styles.input} accessibilityLabel="Password" value={password} onChangeText={setPassword}
          secureTextEntry autoCapitalize="none" textContentType={mode === 'signup' ? 'newPassword' : 'password'}
          onSubmitEditing={() => void submit()} editable={configured && !busy} />
        <Pressable accessibilityRole="button" disabled={!configured || busy} style={[ui.button, (!configured || busy) && { opacity: 0.55 }]} onPress={() => void submit()}>
          <Text style={ui.buttonText}>{busy ? 'Please wait…' : mode === 'signin' ? 'Sign in with email' : 'Create my account'}</Text>
        </Pressable>
        {!configured && <Text style={ui.muted}>Sign-in is unavailable until a Supabase project is connected. Guest browsing is available.</Text>}
      </View>}
      {message ? <Text accessibilityRole="alert" style={ui.text}>{message}</Text> : null}
    </ScrollView>
  </Screen>;
}

const styles = StyleSheet.create({
  input: { minHeight: 48, borderWidth: 1, borderColor: palette.border, borderRadius: 10, paddingHorizontal: 11, color: palette.text, fontSize: 16 },
});
