import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { User } from '@/hooks/useAuth';

export default function AdminVeterinaires() {
  const { user, isLoading: authLoading, getAllUsers, updateVetStatus } = useAuthContext();
  const [vets, setVets] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') { router.replace('/(tabs)'); return; }
    loadVets();
  }, [authLoading, user]);

  const loadVets = async () => {
    const users = await getAllUsers();
    setVets(users.filter((u) => u.role === 'veterinaire'));
    setLoading(false);
  };

  const handleStatus = async (vet: User, status: 'certified' | 'rejected') => {
    const label = status === 'certified' ? 'certifier' : 'rejeter';
    Alert.alert(
      `${status === 'certified' ? '✅' : '❌'} ${label.charAt(0).toUpperCase() + label.slice(1)} ce vétérinaire ?`,
      `Dr ${vet.prenom} ${vet.nom}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: status === 'certified' ? 'Certifier' : 'Rejeter',
          style: status === 'certified' ? 'default' : 'destructive',
          onPress: async () => {
            await updateVetStatus(vet.id, status);
            await loadVets();
          },
        },
      ]
    );
  };

  const pending = vets.filter((v) => v.vetStatus === 'pending');
  const certified = vets.filter((v) => v.vetStatus === 'certified');
  const rejected = vets.filter((v) => v.vetStatus === 'rejected');

  const StatusBadge = ({ status }: { status?: string }) => {
    const map: Record<string, { bg: string; color: string; label: string }> = {
      pending:    { bg: '#fef3c7', color: '#92400e', label: '⏳ En attente' },
      certified:  { bg: '#d1fae5', color: '#065f46', label: '✅ Certifié' },
      rejected:   { bg: '#fee2e2', color: '#991b1b', label: '❌ Rejeté' },
    };
    const s = map[status ?? 'pending'];
    return (
      <View style={[styles.badge, { backgroundColor: s.bg }]}>
        <Text style={[styles.badgeText, { color: s.color }]}>{s.label}</Text>
      </View>
    );
  };

  const VetRow = ({ vet }: { vet: User }) => (
    <View style={styles.vetCard}>
      <View style={styles.vetAvatarBox}>
        <Text style={styles.vetInitials}>{vet.prenom.charAt(0)}{vet.nom.charAt(0)}</Text>
      </View>
      <View style={styles.vetInfo}>
        <Text style={styles.vetNom}>Dr {vet.prenom} {vet.nom}</Text>
        {vet.ferme && <Text style={styles.vetDetail}>🏥 {vet.ferme}</Text>}
        <Text style={styles.vetDetail}>📍 {vet.region} · 📞 {vet.phone}</Text>
        <StatusBadge status={vet.vetStatus} />
      </View>
      {vet.vetStatus === 'pending' && (
        <View style={styles.actionCol}>
          <TouchableOpacity style={styles.btnCertify} onPress={() => handleStatus(vet, 'certified')}>
            <Ionicons name="checkmark" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnReject} onPress={() => handleStatus(vet, 'rejected')}>
            <Ionicons name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
      {vet.vetStatus === 'certified' && (
        <TouchableOpacity style={styles.btnRejectSmall} onPress={() => handleStatus(vet, 'rejected')}>
          <Ionicons name="close" size={16} color="#dc2626" />
        </TouchableOpacity>
      )}
      {vet.vetStatus === 'rejected' && (
        <TouchableOpacity style={styles.btnCertifySmall} onPress={() => handleStatus(vet, 'certified')}>
          <Ionicons name="checkmark" size={16} color="#065f46" />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion vétérinaires</Text>
      </View>

      {loading ? (
        <View style={styles.loader}><ActivityIndicator size="large" color={Colors.primary} /></View>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: '#fef3c7' }]}>
              <Text style={styles.statNum}>{pending.length}</Text>
              <Text style={styles.statLbl}>En attente</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#d1fae5' }]}>
              <Text style={styles.statNum}>{certified.length}</Text>
              <Text style={styles.statLbl}>Certifiés</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#fee2e2' }]}>
              <Text style={styles.statNum}>{rejected.length}</Text>
              <Text style={styles.statLbl}>Rejetés</Text>
            </View>
          </View>

          {pending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>⏳ En attente de validation</Text>
              {pending.map((v) => <VetRow key={v.id} vet={v} />)}
            </>
          )}
          {certified.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>✅ Vétérinaires certifiés</Text>
              {certified.map((v) => <VetRow key={v.id} vet={v} />)}
            </>
          )}
          {rejected.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>❌ Profils rejetés</Text>
              {rejected.map((v) => <VetRow key={v.id} vet={v} />)}
            </>
          )}
          {vets.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💉</Text>
              <Text style={styles.emptyText}>Aucun vétérinaire inscrit pour l'instant.</Text>
            </View>
          )}
          <View style={{ height: 60 }} />
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
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: Colors.text },
  statLbl: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 13, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginBottom: 10, marginTop: 8,
  },
  vetCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  vetAvatarBox: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center',
  },
  vetInitials: { fontSize: 16, fontWeight: '800', color: '#0f766e' },
  vetInfo: { flex: 1, gap: 2 },
  vetNom: { fontSize: 14, fontWeight: '700', color: Colors.text },
  vetDetail: { fontSize: 12, color: Colors.textMuted },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginTop: 4 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  actionCol: { gap: 6 },
  btnCertify: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#0f766e',
    alignItems: 'center', justifyContent: 'center',
  },
  btnReject: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#dc2626',
    alignItems: 'center', justifyContent: 'center',
  },
  btnCertifySmall: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#d1fae5',
    alignItems: 'center', justifyContent: 'center',
  },
  btnRejectSmall: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },
});

