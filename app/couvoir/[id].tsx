import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { COUVOIRS } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';

export default function CouvoirDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const couvoir = COUVOIRS.find((c) => c.id === Number(id));

  if (!couvoir) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Couvoir introuvable</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>
      </View>
    );
  }

  const handleCommander = async () => {
    if (!user) {
      Alert.alert('Connexion requise', 'Connectez-vous pour commander.', [
        { text: 'Se connecter', onPress: () => router.push('/(auth)/login') },
        { text: 'Annuler', style: 'cancel' },
      ]);
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    Alert.alert('✅ Demande envoyée', `Votre demande a été envoyée à ${couvoir.nom}.`);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.banner}>
          <Text style={styles.bannerEmoji}>🏭</Text>
          {couvoir.verified && (
            <View style={styles.certBadge}><Text style={styles.certText}>✓ Certifié AviConnect</Text></View>
          )}
        </View>

        <View style={styles.body}>
          <Text style={styles.nom}>{couvoir.nom}</Text>
          <Text style={styles.region}>📍 {couvoir.region}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{couvoir.stocks.toLocaleString()}</Text>
              <Text style={styles.statLbl}>Poussins dispo</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{couvoir.prix.toLocaleString()}</Text>
              <Text style={styles.statLbl}>F CFA / tête</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Races disponibles</Text>
          <View style={styles.racesGrid}>
            {couvoir.races.map((r) => (
              <View key={r} style={styles.raceCard}>
                <Text style={styles.raceEmoji}>🐣</Text>
                <Text style={styles.raceName}>{r}</Text>
              </View>
            ))}
          </View>

          {couvoir.contact && (
            <View style={styles.contactCard}>
              <Text style={styles.contactLabel}>📞 Contact direct</Text>
              <Text style={styles.contactValue}>{couvoir.contact}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.msgBtn} onPress={() => router.push({ pathname: '/chat/[id]', params: { id } })}>
          <Text style={styles.msgBtnText}>💬 Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.cmdBtn, loading && styles.btnDisabled]}
          onPress={handleCommander}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.cmdBtnText}>Commander →</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  banner: {
    height: 160, backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  bannerEmoji: { fontSize: 72 },
  certBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5,
  },
  certText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  body: { padding: 20 },
  nom: { fontSize: 24, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  region: { fontSize: 14, color: Colors.textLight, marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: {
    flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  statVal: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  statLbl: { fontSize: 11, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  racesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  raceCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 12, alignItems: 'center',
    minWidth: 100, borderWidth: 1, borderColor: Colors.border,
  },
  raceEmoji: { fontSize: 24, marginBottom: 4 },
  raceName: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  contactCard: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  contactLabel: { fontSize: 14, color: Colors.primaryDark, fontWeight: '600' },
  contactValue: { fontSize: 15, color: Colors.primary, fontWeight: '700' },
  actions: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  msgBtn: { flex: 1, borderWidth: 2, borderColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  msgBtnText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  cmdBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  cmdBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: Colors.text },
  backLink: { color: Colors.primary, fontSize: 15, marginTop: 16 },
});
