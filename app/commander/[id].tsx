import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { PRODUCT_EMOJIS } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useOrders } from '@/hooks/OrdersContext';

type PayMode = 'message';

export default function CommanderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, signIn } = useAuthContext();
  const { annonces, reduceStock, sendNotification } = useAnnonces();
  const { addOrder } = useOrders();

  const lot = annonces.find((l) => l.id === Number(id));

  const [qte, setQte] = useState('');
  const [note, setNote] = useState('');
  const [livraison, setLivraison] = useState('');
  const [payMode, setPayMode] = useState<PayMode>('message');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!lot) return null;

  const qteNum = parseInt(qte) || 0;
  const total = qteNum * lot.prix;

  const validate = () => {
    if (!qte || qteNum <= 0) { setError('Entrez une quantité valide'); return false; }
    if (qteNum > lot.qte) { setError(`Quantité max disponible : ${lot.qte.toLocaleString()}`); return false; }
    return true;
  };

  const handleCommander = async () => {
    if (!validate()) return;
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));

    const acheteur = user ? `${user.prenom} ${user.nom}` : 'Un acheteur';
    const orderId = Date.now();

    // Sauvegarder la commande
    await addOrder({
      id: orderId,
      lotId: lot.id,
      lotTitre: lot.titre,
      lotProduit: lot.produit,
      vendeurNom: lot.eleveur,
      vendeurId: lot.eleveurId,
      acheteurNom: acheteur,
      acheteurId: user?.id,
      acheteurPhone: user?.phone,
      qte: qteNum,
      prix: lot.prix,
      total,
      livraison,
      note,
      payMode,
      status: 'en_attente',
      date: new Date().toISOString(),
    });

    // Réduire le stock + notif vendeur (lot.eleveurId ciblé dans reduceStock)
    await reduceStock(lot.id, qteNum, acheteur, orderId);

    setLoading(false);

    const msg = `✅ Demande envoyée à ${lot.eleveur} !\n\nIl vous contactera directement pour confirmer et organiser le paiement.`;

    if (Platform.OS === 'web') {
      window.alert(msg);
      router.replace('/(tabs)');
    } else {
      Alert.alert('Commande passée !', msg, [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Passer commande</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        <View style={styles.lotCard}>
          <Text style={styles.lotEmoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>
          <View style={styles.lotInfo}>
            <Text style={styles.lotTitre}>{lot.titre}</Text>
            <Text style={styles.lotEleveur}>👤 {lot.eleveur} · 📍 {lot.region}</Text>
            <Text style={styles.lotPrix}>{lot.prix.toLocaleString()} F CFA / unité</Text>
            <Text style={styles.lotDispo}>Stock : {lot.qte.toLocaleString()} unités · {lot.dispo}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Détails de la commande</Text>

        <Text style={styles.label}>Quantité souhaitée *</Text>
        <TextInput
          style={styles.input}
          value={qte}
          onChangeText={(v) => { setQte(v.replace(/\D/g, '')); setError(''); }}
          placeholder={`Ex: 100 (max ${lot.qte.toLocaleString()})`}
          placeholderTextColor={Colors.textMuted}
          keyboardType="numeric"
        />

        {qteNum > 0 && (
          <View style={styles.totalBanner}>
            <Text style={styles.totalLabel}>Total estimé</Text>
            <Text style={styles.totalVal}>{total.toLocaleString()} F CFA</Text>
          </View>
        )}

        <Text style={styles.label}>Adresse / lieu de livraison</Text>
        <TextInput
          style={styles.input}
          value={livraison}
          onChangeText={setLivraison}
          placeholder="Ex: Marché Sandaga, Dakar"
          placeholderTextColor={Colors.textMuted}
        />

        <Text style={styles.label}>Note pour l'éleveur</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={note}
          onChangeText={setNote}
          placeholder="Conditions particulières, délai souhaité, race préférée..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <View style={styles.payCard}>
          <View style={styles.payInfo}>
            <Text style={styles.payTitle}>💬 Contact direct avec l'éleveur</Text>
            <Text style={styles.paySub}>Votre demande sera envoyée à l'éleveur. Il vous contactera pour confirmer et organiser le paiement (Wave, espèces, Orange Money...).</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleCommander}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>📨 Envoyer la demande</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
  },
  backBtn: { marginBottom: 2 },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  lotCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'flex-start', marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  lotEmoji: { fontSize: 44, marginRight: 14 },
  lotInfo: { flex: 1 },
  lotTitre: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  lotEleveur: { fontSize: 12, color: Colors.textLight, marginBottom: 2 },
  lotPrix: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  lotDispo: { fontSize: 12, color: Colors.textMuted },
  sectionLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 12, marginTop: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6,
  },
  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text, backgroundColor: '#fff', marginBottom: 2,
  },
  textarea: { minHeight: 80 },
  totalBanner: {
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    padding: 12, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginVertical: 8,
  },
  totalLabel: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  totalVal: { fontSize: 20, fontWeight: '700', color: Colors.primary },
  payCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 2, borderColor: Colors.border, marginBottom: 10,
  },
  payInfo: { flex: 1 },
  payTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  paySub: { fontSize: 12, color: Colors.textLight, lineHeight: 18 },
  errorText: { color: Colors.error, fontSize: 13, marginTop: 8, marginBottom: 4 },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
