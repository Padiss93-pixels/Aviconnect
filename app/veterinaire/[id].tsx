import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Image, Linking, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { useVetContext, ProduitVet } from '@/hooks/VetContext';
import { User } from '@/hooks/useAuth';

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

  const categories = [...new Set(catalogue.map((p) => p.categorie))];

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

          <Text style={styles.vetNom}>Dr {vet.prenom} {vet.nom}</Text>
          {vet.ferme && <Text style={styles.vetClinique}>🏥 {vet.ferme}</Text>}
          <Text style={styles.vetRegion}>📍 {vet.region}</Text>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.btnAppel} onPress={handleAppel}>
              <Ionicons name="call" size={18} color="#fff" />
              <Text style={styles.btnText}>Appeler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnMsg} onPress={handleMessage}>
              <Ionicons name="chatbubble-ellipses" size={18} color="#0f766e" />
              <Text style={styles.btnMsgText}>Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Catalogue */}
        <Text style={styles.sectionTitle}>Mon catalogue</Text>

        {catalogue.length === 0 ? (
          <View style={styles.emptyCatalogue}>
            <Text style={styles.emptyCatalogueText}>Ce vétérinaire n'a pas encore publié son catalogue.</Text>
          </View>
        ) : (
          <>
            {categories.map((cat) => (
              <View key={cat} style={styles.catSection}>
                <Text style={styles.catTitle}>
                  {CATEGORIE_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}s
                </Text>
                {catalogue.filter((p) => p.categorie === cat).map((produit) => (
                  <View key={produit.id} style={styles.produitCard}>
                    {produit.photo && (
                      <Image source={{ uri: produit.photo }} style={styles.produitPhoto} />
                    )}
                    <View style={[styles.produitTop, produit.photo && { paddingTop: 10 }]}>
                      <Text style={styles.produitNom}>{produit.nom}</Text>
                      <Text style={styles.produitPrix}>
                        {produit.prix.toLocaleString()} F CFA
                        <Text style={styles.produitUnite}> / {produit.unite}</Text>
                      </Text>
                    </View>
                    {produit.description ? (
                      <Text style={styles.produitDesc}>{produit.description}</Text>
                    ) : null}
                  </View>
                ))}
              </View>
            ))}
          </>
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
  vetNom: { fontSize: 20, fontWeight: '800', color: Colors.text, marginTop: 8, marginBottom: 4 },
  vetClinique: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  vetRegion: { fontSize: 13, color: Colors.textMuted, marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 12, width: '100%' },
  btnAppel: {
    flex: 1, backgroundColor: '#0f766e', borderRadius: 12,
    paddingVertical: 12, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
  },
  btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  catSection: { marginBottom: 20 },
  catTitle: { fontSize: 13, fontWeight: '700', color: Colors.textMuted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  produitCard: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#0f766e',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  produitPhoto: { width: '100%', height: 130, resizeMode: 'cover' },
  produitTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4, padding: 14 },
  produitNom: { fontSize: 14, fontWeight: '700', color: Colors.text, flex: 1, marginRight: 8 },
  produitPrix: { fontSize: 14, fontWeight: '800', color: '#0f766e' },
  produitUnite: { fontSize: 11, fontWeight: '500', color: Colors.textMuted },
  produitDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, paddingHorizontal: 14, paddingBottom: 12 },
});
