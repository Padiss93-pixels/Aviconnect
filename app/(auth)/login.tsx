import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { Mail, Phone } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import Logo from '@/components/ui/Logo';
import TextField from '@/components/ui/TextField';
import { useAuthContext } from '@/hooks/AuthContext';
import { getAllUsers, registerUserInRegistry, verifyPassword, hasPassword } from '@/hooks/useAuth';

export default function LoginScreen() {
  const { signIn } = useAuthContext();
  const [mode, setMode] = useState<'email' | 'phone'>('email');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Il manque un champ ou deux pour continuer');
      return;
    }
    if (!email.includes('@')) {
      setError('Cette adresse email ne semble pas complète');
      return;
    }
    if (password.length < 6) {
      setError('Ton mot de passe doit faire au moins 6 caractères');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const emailLower = email.toLowerCase().trim();
    const isAdmin = emailLower === 'admin@aviconnect.sn';

    // Chercher l'utilisateur dans le registre
    const users = await getAllUsers();
    const existing = users.find((u) => u.email?.toLowerCase() === emailLower);

    if (existing) {
      // Utilisateur connu — vérifier s'il est bloqué
      if (existing.blocked) {
        setLoading(false);
        setError('Ton compte a été suspendu. Écris-nous, on regarde ça avec toi.');
        return;
      }
      // Vérifier le mot de passe s'il en a un enregistré
      const pwdSet = await hasPassword(existing.id);
      if (pwdSet) {
        const ok = await verifyPassword(existing.id, password);
        if (!ok) {
          setLoading(false);
          setError('Ce mot de passe ne correspond pas.');
          return;
        }
      }
      const result = await signIn(existing);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
    } else {
      // Nouveau compte (demo) ou admin
      const newUser = {
        id: isAdmin ? 'admin_001' : `u_${Date.now()}`,
        phone: '',
        email: emailLower,
        prenom: isAdmin ? 'Admin' : emailLower.split('@')[0],
        nom: isAdmin ? 'AviConnect' : '',
        region: 'Dakar',
        role: isAdmin ? ('admin' as const) : ('eleveur' as const),
        verified: isAdmin,
        blocked: false,
      };
      await registerUserInRegistry(newUser);
      const result = await signIn(newUser);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
    }

    router.replace('/(tabs)');
  };

  const handlePhoneLogin = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Ce numéro ne fait pas encore 9 chiffres');
      return;
    }

    setError('');
    setLoading(true);

    // Vérifier si ce numéro est bloqué
    const users = await getAllUsers();
    const existing = users.find((u) => u.phone === digits);
    if (existing?.blocked) {
      setLoading(false);
      setError('Ton compte a été suspendu. Écris-nous, on regarde ça avec toi.');
      return;
    }

    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push({ pathname: '/(auth)/otp', params: { phone: digits } });
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

            {/* Toggle */}
            <View style={styles.toggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'email' && styles.toggleBtnActive]}
                onPress={() => { setMode('email'); setError(''); }}
              >
                <Mail size={15} color={mode === 'email' ? Colors.primary : Colors.textMuted} strokeWidth={1.8} />
                <Text style={[styles.toggleText, mode === 'email' && styles.toggleTextActive]}>Email</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleBtn, mode === 'phone' && styles.toggleBtnActive]}
                onPress={() => { setMode('phone'); setError(''); }}
              >
                <Phone size={15} color={mode === 'phone' ? Colors.primary : Colors.textMuted} strokeWidth={1.8} />
                <Text style={[styles.toggleText, mode === 'phone' && styles.toggleTextActive]}>Téléphone</Text>
              </TouchableOpacity>
            </View>

            {/* Email + Mot de passe */}
            {mode === 'email' && (
              <View>
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
                  onPress={handleEmailLogin}
                  loading={loading}
                  showArrow
                  fullWidth
                  style={{ marginTop: 18 }}
                />
              </View>
            )}

            {/* Numéro sénégalais */}
            {mode === 'phone' && (
              <View>
                <Text style={styles.label}>Numéro sénégalais</Text>
                <View style={styles.phoneRow}>
                  <View style={styles.prefix}>
                    <Text style={styles.prefixText}>+221</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      placeholder="77 123 45 67"
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={(t) => { setPhone(t); setError(''); }}
                      maxLength={12}
                    />
                  </View>
                </View>
                <Text style={styles.hint}>On t'envoie un code de vérification par SMS.</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TouchableOpacity
                  style={styles.forgotRow}
                  onPress={() => router.push('/(auth)/forgot-password' as any)}
                >
                  <Text style={styles.forgotText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
                <Button
                  title={loading ? '' : 'Recevoir le code'}
                  onPress={handlePhoneLogin}
                  loading={loading}
                  showArrow
                  fullWidth
                  style={{ marginTop: 18 }}
                />
              </View>
            )}

            <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
              <Text style={styles.link}>
                Pas encore de compte ? <Text style={styles.linkBold}>Inscris-toi</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Text style={styles.demoHint}>Démo · email admin@aviconnect.sn · mot de passe 123456</Text>
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

  cardShell: { marginTop: -40, width: '100%', maxWidth: 470, alignSelf: 'center', paddingHorizontal: 18 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: 26,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  title: { fontSize: 22, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 22, lineHeight: 19 },
  toggle: {
    flexDirection: 'row', backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.md, padding: 4, marginBottom: 6,
  },
  toggleBtn: {
    flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 11, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
  },
  toggleBtnActive: { backgroundColor: Colors.surface, ...Platform.select({ web: { boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } as any, default: { elevation: 2 } }) },
  toggleText: { fontSize: 13.5, color: Colors.textMuted, fontFamily: Fonts.bodyMedium },
  toggleTextActive: { color: Colors.primary, fontFamily: Fonts.bodyBold },
  label: { fontSize: 12.5, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 7, marginTop: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  prefix: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 15,
  },
  prefixText: { fontSize: 14, color: Colors.primaryDark, fontFamily: Fonts.bodyBold },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 2, marginBottom: 4, fontFamily: Fonts.body },
  error: { color: Colors.error, fontSize: 13, marginTop: 8, marginBottom: 2, fontFamily: Fonts.bodyMedium },
  forgotRow: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { fontSize: 13, color: Colors.primary, fontFamily: Fonts.bodyBold },
  linkRow: { marginTop: 22, alignItems: 'center' },
  link: { fontSize: 14, color: Colors.textMuted, fontFamily: Fonts.body },
  linkBold: { color: Colors.primary, fontFamily: Fonts.bodyBold },
  demoHint: { textAlign: 'center', color: Colors.textMuted, fontSize: 11, marginTop: 20, marginBottom: 28, fontFamily: Fonts.body },
});
