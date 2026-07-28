import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { User } from '@/hooks/useAuth';

export default function VeterinairesCertifies() {
  const { getAllUsers } = useAuthContext();
  const [vets, setVets] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers().then((users) => {
      setVets(users.filter((u) => u.role === 'veterinaire' && u.vetStatus === 'certified'));
      setLoading(false);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Vétérinaires certifiés</Text>
          <Text style={styles.headerSub}>Professionnels validés par AviConnect</Text>
        </View>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeCount}>{vets.length}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : vets.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💉</Text>
          <Text style={styles.emptyTitle}>Aucun vétérinaire certifié</Text>
          <Text style={styles.emptySub}>Les vétérinaires validés par AviConnect apparaîtront ici.</Text>
        </View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={18} color="#047857" />
            <Text style={styles.infoText}>Tous ces vétérinaires ont été vérifiés et validés par l'équipe AviConnect.</Text>
          </View>

          {vets.map((vet) => (
            <TouchableOpacity
              key={vet.id}
              style={styles.vetCard}
              onPress={() => router.push(`/veterinaire/${vet.id}` as any)}
              activeOpacity={0.82}
            >
              <View style={styles.vetLeft}>
                {vet.photo ? (
                  <Image source={{ uri: vet.photo }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitials}>
                      {vet.prenom.charAt(0)}{vet.nom.charAt(0)}
                    </Text>
                  </View>
                )}
                <View style={styles.certBadge}>
                  <Ionicons name="shield-checkmark" size={11} color="#fff" />
                </View>
              </View>

              <View style={styles.vetInfo}>
                <Text style={styles.vetNom}>Dr {vet.prenom} {vet.nom}</Text>
                {vet.ferme && <Text style={styles.vetClinique}>🏥 {vet.ferme}</Text>}
                <Text style={styles.vetRegion}>📍 {vet.region}</Text>
                <View style={styles.vetTagRow}>
                  <View style={styles.vetTag}><Text style={styles.vetTagText}>💉 Vaccins</Text></View>
                  <View style={styles.vetTag}><Text style={styles.vetTagText}>🧪 Vitamines</Text></View>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
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
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  badgeBox: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeCount: { fontSize: 15, fontWeight: '800', color: '#fff' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20 },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  infoBanner: {
    backgroundColor: '#d1fae5', borderRadius: 12, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: '#065f46', fontWeight: '500' },
  vetCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  vetLeft: { position: 'relative' },
  avatar: { width: 60, height: 60, borderRadius: 30 },
  avatarPlaceholder: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 20, fontWeight: '800', color: '#0f766e' },
  certBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0f766e', borderRadius: 8, width: 16, height: 16,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: '#fff',
  },
  vetInfo: { flex: 1 },
  vetNom: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  vetClinique: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  vetRegion: { fontSize: 12, color: Colors.textMuted, marginBottom: 6 },
  vetTagRow: { flexDirection: 'row', gap: 6 },
  vetTag: { backgroundColor: '#f0fdfa', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  vetTagText: { fontSize: 11, color: '#0f766e', fontWeight: '600' },
});
