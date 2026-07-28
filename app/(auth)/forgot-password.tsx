import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Logo from '@/components/ui/Logo';
import { supabase } from '@/lib/supabase';

function resetRedirectUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/reset-password`;
  }
  // Deep link natif — à déclarer dans Supabase : Authentication → URL Configuration → Redirect URLs
  return 'aviconnect://reset-password';
}

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      setError('Entrez une adresse email valide');
      return;
    }
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(clean, {
      redirectTo: resetRedirectUrl(),
    });
    setLoading(false);
    if (err) {
      const m = err.message.toLowerCase();
      setError(
        m.includes('rate limit') || m.includes('too many')
          ? 'Trop de demandes. Réessaye dans quelques minutes.'
          : 'Impossible d\'envoyer l\'email pour le moment. Réessaye plus tard.'
      );
      return;
    }
    // Toujours afficher le succès : ne révèle pas si l'email existe (anti-énumération)
    setSent(true);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Logo size={42} variant="cream" />
          </View>
        </View>

        <View style={styles.card}>
          {!sent ? (
            <>
              <TouchableOpacity
                onPress={() => router.canGoBack() ? router.back() : router.replace('/(auth)/login')}
                style={styles.backRow}
              >
                <Text style={styles.backText}>← Retour</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Entre l'email de ton compte. On t'enverra un lien pour choisir un nouveau mot de passe.
              </Text>

              <Text style={styles.label}>Adresse email</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>📧</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setError(''); }}
                  placeholder="exemple@email.com"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (!email.trim() || loading) && styles.btnDisabled]}
                onPress={handleSend}
                disabled={!email.trim() || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer le lien →</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successBox}>
              <Text style={styles.successBigIcon}>📬</Text>
              <Text style={styles.successTitle}>Email envoyé !</Text>
              <Text style={styles.successSub}>
                Si un compte existe avec cette adresse, tu recevras un lien de
                réinitialisation dans quelques instants. Pense à vérifier tes spams.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { marginTop: 24, alignSelf: 'stretch' }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.btnText}>Retour à la connexion →</Text>
              </TouchableOpacity>
            </View>
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

  backRow: { marginBottom: 16 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },

  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textLight, lineHeight: 21, marginBottom: 20 },

  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 12, marginBottom: 4,
  },
  inputIcon: { fontSize: 18, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 13 },

  error: { color: Colors.error, fontSize: 13, marginTop: 6, marginBottom: 4 },

  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  successBox: { alignItems: 'center', paddingVertical: 12 },
  successBigIcon: { fontSize: 64, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 21 },
});
