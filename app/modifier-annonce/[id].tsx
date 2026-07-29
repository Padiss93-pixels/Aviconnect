import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, Image,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { REGIONS, PRODUCT_EMOJIS, PRODUCT_LABELS, type ProductType } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import PillRow from '@/components/PillRow';

const PRODUCTS: ProductType[] = ['poulet', 'poussin', 'oeuf', 'aliment'];
const DISPOS = ['Immédiat', 'Dans 3 jours', 'Dans 1 semaine', 'Dans 2 semaines', 'Sur commande'];

export default function ModifierAnnonceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const { userLots, updateAnnonce } = useAnnonces();

  const lot = userLots.find((l) => l.id === Number(id));

  if (!lot || !user || lot.eleveur !== `${user.prenom} ${user.nom}`) {
    return (
      <View style={styles.centered}>
        <Text style={styles.centeredText}>Annonce introuvable ou accès refusé.</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Text style={styles.backLink}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const [produit, setProduit] = useState<ProductType>(lot.produit);
  const [titre, setTitre] = useState(lot.titre);
  const [qte, setQte] = useState(String(lot.qte));
  const [prix, setPrix] = useState(String(lot.prix));
  const [region, setRegion] = useState(lot.region);
  const [dispo, setDispo] = useState(lot.dispo);
  const [description, setDescription] = useState(lot.detail || '');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!titre.trim() || !qte.trim() || !prix.trim()) {
      if (Platform.OS === 'web') window.alert('Veuillez remplir le titre, la quantité et le prix.');
      else Alert.alert('Champs manquants', 'Veuillez remplir le titre, la quantité et le prix.');
      return;
    }
    setLoading(true);
    await updateAnnonce({
      ...lot,
      produit,
      titre,
      qte: parseInt(qte),
      prix: parseInt(prix),
      region,
      dispo,
      detail: description,
    });
    setLoading(false);

    if (Platform.OS === 'web') {
      window.alert('✅ Annonce mise à jour avec succès !');
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    } else {
      Alert.alert('✅ Annonce mise à jour !', '', [{ text: 'OK', onPress: () => router.canGoBack() ? router.back() : router.replace('/(tabs)') }]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier l'annonce</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">

        <Text style={styles.label}>Produit *</Text>
        <View style={styles.productGrid}>
          {PRODUCTS.map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.productCard, produit === p && styles.productCardActive]}
              onPress={() => setProduit(p)}
            >
              <Text style={{ fontSize: 28 }}>{PRODUCT_EMOJIS[p]}</Text>
              <Text style={[styles.productLabel, produit === p && styles.productLabelActive]}>
                {PRODUCT_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 8 }]}>Titre *</Text>
        <TextInput
          style={styles.input}
          value={titre}
          onChangeText={setTitre}
          placeholder="Ex: Poulets de chair Cobb 500"
          placeholderTextColor={Colors.textMuted}
        />

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Quantité *</Text>
            <TextInput
              style={styles.input}
              value={qte}
              onChangeText={(v) => setQte(v.replace(/\D/g, ''))}
              placeholder="500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Prix F CFA *</Text>
            <TextInput
              style={styles.input}
              value={prix}
              onChangeText={(v) => setPrix(v.replace(/\D/g, ''))}
              placeholder="2800"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
            />
          </View>
        </View>

        <Text style={styles.label}>Région *</Text>
        <PillRow style={{ marginBottom: 16 }}>
          {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.pill, region === r && styles.pillActive]}
              onPress={() => setRegion(r)}
            >
              <Text style={[styles.pillText, region === r && styles.pillTextActive]}>{r}</Text>
            </TouchableOpacity>
          ))}
        </PillRow>

        <Text style={styles.label}>Disponibilité</Text>
        <PillRow style={{ marginBottom: 16 }}>
          {DISPOS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.pill, dispo === d && styles.pillActive]}
              onPress={() => setDispo(d)}
            >
              <Text style={[styles.pillText, dispo === d && styles.pillTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </PillRow>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Décrivez votre lot..."
          placeholderTextColor={Colors.textMuted}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>💾 Enregistrer les modifications</Text>}
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
  scroll: { flex: 1, backgroundColor: Colors.background },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  productGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  productCard: {
    flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
    padding: 12, borderWidth: 2, borderColor: Colors.border,
  },
  productCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  productLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginTop: 4 },
  productLabelActive: { color: Colors.primaryDark },
  row: { flexDirection: 'row' },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text,
    backgroundColor: '#fff', marginBottom: 16,
  },
  textarea: { minHeight: 100 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  centeredText: { fontSize: 16, color: Colors.textLight, textAlign: 'center' },
  backLink: { color: Colors.primary, fontSize: 15, marginTop: 16 },
});
