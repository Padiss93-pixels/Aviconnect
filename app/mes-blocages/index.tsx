import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { ShieldOff } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useModeration } from '@/hooks/ModerationContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { supabase } from '@/lib/supabase';

// Liste des utilisateurs bloqués, avec déblocage.
// Apple 1.2 exige que le blocage soit réversible et visible par l'utilisateur.

type BlockedProfile = { id: string; prenom: string; nom: string; role: string; region?: string };

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur', couvoir: 'Couvoir', veterinaire: 'Vétérinaire', acheteur: 'Acheteur',
};

export default function MesBlocagesScreen() {
  const { user } = useAuthContext();
  const { blockedIds, unblockUser } = useModeration();
  const [profiles, setProfiles] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const ids = [...blockedIds];

  const load = useCallback(async () => {
    if (ids.length === 0) { setProfiles([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, prenom, nom, role, region')
      .in('id', ids);
    setProfiles((data as BlockedProfile[]) ?? []);
    setLoading(false);
  }, [ids.join(',')]);

  useEffect(() => { load(); }, [load]);

  if (!user) {
    return (
      <View style={styles.container}>
        <Header />
        <View style={styles.empty}>
          <Text style={styles.emptySub}>Connectez-vous pour gérer vos blocages.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header />

      {loading ? (
        <View style={styles.empty}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : profiles.length === 0 ? (
        <View style={styles.empty}>
          <ShieldOff size={56} color={Colors.border} strokeWidth={1.4} />
          <Text style={styles.emptyTitle}>Aucun utilisateur bloqué</Text>
          <Text style={styles.emptySub}>
            Depuis une annonce ou un profil, vous pouvez bloquer un utilisateur : ses annonces et
            ses demandes disparaîtront de votre marché.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          <Text style={styles.count}>
            {profiles.length} utilisateur{profiles.length > 1 ? 's' : ''} bloqué{profiles.length > 1 ? 's' : ''}
          </Text>
          {profiles.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.initials}>
                  {p.prenom.charAt(0)}{p.nom ? p.nom.charAt(0) : ''}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.role}>{ROLE_LABELS[p.role] ?? p.role}</Text>
                <Text style={styles.name}>{p.prenom} {p.nom}</Text>
                {p.region ? <Text style={styles.region}>📍 {p.region}</Text> : null}
              </View>
              <TouchableOpacity
                style={styles.unblockBtn}
                onPress={() => unblockUser(p.id)}
                activeOpacity={0.85}
              >
                <Text style={styles.unblockText}>Débloquer</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        hitSlop={12}
      >
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Utilisateurs bloqués</Text>
      <View style={{ width: 32 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontFamily: Fonts.bodyBold, color: '#fff' },

  list: { padding: 16, paddingBottom: 60 },
  count: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginBottom: 14 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.surfaceTertiary,
    justifyContent: 'center', alignItems: 'center',
  },
  initials: { fontSize: 16, fontFamily: Fonts.bodyExtraBold, color: Colors.textTertiary },
  role: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginBottom: 2 },
  name: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  region: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },

  unblockBtn: {
    borderRadius: Radius.pill, paddingVertical: 9, paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderWidth: 1, borderColor: Colors.primary,
  },
  unblockText: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.primary },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.bodyBold, color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
});
