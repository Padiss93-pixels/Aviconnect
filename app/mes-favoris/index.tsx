import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { router } from 'expo-router';
import { Heart, UserCheck } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useFavorites } from '@/hooks/FavoritesContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBoost } from '@/hooks/BoostContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { supabase } from '@/lib/supabase';
import LotGrid from '@/components/LotGrid';

type Tab = 'annonces' | 'abonnements';

type FollowedProfile = {
  id: string;
  prenom: string;
  nom: string;
  role: string;
  region?: string;
  photo?: string;
};

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur', couvoir: 'Couvoir', veterinaire: 'Vétérinaire', acheteur: 'Acheteur',
};
const ROLE_EMOJIS: Record<string, string> = {
  eleveur: '🐔', couvoir: '🏭', veterinaire: '💉', acheteur: '🛒',
};

export default function MesFavorisScreen() {
  const [tab, setTab] = useState<Tab>('annonces');
  const { favoriteIds } = useFavorites();
  const { annonces } = useAnnonces();
  const { boostedAnnonceIds } = useBoost();
  const { user, getAllUsers } = useAuthContext();

  const [followed, setFollowed] = useState<FollowedProfile[]>([]);
  const [loadingFollows, setLoadingFollows] = useState(false);

  const favLots = annonces.filter((l) => favoriteIds.has(l.id));

  useEffect(() => {
    if (!user?.id) return;
    setLoadingFollows(true);
    Promise.all([
      supabase
        .from('follows')
        .select('followed_id, profiles:followed_id(id, prenom, nom, role, region)')
        .eq('follower_id', user.id),
      getAllUsers(),
    ]).then(([{ data }, allUsers]) => {
      if (data) {
        const localMap = new Map(allUsers.map((u) => [u.id, u]));
        setFollowed(
          data
            .map((r: any) => r.profiles)
            .filter(Boolean)
            .map((p: any) => ({ ...p, photo: localMap.get(p.id)?.photo ?? undefined }))
        );
      }
      setLoadingFollows(false);
    });
  }, [user?.id]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes favoris</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'annonces' && styles.tabActive]}
          onPress={() => setTab('annonces')}
        >
          <Heart size={14} color={tab === 'annonces' ? Colors.accent : Colors.textMuted} strokeWidth={2} fill={tab === 'annonces' ? Colors.accent : 'transparent'} />
          <Text style={[styles.tabText, tab === 'annonces' && styles.tabTextActive]}>
            Annonces
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'abonnements' && styles.tabActive]}
          onPress={() => setTab('abonnements')}
        >
          <UserCheck size={14} color={tab === 'abonnements' ? Colors.primary : Colors.textMuted} strokeWidth={2} />
          <Text style={[styles.tabText, tab === 'abonnements' && styles.tabTextActive]}>
            Abonnements {followed.length > 0 ? `(${followed.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Onglet Annonces */}
      {tab === 'annonces' && (
        favLots.length === 0 ? (
          <View style={styles.empty}>
            <Heart size={56} color={Colors.border} strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>Aucun favori</Text>
            <Text style={styles.emptySub}>Appuyez sur le cœur d'une annonce pour la retrouver ici.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)/marches' as any)}>
              <Text style={styles.browseBtnText}>Explorer le marché</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={styles.count}>{favLots.length} annonce{favLots.length > 1 ? 's' : ''} sauvegardée{favLots.length > 1 ? 's' : ''}</Text>
            <LotGrid lots={favLots} boostedIds={boostedAnnonceIds} />
          </ScrollView>
        )
      )}

      {/* Onglet Abonnements */}
      {tab === 'abonnements' && (
        followed.length === 0 ? (
          <View style={styles.empty}>
            <UserCheck size={56} color={Colors.border} strokeWidth={1.4} />
            <Text style={styles.emptyTitle}>Aucun abonnement</Text>
            <Text style={styles.emptySub}>Suivez des vendeurs depuis leur profil pour les retrouver ici.</Text>
            <TouchableOpacity style={styles.browseBtn} onPress={() => router.replace('/(tabs)/marches' as any)}>
              <Text style={styles.browseBtnText}>Explorer le marché</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={styles.count}>{followed.length} profil{followed.length > 1 ? 's' : ''} suivi{followed.length > 1 ? 's' : ''}</Text>
            {followed.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.profileCard}
                onPress={() => router.push({ pathname: '/vendeur/[id]', params: { id: p.id } })}
                activeOpacity={0.85}
              >
                {p.photo ? (
                  <Image source={{ uri: p.photo }} style={styles.profileAvatarImg} />
                ) : (
                  <View style={styles.profileAvatar}>
                    <Text style={styles.profileInitials}>
                      {p.prenom.charAt(0)}{p.nom ? p.nom.charAt(0) : ''}
                    </Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileRole}>{ROLE_EMOJIS[p.role] ?? '👤'} {ROLE_LABELS[p.role] ?? p.role}</Text>
                  <Text style={styles.profileName}>{p.prenom} {p.nom}</Text>
                  {p.region && <Text style={styles.profileRegion}>📍 {p.region}</Text>}
                </View>
                <Text style={styles.profileArrow}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )
      )}
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

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  tabTextActive: { color: Colors.text, fontFamily: Fonts.bodyBold },

  list: { padding: 16, paddingBottom: 60 },
  count: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginBottom: 14 },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 36, gap: 12 },
  emptyTitle: { fontSize: 20, fontFamily: Fonts.bodyBold, color: Colors.text },
  emptySub: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', lineHeight: 21 },
  browseBtn: {
    marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 13, paddingHorizontal: 28,
  },
  browseBtnText: { color: '#fff', fontSize: 14, fontFamily: Fonts.bodyBold },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  profileAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center',
  },
  profileAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  profileInitials: { fontSize: 17, fontFamily: Fonts.bodyExtraBold, color: Colors.primaryDark },
  profileRole: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginBottom: 2 },
  profileName: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  profileRegion: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  profileArrow: { fontSize: 18, color: Colors.textMuted },
});
