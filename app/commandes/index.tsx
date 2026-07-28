import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { useOrders, type OrderStatus } from '@/hooks/OrdersContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { PRODUCT_EMOJIS, type ProductType } from '@/constants/mockData';

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  en_attente: { label: 'En attente', color: '#92400e', bg: '#fef3c7' },
  acceptee:   { label: 'Acceptée',   color: '#166534', bg: '#dcfce7' },
  refusee:    { label: 'Refusée',    color: '#991b1b', bg: '#fee2e2' },
  payee:      { label: 'Payée',      color: '#1e40af', bg: '#dbeafe' },
};

export default function CommandesScreen() {
  const { user } = useAuthContext();
  const { orders, updateOrderStatus, getOrdersForVendeur, getOrdersForAcheteur } = useOrders();
  const { sendNotification } = useAnnonces();

  if (!user) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emoji}>🔒</Text>
        <Text style={styles.msg}>Connectez-vous pour voir vos commandes</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.btnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const commandesRecues = getOrdersForVendeur(user.id);
  const commandesEnvoyees = getOrdersForAcheteur(user.id);

  const handleAccepter = async (orderId: number, acheteur: string, titre: string, acheteurId?: string) => {
    await updateOrderStatus(orderId, 'acceptee');
    // Notif → ACHETEUR uniquement
    await sendNotification(
      'commande_acceptee',
      '✅ Commande acceptée !',
      `Votre commande de "${titre}" a été acceptée par le vendeur.`,
      orderId,
      acheteurId,
    );
    if (Platform.OS === 'web') window.alert('Commande acceptée ! L\'acheteur a été notifié.');
    else Alert.alert('✅ Commande acceptée', 'L\'acheteur a été notifié.');
  };

  const handleRefuser = async (orderId: number, acheteur: string, titre: string, acheteurId?: string) => {
    const doRefuse = async () => {
      await updateOrderStatus(orderId, 'refusee');
      // Notif → ACHETEUR uniquement
      await sendNotification(
        'commande_refusee',
        '❌ Commande refusée',
        `Votre commande de "${titre}" n'a pas pu être acceptée.`,
        orderId,
        acheteurId,
      );
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Refuser cette commande ?')) await doRefuse();
    } else {
      Alert.alert('Refuser ?', 'L\'acheteur sera notifié du refus.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Refuser', style: 'destructive', onPress: doRefuse },
      ]);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Commandes</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* Commandes reçues (vendeur) */}
        {commandesRecues.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>📥 Commandes reçues ({commandesRecues.length})</Text>
            {commandesRecues.map((o) => {
              const s = STATUS_LABELS[o.status];
              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{PRODUCT_EMOJIS[o.lotProduit as ProductType] || '📦'}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitre} numberOfLines={1}>{o.lotTitre}</Text>
                      <Text style={styles.cardMeta}>De : {o.acheteurNom}</Text>
                      {o.acheteurPhone && <Text style={styles.cardMeta}>📱 +221 {o.acheteurPhone}</Text>}
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Quantité</Text>
                    <Text style={styles.cardValue}>{o.qte.toLocaleString()} unités</Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Total</Text>
                    <Text style={[styles.cardValue, { color: Colors.primary, fontWeight: '700' }]}>
                      {o.total.toLocaleString()} F CFA
                    </Text>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Règlement</Text>
                    <Text style={styles.cardValue}>{o.payMode === 'carte' ? '💳 Carte' : '💬 Contact direct'}</Text>
                  </View>
                  {o.livraison ? (
                    <View style={styles.cardRow}>
                      <Text style={styles.cardLabel}>Livraison</Text>
                      <Text style={styles.cardValue} numberOfLines={1}>{o.livraison}</Text>
                    </View>
                  ) : null}
                  {o.note ? (
                    <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                      <Text style={styles.cardLabel}>Note</Text>
                      <Text style={styles.cardValue} numberOfLines={2}>{o.note}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.cardDate}>{formatDate(o.date)}</Text>

                  {o.status === 'en_attente' && (
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.refuserBtn}
                        onPress={() => handleRefuser(o.id, o.acheteurNom, o.lotTitre, o.acheteurId)}
                      >
                        <Text style={styles.refuserBtnText}>❌ Refuser</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.accepterBtn}
                        onPress={() => handleAccepter(o.id, o.acheteurNom, o.lotTitre, o.acheteurId)}
                      >
                        <Text style={styles.accepterBtnText}>✅ Accepter</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}

        {/* Commandes envoyées (acheteur) */}
        {commandesEnvoyees.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>📤 Mes commandes envoyées ({commandesEnvoyees.length})</Text>
            {commandesEnvoyees.map((o) => {
              const s = STATUS_LABELS[o.status];
              return (
                <View key={o.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardEmoji}>{PRODUCT_EMOJIS[o.lotProduit as ProductType] || '📦'}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.cardTitre} numberOfLines={1}>{o.lotTitre}</Text>
                      <Text style={styles.cardMeta}>Vendeur : {o.vendeurNom}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: s.bg }]}>
                      <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                    </View>
                  </View>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Quantité</Text>
                    <Text style={styles.cardValue}>{o.qte.toLocaleString()} unités</Text>
                  </View>
                  <View style={[styles.cardRow, { borderBottomWidth: 0 }]}>
                    <Text style={styles.cardLabel}>Total</Text>
                    <Text style={[styles.cardValue, { color: Colors.primary, fontWeight: '700' }]}>
                      {o.total.toLocaleString()} F CFA
                    </Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(o.date)}</Text>
                  {o.status === 'acceptee' && o.vendeurId && (
                    <TouchableOpacity
                      style={styles.avisBtn}
                      onPress={() => router.push({ pathname: '/vendeur/[id]', params: { id: o.vendeurId! } })}
                    >
                      <Text style={styles.avisBtnText}>⭐ Voir le profil & laisser un avis</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </>
        )}

        {commandesRecues.length === 0 && commandesEnvoyees.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySub}>Vos commandes reçues et envoyées apparaîtront ici.</Text>
          </View>
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
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  sectionTitle: {
    fontSize: 14, fontWeight: '700', color: Colors.text,
    marginBottom: 10, paddingBottom: 6,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardEmoji: { fontSize: 32 },
  cardTitre: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.textLight, marginTop: 1 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cardLabel: { fontSize: 12, color: Colors.textLight },
  cardValue: { fontSize: 13, color: Colors.text, maxWidth: '60%', textAlign: 'right' },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 8, textAlign: 'right' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  refuserBtn: {
    flex: 1, borderWidth: 2, borderColor: Colors.error, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  refuserBtnText: { color: Colors.error, fontWeight: '700', fontSize: 14 },
  accepterBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  accepterBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emoji: { fontSize: 56 },
  msg: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 12, marginBottom: 20 },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  avisBtn: {
    marginTop: 10, backgroundColor: '#FFFBF0', borderRadius: 10,
    borderWidth: 1.5, borderColor: '#F59E0B',
    paddingVertical: 10, alignItems: 'center',
  },
  avisBtnText: { fontSize: 13.5, fontWeight: '700', color: '#92600A' },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8 },
});

