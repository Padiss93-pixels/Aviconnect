import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';

const MOCK_TRANSACTIONS = [
  {
    id: 1, date: '2024-03-15', produit: '🐔 Poulets de chair', qte: 200, montant: 560000,
    statut: 'Livré', acheteur: 'Moussa Diallo', vendeur: 'Ferme Ndiaye',
  },
  {
    id: 2, date: '2024-03-10', produit: '🥚 Œufs frais', qte: 500, montant: 125000,
    statut: 'En cours', acheteur: 'Restaurant Teranga', vendeur: 'Ferme Sow',
  },
];

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  'Livré': { bg: '#dcfce7', text: '#166534' },
  'En cours': { bg: '#fef9c3', text: '#854d0e' },
  'Annulé': { bg: '#fee2e2', text: '#991b1b' },
};

export default function TransactionsScreen() {
  const { user } = useAuthContext();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.msg}>Connectez-vous pour voir vos transactions</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} style={styles.backBtn}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {MOCK_TRANSACTIONS.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>💳</Text>
            <Text style={styles.emptyTitle}>Aucune transaction</Text>
            <Text style={styles.emptySub}>Vos commandes et ventes apparaîtront ici</Text>
          </View>
        ) : (
          <>
            <Text style={styles.count}>{MOCK_TRANSACTIONS.length} transaction{MOCK_TRANSACTIONS.length > 1 ? 's' : ''}</Text>
            {MOCK_TRANSACTIONS.map((t) => {
              const c = STATUT_COLORS[t.statut] || { bg: '#f3f4f6', text: '#374151' };
              return (
                <View key={t.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text style={styles.cardProduit}>{t.produit}</Text>
                    <View style={[styles.statutBadge, { backgroundColor: c.bg }]}>
                      <Text style={[styles.statutText, { color: c.text }]}>{t.statut}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Quantité</Text>
                    <Text style={styles.cardValue}>{t.qte.toLocaleString()} unités</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Montant</Text>
                    <Text style={[styles.cardValue, { color: Colors.primary, fontWeight: '700' }]}>
                      {t.montant.toLocaleString()} F CFA
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Date</Text>
                    <Text style={styles.cardValue}>{t.date}</Text>
                  </View>
                  <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.cardLabel}>Parties</Text>
                    <Text style={styles.cardValue}>{t.acheteur} ↔ {t.vendeur}</Text>
                  </View>
                </View>
              );
            })}
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
  count: { fontSize: 13, color: Colors.textLight, marginBottom: 12 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardProduit: { fontSize: 15, fontWeight: '700', color: Colors.text },
  statutBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statutText: { fontSize: 12, fontWeight: '700' },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cardLabel: { fontSize: 13, color: Colors.textLight },
  cardValue: { fontSize: 13, color: Colors.text },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56 },
  msg: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textLight, marginTop: 6, textAlign: 'center' },
});

