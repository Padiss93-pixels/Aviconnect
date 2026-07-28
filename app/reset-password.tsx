import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Logo from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';

// Écran atteint via le lien email de réinitialisation.
// Sur le web, detectSessionInUrl consomme le token de récupération et ouvre
// une session temporaire qui autorise updateUser({ password }).
export default function ResetPasswordScreen() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Petit délai : laisser detectSessionInUrl consommer le token du lien
    const t = setTimeout(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSession(!!session);
      setChecking(false);
    }, 600);
    return () => clearTimeout(t);
  }, []);

  const handleReset = async () => {
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('Le mot de passe doit contenir au moins une lettre et un chiffre');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError('Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — redemande un email.');
      return;
    }
    setDone(true);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Logo size={42} variant="cream" />
          </View>
        </View>

        <View style={styles.card}>
          {checking ? (
            <View style={styles.centerBox}>
              <ActivityIndicator color={Colors.primary} size="large" />
            </View>
          ) : done ? (
            <View style={styles.centerBox}>
              <Text style={styles.bigIcon}>✅</Text>
              <Text style={styles.title}>Mot de passe mis à jour !</Text>
              <Text style={styles.subtitle}>Tu peux maintenant te connecter avec ton nouveau mot de passe.</Text>
              <TouchableOpacity style={[styles.btn, { alignSelf: 'stretch', marginTop: 20 }]} onPress={() => router.replace('/(auth)/login')}>
                <Text style={styles.btnText}>Se connecter →</Text>
              </TouchableOpacity>
            </View>
          ) : !hasSession ? (
            <View style={styles.centerBox}>
              <Text style={styles.bigIcon}>⏳</Text>
              <Text style={styles.title}>Lien invalide ou expiré</Text>
              <Text style={styles.subtitle}>
                Ce lien de réinitialisation n'est plus valide. Redemande un email depuis « Mot de passe oublié ».
              </Text>
              <TouchableOpacity style={[styles.btn, { alignSelf: 'stretch', marginTop: 20 }]} onPress={() => router.replace('/(auth)/forgot-password' as any)}>
                <Text style={styles.btnText}>Redemander un lien →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.bigIcon}>🔓</Text>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>Choisis un mot de passe sécurisé (8+ caractères, lettres et chiffres).</Text>

              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={(t) => { setPassword(t); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!show}
                />
                <TouchableOpacity onPress={() => setShow((v) => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{show ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={confirm}
                  onChangeText={(t) => { setConfirm(t); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!show}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (password.length < 8 || loading) && styles.btnDisabled]}
                onPress={handleReset}
                disabled={password.length < 8 || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Mettre à jour →</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },
  logoRow: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
    width: '100%', maxWidth: 470, alignSelf: 'center',
  },
  centerBox: { alignItems: 'center', paddingVertical: 16 },
  bigIcon: { fontSize: 48, marginBottom: 10, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textLight, lineHeight: 21, marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 8 },
  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 12, marginBottom: 4,
  },
  input: { fontSize: 15, color: Colors.text, paddingVertical: 13 },
  eyeBtn: { padding: 6 },
  eyeText: { fontSize: 18 },
  error: { color: Colors.error, fontSize: 13, marginTop: 6, marginBottom: 4 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
