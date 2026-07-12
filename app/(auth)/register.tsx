import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChevronLeft, Egg, ShoppingBag, Factory, Stethoscope } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { useAuthContext } from '@/hooks/AuthContext';
import { registerUserInRegistry, savePassword, getAdminId } from '@/hooks/useAuth';
import { REGIONS } from '@/constants/mockData';

const NOTIF_KEY_PREFIX = '@aviconnect_notifs_';
// Clé fixe pour les notifs admin (indépendante du compte admin)
const ADMIN_NOTIF_KEY = '@aviconnect_notifs_admin';

async function pushAdminNotif(notif: object) {
  try {
    // Stocke dans la clé fixe admin ET dans la clé du compte admin s'il existe
    const keys: string[] = [ADMIN_NOTIF_KEY];
    const adminId = await getAdminId();
    if (adminId) keys.push(`${NOTIF_KEY_PREFIX}${adminId}`);
    for (const key of keys) {
      let existing: any[] = [];
      try {
        const raw = Platform.OS === 'web'
          ? localStorage.getItem(key)
          : await AsyncStorage.getItem(key);
        existing = raw ? JSON.parse(raw) : [];
      } catch {}
      const updated = JSON.stringify([notif, ...existing]);
      if (Platform.OS === 'web') localStorage.setItem(key, updated);
      else await AsyncStorage.setItem(key, updated);
    }
  } catch {}
}

async function notifyAdminVet(vetNom: string, vetId: string) {
  await pushAdminNotif({
    id: Date.now(),
    type: 'vet_inscription',
    title: '💉 Nouveau vétérinaire à valider',
    body: `${vetNom} vient de s'inscrire comme vétérinaire. Vérifiez et validez son profil.`,
    date: new Date().toISOString(),
    read: false,
    vetId,
  });
}

async function notifyAdmin(couvoirNom: string, couvoirId: string) {
  try {
    const adminId = await getAdminId();
    if (!adminId) return;
    const key = `${NOTIF_KEY_PREFIX}${adminId}`;
    const notif = {
      id: Date.now(),
      type: 'couvoir_inscription',
      title: '🏭 Nouveau couvoir à valider',
      body: `${couvoirNom} vient de s'inscrire comme couvoir. Vérifiez et validez son profil.`,
      date: new Date().toISOString(),
      read: false,
      couvoirId,
    };
    let existing: any[] = [];
    try {
      const raw = Platform.OS === 'web'
        ? localStorage.getItem(key)
        : await AsyncStorage.getItem(key);
      existing = raw ? JSON.parse(raw) : [];
    } catch {}
    const updated = JSON.stringify([notif, ...existing]);
    if (Platform.OS === 'web') localStorage.setItem(key, updated);
    else await AsyncStorage.setItem(key, updated);
  } catch {}
}

const ROLES = [
  { key: 'eleveur',     Icon: Egg,          label: 'Éleveur',      desc: 'Je vends volailles, poussins ou œufs' },
  { key: 'acheteur',    Icon: ShoppingBag,  label: 'Acheteur',     desc: "Je cherche des produits avicoles" },
  { key: 'couvoir',     Icon: Factory,      label: 'Couvoir',      desc: 'Je fournis des poussins certifiés' },
  { key: 'veterinaire', Icon: Stethoscope,  label: 'Vétérinaire',  desc: 'Je propose soins et vaccins avicoles' },
] as const;

function generateId(): string {
  return `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function RegisterScreen() {
  const { signIn } = useAuthContext();
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

  const handleRegister = async () => {
    if (!prenom.trim() || !nom.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError('Quelques champs obligatoires (*) restent à remplir');
      return;
    }
    if (!email.includes('@')) {
      setError('Cette adresse email ne semble pas valide');
      return;
    }
    if (password.length < 6) {
      setError('Ton mot de passe doit faire au moins 6 caractères');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setError('Ton numéro sénégalais doit faire 9 chiffres');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const newUser = {
      id: generateId(),
      phone: digits,
      email: email.toLowerCase().trim(),
      prenom: prenom.trim(),
      nom: nom.trim(),
      ferme: ferme.trim() || undefined,
      region,
      role,
      verified: false,
      blocked: false,
      ...(role === 'couvoir' ? { couvoirStatus: 'pending' as const } : {}),
      ...(role === 'veterinaire' ? { vetStatus: 'pending' as const } : {}),
    };

    await registerUserInRegistry(newUser);
    await savePassword(newUser.id, password);

    if (role === 'couvoir') {
      await notifyAdmin(
        `${newUser.prenom} ${newUser.nom}${newUser.ferme ? ` (${newUser.ferme})` : ''}`,
        newUser.id
      );
    }
    if (role === 'veterinaire') {
      await notifyAdminVet(
        `${newUser.prenom} ${newUser.nom}${newUser.ferme ? ` (${newUser.ferme})` : ''}`,
        newUser.id
      );
    }

    const result = await signIn(newUser);
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
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <TextField label="Prénom *" value={prenom} onChangeText={setPrenom} placeholder="Moussa" />
            </View>
            <View style={{ flex: 1 }}>
              <TextField label="Nom *" value={nom} onChangeText={setNom} placeholder="Diallo" />
            </View>
          </View>

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
            label="Mot de passe * (min. 6 caractères)"
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
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
            {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.regionPill, region === r && styles.regionPillActive]}
                onPress={() => setRegion(r)}
              >
                <Text style={[styles.regionText, region === r && styles.regionTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

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
