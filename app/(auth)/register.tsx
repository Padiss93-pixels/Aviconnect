import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChevronLeft, Egg, ShoppingBag, Factory, Stethoscope } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import PillRow from '@/components/PillRow';
import { useAuthContext } from '@/hooks/AuthContext';
import { REGIONS } from '@/constants/mockData';

// Les notifications admin (nouveau couvoir / vétérinaire à valider) sont
// désormais créées côté serveur par le trigger `notify_admins_on_signup`.

const ROLES = [
  { key: 'eleveur',     Icon: Egg,          label: 'Éleveur',      desc: 'Je vends volailles, poussins ou œufs' },
  { key: 'acheteur',    Icon: ShoppingBag,  label: 'Acheteur',     desc: "Je cherche des produits avicoles" },
  { key: 'couvoir',     Icon: Factory,      label: 'Couvoir',      desc: 'Je fournis des poussins certifiés' },
  { key: 'veterinaire', Icon: Stethoscope,  label: 'Vétérinaire',  desc: 'Je propose soins et vaccins avicoles' },
] as const;

export default function RegisterScreen() {
  const { signUp } = useAuthContext();
  const [role, setRole] = useState<'eleveur' | 'acheteur' | 'couvoir' | 'veterinaire'>('eleveur');
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [ferme, setFerme] = useState('');
  const [region, setRegion] = useState('Dakar');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleRegister = async () => {
    const nomRequired = role === 'couvoir' ? prenom.trim() : (prenom.trim() && nom.trim());
    if (!nomRequired || !email.trim() || !password.trim() || !phone.trim()) {
      setError('Quelques champs obligatoires (*) restent à remplir');
      return;
    }
    const emailClean = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailClean) || emailClean.length > 254) {
      setError('Cette adresse email ne semble pas valide');
      return;
    }
    if (password.length < 8) {
      setError('Ton mot de passe doit faire au moins 8 caractères');
      return;
    }
    if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) {
      setError('Ton mot de passe doit contenir au moins une lettre et un chiffre');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (!/^7\d{8}$/.test(digits)) {
      setError('Ton numéro mobile sénégalais doit faire 9 chiffres et commencer par 7');
      return;
    }
    setError('');
    setLoading(true);

    // L'unicité de l'email est garantie par Supabase Auth.
    const result = await signUp({
      email: emailClean,
      password,
      prenom: role === 'couvoir' ? prenom.trim().slice(0, 80) : prenom.trim().slice(0, 60),
      nom: role === 'couvoir' ? '' : nom.trim().slice(0, 60),
      phone: digits,
      role,
      region,
      ferme: ferme.trim().slice(0, 80) || undefined,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setConfirmationSent(true);
      return;
    }
    router.replace('/(tabs)');
  };

  if (confirmationSent) {
    return (
      <View style={styles.confirmContainer}>
        <Text style={styles.confirmIcon}>📬</Text>
        <Text style={styles.confirmTitle}>Vérifie ta boîte mail</Text>
        <Text style={styles.confirmText}>
          On t'a envoyé un lien de confirmation à{'\n'}
          <Text style={styles.confirmEmail}>{email.toLowerCase().trim()}</Text>
          {'\n\n'}Clique dessus pour activer ton compte, puis connecte-toi.
        </Text>
        <Button
          title="Aller à la connexion"
          onPress={() => router.replace('/(auth)/login')}
          showArrow
          fullWidth
          style={{ marginTop: 28, maxWidth: 320 }}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.back} hitSlop={10}>
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={1.8} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(500).springify()}>
          <Text style={styles.title}>Bienvenue chez toi</Text>
          <Text style={styles.subtitle}>Crée ton compte et rejoins le marché avicole du Sénégal.</Text>

          {/* Rôle */}
          <Text style={styles.sectionLabel}>Ton profil</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => (
              <TouchableOpacity
                key={r.key}
                style={[styles.roleCard, role === r.key && styles.roleCardActive]}
                onPress={() => setRole(r.key)}
                activeOpacity={0.85}
              >
                <View style={[styles.roleIconBox, role === r.key && styles.roleIconBoxActive]}>
                  <r.Icon size={18} color={role === r.key ? Colors.primary : Colors.textMuted} strokeWidth={1.7} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleLabel, role === r.key && styles.roleLabelActive]}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Identité */}
          <Text style={styles.sectionLabel}>Identité</Text>
          {role === 'couvoir' ? (
            <TextField label="Nom du couvoir *" value={prenom} onChangeText={setPrenom} placeholder="Couvoir Avicole Dakar" />
          ) : (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <TextField label="Prénom *" value={prenom} onChangeText={setPrenom} placeholder="Moussa" />
              </View>
              <View style={{ flex: 1 }}>
                <TextField label="Nom *" value={nom} onChangeText={setNom} placeholder="Diallo" />
              </View>
            </View>
          )}

          {/* Email */}
          <Text style={styles.sectionLabel}>Connexion</Text>
          <TextField
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="exemple@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextField
            label="Mot de passe * (min. 8 caractères, lettres + chiffres)"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />
          <TextField
            label="Confirme le mot de passe *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          {/* Téléphone */}
          <Text style={styles.sectionLabel}>Téléphone sénégalais</Text>
          <Text style={styles.label}>Numéro *</Text>
          <View style={styles.phoneRow}>
            <View style={styles.prefix}>
              <Text style={styles.prefixText}>+221</Text>
            </View>
            <View style={{ flex: 1 }}>
              <TextField value={phone} onChangeText={setPhone} placeholder="77 123 45 67" keyboardType="phone-pad" maxLength={12} />
            </View>
          </View>

          {/* Ferme */}
          {(role === 'eleveur' || role === 'couvoir') && (
            <>
              <Text style={styles.sectionLabel}>Exploitation</Text>
              <TextField label="Nom de la ferme ou du couvoir" value={ferme} onChangeText={setFerme} placeholder="Ferme Diallo" />
            </>
          )}
          {role === 'veterinaire' && (
            <>
              <Text style={styles.sectionLabel}>Cabinet</Text>
              <TextField label="Nom du cabinet (facultatif)" value={ferme} onChangeText={setFerme} placeholder="Cabinet Vétérinaire Dakar" />
            </>
          )}

          {/* Région */}
          <Text style={styles.sectionLabel}>Ta région *</Text>
          <PillRow style={styles.regionScroll}>
            {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.regionPill, region === r && styles.regionPillActive]}
                onPress={() => setRegion(r)}
              >
                <Text style={[styles.regionText, region === r && styles.regionTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </PillRow>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            title="Créer mon compte"
            onPress={handleRegister}
            loading={loading}
            showArrow
            fullWidth
            style={{ marginTop: 22 }}
          />

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkRow}>
            <Text style={styles.link}>Déjà inscrit ? <Text style={styles.linkBold}>Se connecter</Text></Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  confirmContainer: {
    flex: 1, backgroundColor: Colors.background, alignItems: 'center',
    justifyContent: 'center', padding: 32,
  },
  confirmIcon: { fontSize: 56, marginBottom: 18 },
  confirmTitle: { fontSize: 24, fontFamily: Fonts.display, color: Colors.text, marginBottom: 12 },
  confirmText: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 22 },
  confirmEmail: { color: Colors.primary, fontFamily: Fonts.bodyBold },
  scroll: { padding: 24, paddingTop: 60, width: '100%', maxWidth: 580, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 20, alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.bodySemiBold },
  title: { fontSize: 25, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 26, lineHeight: 20 },
  sectionLabel: {
    fontSize: 11.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.1,
    marginBottom: 12, marginTop: 24,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border, paddingBottom: 8,
  },
  roleGrid: { gap: 9 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, padding: 13, backgroundColor: Colors.surface,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleIconBox: { width: 38, height: 38, borderRadius: 12, backgroundColor: Colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  roleIconBoxActive: { backgroundColor: Colors.primaryTint },
  roleLabel: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text },
  roleLabelActive: { color: Colors.primaryDark },
  roleDesc: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  row: { flexDirection: 'row' },
  label: { fontSize: 12.5, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 7, marginTop: 12 },
  phoneRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  prefix: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 15, marginTop: 12,
  },
  prefixText: { fontSize: 14, color: Colors.primaryDark, fontFamily: Fonts.bodyBold },
  regionScroll: { marginTop: 2 },
  regionPill: {
    paddingHorizontal: 15, paddingVertical: 9, borderRadius: Radius.pill,
    borderWidth: 1.5, borderColor: Colors.border,
    marginRight: 8, backgroundColor: Colors.surface,
  },
  regionPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  regionText: { fontSize: 13, color: Colors.textMuted, fontFamily: Fonts.bodyMedium },
  regionTextActive: { color: '#fff', fontFamily: Fonts.bodyBold },
  error: { color: Colors.error, fontSize: 13, marginTop: 16, fontFamily: Fonts.bodyMedium },
  linkRow: { marginTop: 20, alignItems: 'center' },
  link: { fontSize: 14, color: Colors.textMuted, fontFamily: Fonts.body },
  linkBold: { color: Colors.primary, fontFamily: Fonts.bodyBold },
});
