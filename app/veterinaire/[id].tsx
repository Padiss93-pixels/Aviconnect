import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Image, Linking, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { Fonts, Radius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';
import { useVetContext, ProduitVet } from '@/hooks/VetContext';
import { User } from '@/hooks/useAuth';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = (SCREEN_W - 16 * 2 - 10) / 2;

const CATEGORIE_ICONS: Record<string, string> = {
  vaccin: '💉',
  vitamine: '🧪',
  medicament: '💊',
  autre: '📦',
};

export default function VeterinaireProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getAllUsers } = useAuthContext();
  const { getProfilVet } = useVetContext();

  const [vet, setVet] = useState<User | null>(null);
  const [photo, setPhoto] = useState<string | undefined>();
  const [catalogue, setCatalogue] = useState<ProduitVet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const users = await getAllUsers();
      const found = users.find((u) => u.id === id);
      if (!found || found.role !== 'veterinaire' || found.vetStatus !== 'certified') {
        router.canGoBack() ? router.back() : router.replace('/(tabs)');
        return;
      }
      setVet(found);
      const profil = await getProfilVet(id!);
      setPhoto(profil.photo);
      setCatalogue(profil.catalogue);
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#0f766e" />
    </View>
  );
  if (!vet) return null;

  const handleAppel = () => {
    const tel = `tel:+221${vet.phone}`;
    Linking.openURL(tel).catch(() => Alert.alert('Impossible d\'ouvrir le composeur téléphonique'));
  };

  const handleMessage = () => {
    router.push(`/chat/${vet.id}` as any);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/221${vet.phone}`;
    Linking.openURL(url).catch(() => Alert.alert('WhatsApp non disponible', 'Assurez-vous que WhatsApp est installé.'));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil vétérinaire</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Carte profil */}
        <View style={styles.profilCard}>
          <View style={styles.photoRow}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {vet.prenom.charAt(0)}{vet.nom.charAt(0)}
                </Text>
              </View>
            )}
            <View style={styles.certBadgeBox}>
              <Ionicons name="shield-checkmark" size={13} color="#fff" />
              <Text style={styles.certText}>Certifié AviConnect</Text>
            </View>
          </View>

          <Text style={styles.vetRoleLabel}>Vétérinaire</Text>
          <Text style={styles.vetNom}>Dr {vet.prenom} {vet.nom}</Text>
          {vet.ferme && <Text style={styles.vetClinique}>🏥 {vet.ferme}</Text>}
          <Text style={styles.vetRegion}>📍 {vet.region}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnAppel} onPress={handleAppel}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.btnText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnWhatsApp} onPress={handleWhatsApp}>
              <Ionicons name="logo-whatsapp" size={18} color="#fff" />
              <Text style={styles.btnText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnMsg} onPress={handleMessage}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#0f766e" />
              <Text style={styles.btnMsgText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Catalogue */}
        <Text style={styles.sectionTitle}>Catalogue</Text>

        {catalogue.length === 0 ? (
          <View style={styles.emptyCatalogue}>
            <Text style={styles.emptyCatalogueText}>Ce vétérinaire n'a pas encore publié son catalogue.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {catalogue.map((produit) => (
              <View key={produit.id} style={styles.prodCard}>
                {/* Image / emoji */}
                <View style={styles.prodImgBox}>
                  {produit.photo && !produit.photo.startsWith('blob:') ? (
                    <Image source={{ uri: produit.photo }} style={StyleSheet.absoluteFillObject} resizeMode="cover" onError={() => {}} />
                  ) : (
                    <Text style={styles.prodEmoji}>{CATEGORIE_ICONS[produit.categorie] ?? '📦'}</Text>
                  )}
                  <View style={styles.prodCatBadge}>
                    <Text style={styles.prodCatBadgeText}>{produit.categorie}</Text>
                  </View>
                </View>

                {/* Body */}
                <View style={styles.prodBody}>
                  <Text style={styles.prodNom} numberOfLines={2}>{produit.nom}</Text>
                  {produit.description ? (
                    <Text style={styles.prodDesc} numberOfLines={2}>{produit.description}</Text>
                  ) : null}
                  <Text style={styles.prodPrix}>
                    {produit.prix.toLocaleString()} <Text style={styles.prodPrixSub}>F / {produit.unite}</Text>
                  </Text>
                  <TouchableOpacity style={styles.prodBtn} onPress={handleMessage} activeOpacity={0.88}>
                    <Ionicons name="chatbubble-ellipses" size={13} color="#fff" />
                    <Text style={styles.prodBtnText}>Contacter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: '#0f766e',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  profilCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 20,
    alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  photoRow: { alignItems: 'center', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 8 },
  avatarPlaceholder: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  avatarInitials: { fontSize: 30, fontWeight: '800', color: '#0f766e' },
  certBadgeBox: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#0f766e', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  certText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  vetRoleLabel: { fontSize: 26, fontWeight: '800', color: '#0f766e', marginTop: 10, marginBottom: 2, letterSpacing: -0.3 },
  vetNom: { fontSize: 15, fontWeight: '500', color: Colors.textMuted, marginBottom: 6 },
  vetClinique: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  vetRegion: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btnAppel: {
    flex: 1, backgroundColor: '#0f766e', borderRadius: 12,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  btnWhatsApp: {
    flex: 1, backgroundColor: '#25D366', borderRadius: 12,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  btnMsg: {
    flex: 1, backgroundColor: '#f0fdfa', borderRadius: 12,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: '#0f766e',
  },
  btnMsgText: { color: '#0f766e', fontSize: 14, fontWeight: '700' },
  sectionTitle: {
    fontSize: 15, fontWeight: '800', color: Colors.text,
    marginBottom: 12,
  },
  emptyCatalogue: {
    backgroundColor: '#f0fdfa', borderRadius: 12, padding: 20, alignItems: 'center',
  },
  emptyCatalogueText: { fontSize: 13, color: '#0f766e', textAlign: 'center' },

  /* Grille */
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  prodCard: {
    width: CARD_W,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...(Shadows.card as object),
  },
  prodImgBox: {
    height: 120, backgroundColor: '#f0fdfa',
    justifyContent: 'center', alignItems: 'center',
  },
  prodEmoji: { fontSize: 42 },
  prodCatBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(15,118,110,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  prodCatBadgeText: { fontSize: 10, fontWeight: '700', color: '#0f766e', textTransform: 'capitalize' },
  prodBody: { padding: 10 },
  prodNom: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 3, lineHeight: 18 },
  prodDesc: { fontSize: 11, color: Colors.textMuted, lineHeight: 15, marginBottom: 6 },
  prodPrix: { fontSize: 16, fontWeight: '800', color: '#0f766e', marginBottom: 8 },
  prodPrixSub: { fontSize: 10, fontWeight: '500', color: Colors.textMuted },
  prodBtn: {
    backgroundColor: '#0f766e', borderRadius: Radius.pill,
    paddingVertical: 9, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 5,
  },
  prodBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
