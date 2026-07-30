import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { PRODUCT_EMOJIS } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';

export default function MesAnnoncesScreen() {
  const { user } = useAuthContext();
  const { userLots, deleteAnnonce } = useAnnonces();

  const mesAnnonces = user
    ? userLots.filter((l) => l.eleveur === `${user.prenom} ${user.nom}`)
    : [];

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.msg}>Connectez-vous pour voir vos annonces</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleDelete = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette annonce ?')) deleteAnnonce(id);
    } else {
      Alert.alert('Supprimer ?', 'Cette annonce sera retirée du marché.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteAnnonce(id) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mes annonces</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/publier' as any)} style={styles.addBtn}>
          <Text style={styles.addText}>+ Publier</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {mesAnnonces.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📦</Text>
            <Text style={styles.emptyTitle}>Aucune annonce publiée</Text>
            <Text style={styles.emptySub}>Partagez vos lots avec tout le Sénégal</Text>
            <TouchableOpacity style={styles.publishBtn} onPress={() => router.push('/(tabs)/publier' as any)}>
              <Text style={styles.publishBtnText}>📢 Publier ma première annonce</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{mesAnnonces.length} annonce{mesAnnonces.length > 1 ? 's' : ''} publiée{mesAnnonces.length > 1 ? 's' : ''}</Text>
            {mesAnnonces.map((a) => (
              <TouchableOpacity
                key={a.id}
                style={styles.card}
                onPress={() => router.push({ pathname: '/lot/[id]', params: { id: a.id } })}
              >
                <View style={styles.cardLeft}>
                  <Text style={styles.cardEmoji}>{PRODUCT_EMOJIS[a.produit]}</Text>
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitre} numberOfLines={1}>{a.titre}</Text>
                  <Text style={styles.cardDetail}>
                    {a.qte.toLocaleString()} unités · {a.prix.toLocaleString()} F CFA
                  </Text>
                  <Text style={styles.cardMeta}>{a.commune ? `${a.commune}, ${a.region}` : a.region} · {a.dispo}</Text>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>● Active</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(a.id)}>
                  <Text style={styles.deleteBtnText}>🗑️</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  backBtn: { paddingVertical: 4 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  addText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  count: { fontSize: 13, color: Colors.textLight, marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLeft: { marginRight: 12 },
  cardEmoji: { fontSize: 36 },
  cardInfo: { flex: 1 },
  cardTitre: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  cardDetail: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  cardMeta: { fontSize: 12, color: Colors.textLight, marginTop: 2 },
  activeBadge: {
    marginTop: 6, alignSelf: 'flex-start',
    backgroundColor: '#dcfce7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '700', color: '#166534' },
  deleteBtn: { paddingLeft: 8, paddingTop: 4 },
  deleteBtnText: { fontSize: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56 },
  msg: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
  publishBtn: {
    marginTop: 24, backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 14,
  },
  publishBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

