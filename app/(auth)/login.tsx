import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Colors, Fonts, Radius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import TextField from '@/components/ui/TextField';
import { useAuthContext } from '@/hooks/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuthContext();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Il manque un champ ou deux pour continuer');
      return;
    }
    if (!email.includes('@')) {
      setError('Cette adresse email ne semble pas complète');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <LinearGradient colors={[Colors.ink, Colors.primaryDark]} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={styles.hero}>
          <View style={styles.heroBlobA} />
          <View style={styles.heroBlobB} />
          <Animated.View entering={FadeInDown.duration(700).springify()} style={styles.heroContent}>
            <View style={styles.logoCircle}>
              <Logo size={38} variant="cream" />
            </View>
            <Text style={styles.appName}>AviConnect</Text>
            <Text style={styles.tagline}>Le marché avicole qui relie tout le Sénégal, ferme après ferme.</Text>
          </Animated.View>
        </LinearGradient>

        {/* Carte formulaire */}
        <Animated.View entering={FadeInUp.duration(600).delay(150).springify()} style={styles.cardShell}>
          <View style={styles.card}>
            <Text style={styles.title}>Content de te revoir</Text>
            <Text style={styles.subtitle}>Connecte-toi pour retrouver tes annonces et tes échanges.</Text>

            <TextField
              label="Adresse email"
              placeholder="exemple@email.com"
              value={email}
              onChangeText={(t) => { setEmail(t); setError(''); }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextField
              label="Mot de passe"
              placeholder="••••••••"
              value={password}
              onChangeText={(t) => { setPassword(t); setError(''); }}
              secureTextEntry
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push('/(auth)/forgot-password' as any)}
            >
              <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>
            <Button
              title={loading ? '' : 'Se connecter'}
              onPress={handleLogin}
              loading={loading}
              showArrow
              fullWidth
              style={{ marginTop: 18 }}
            />

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
              <Text style={styles.link}>
                Pas encore de compte ? <Text style={styles.linkBold}>Inscris-toi</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1 },

  hero: {
    paddingTop: Platform.OS === 'ios' ? 92 : 72,
    paddingBottom: 64,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },
  heroBlobA: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(240,247,240,0.05)', top: -100, right: -70 },
  heroBlobB: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(201,154,70,0.10)', bottom: -40, left: -30 },
  heroContent: { alignItems: 'center' },
  logoCircle: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: 'rgba(247,242,233,0.1)',
    borderWidth: 1, borderColor: 'rgba(247,242,233,0.18)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  appName: { fontSize: 30, fontFamily: Fonts.display, color: Colors.textOnDark, letterSpacing: -0.3 },
  tagline: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textOnDarkMuted, marginTop: 10, textAlign: 'center', lineHeight: 21, maxWidth: 280 },

  cardShell: { marginTop: -40, width: '100%', maxWidth: 470, alignSelf: 'center', paddingHorizontal: 18, marginBottom: 32 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 26,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  title: { fontSize: 22, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 22, lineHeight: 19 },
  error: { color: Colors.error, fontSize: 13, marginTop: 8, marginBottom: 2, fontFamily: Fonts.bodyMedium },
  forgotRow: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { fontSize: 13, color: Colors.primary, fontFamily: Fonts.bodyBold },
  linkRow: { marginTop: 22, alignItems: 'center' },
  link: { fontSize: 14, color: Colors.textMuted, fontFamily: Fonts.body },
  linkBold: { color: Colors.primary, fontFamily: Fonts.bodyBold },
});
