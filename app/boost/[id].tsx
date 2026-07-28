import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBoost } from '@/hooks/BoostContext';
import { Zap, CheckCircle } from 'lucide-react-native';

// Numéro Wave/OM de la plateforme AviConnect — à personnaliser
const WAVE_NUMBER = '77 338 65 40';
const OM_NUMBER = '77 338 65 40';

const PLANS = [
  { days: 7,  amount: 1000,  label: '7 jours',  desc: 'Idéal pour tester' },
  { days: 15, amount: 1500,  label: '15 jours', desc: 'Le plus populaire' },
  { days: 30, amount: 2500,  label: '30 jours', desc: 'Meilleur rapport qualité/prix' },
];

export default function BoostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { annonces } = useAnnonces();
  const { requestBoost } = useBoost();
  const lot = annonces.find((l) => l.id === Number(id));

  const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
  const [payMethod, setPayMethod] = useState<'wave' | 'orange_money'>('wave');
  const [payRef, setPayRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!lot) return null;

  const payNumber = payMethod === 'wave' ? WAVE_NUMBER : OM_NUMBER;

  const handleSubmit = async () => {
    if (!payRef.trim()) {
      const msg = 'Entrez votre numéro de transaction';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Référence manquante', msg);
      return;
    }
    setLoading(true);
    const result = await requestBoost(lot.id, selectedPlan.days, selectedPlan.amount, payMethod, payRef.trim());
    setLoading(false);
    if (result === 'ok') {
      setDone(true);
    } else {
      const msg = 'Une erreur est survenue. Vérifiez votre connexion et réessayez.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erreur', msg);
    }
  };

  if (done) {
    return (
      <View style={styles.doneWrap}>
        <CheckCircle size={64} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.doneTitle}>Demande envoyée !</Text>
        <Text style={styles.doneSub}>
          Votre demande de mise en avant est en cours de validation.{'\n'}
          Votre annonce sera boostée sous 24h après vérification du paiement.
        </Text>
        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Text style={styles.doneBtnText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mettre en avant</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Annonce concernée */}
        <View style={styles.lotCard}>
          <Zap size={20} color={Colors.gold} strokeWidth={1.8} />
          <Text style={styles.lotTitre} numberOfLines={2}>{lot.titre}</Text>
        </View>

        {/* Avantages */}
        <Text style={styles.sectionLabel}>Ce que vous gagnez</Text>
        {[
          'Votre annonce apparaît en tête des résultats',
          'Visibilité x3 par rapport aux annonces gratuites',
        ].map((a) => (
          <View key={a} style={styles.advantageRow}>
            <Text style={styles.advantageCheck}>✓</Text>
            <Text style={styles.advantageText}>{a}</Text>
          </View>
        ))}

        {/* Choix de durée */}
        <Text style={styles.sectionLabel}>Durée de la mise en avant</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.days}
            style={[styles.planCard, selectedPlan.days === plan.days && styles.planCardActive]}
            onPress={() => setSelectedPlan(plan)}
            activeOpacity={0.85}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.planLabel, selectedPlan.days === plan.days && styles.planLabelActive]}>
                {plan.label}
              </Text>
              <Text style={styles.planDesc}>{plan.desc}</Text>
            </View>
            <Text style={[styles.planPrice, selectedPlan.days === plan.days && styles.planPriceActive]}>
              {plan.amount.toLocaleString()} F
            </Text>
            <View style={[styles.planRadio, selectedPlan.days === plan.days && styles.planRadioActive]}>
              {selectedPlan.days === plan.days && <View style={styles.planRadioDot} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* Paiement */}
        <Text style={styles.sectionLabel}>Mode de paiement</Text>
        <View style={styles.payRow}>
          {(['wave', 'orange_money'] as const).map((m) => (
            <TouchableOpacity
              key={m}
              style={[styles.payBtn, payMethod === m && styles.payBtnActive]}
              onPress={() => setPayMethod(m)}
              activeOpacity={0.85}
            >
              <Text style={styles.payBtnEmoji}>{m === 'wave' ? '🌊' : '🟠'}</Text>
              <Text style={[styles.payBtnText, payMethod === m && styles.payBtnTextActive]}>
                {m === 'wave' ? 'Wave' : 'Orange Money'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Instructions paiement */}
        <View style={styles.instrCard}>
          <Text style={styles.instrTitle}>Comment payer ?</Text>
          <Text style={styles.instrStep}>
            1. Envoyez <Text style={styles.instrBold}>{selectedPlan.amount.toLocaleString()} F CFA</Text> au numéro :
          </Text>
          <Text style={styles.instrNumber}>{payNumber}</Text>
          <Text style={styles.instrStep}>
            2. Notez le <Text style={styles.instrBold}>numéro de transaction</Text> reçu par SMS.
          </Text>
          <Text style={styles.instrStep}>3. Collez-le ci-dessous et soumettez.</Text>
        </View>

        <Text style={styles.label}>Numéro de transaction *</Text>
        <TextInput
          style={styles.input}
          value={payRef}
          onChangeText={setPayRef}
          placeholder="Ex: TXN-WAVE-20240722-XXXX"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.88}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Zap size={18} color="#fff" strokeWidth={1.8} />
              <Text style={styles.submitBtnText}>
                Envoyer la demande · {selectedPlan.amount.toLocaleString()} F
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Votre annonce sera mise en avant après vérification du paiement par notre équipe (sous 24h ouvrées).
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary, paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
  },
  backBtn: { marginBottom: 2 },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 20, fontFamily: Fonts.bodyBold, color: '#fff' },

  scroll: { padding: 18, paddingBottom: 60 },

  lotCard: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md,
    padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 22,
    borderWidth: 1, borderColor: Colors.primaryTint,
  },
  lotTitre: { flex: 1, fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },

  sectionLabel: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 22, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6,
  },

  advantageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 6 },
  advantageCheck: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.bodyBold },
  advantageText: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

  planCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 16,
    marginBottom: 10, borderWidth: 1.5, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  planCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  planLabel: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  planLabelActive: { color: Colors.primaryDark },
  planDesc: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  planPrice: { fontSize: 17, fontFamily: Fonts.bodyExtraBold, color: Colors.textMuted, marginRight: 4 },
  planPriceActive: { color: Colors.primary },
  planRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  planRadioActive: { borderColor: Colors.primary },
  planRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  payRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  payBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: Radius.md, borderWidth: 1.5, borderColor: Colors.borderSoft,
    backgroundColor: Colors.surface,
  },
  payBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  payBtnEmoji: { fontSize: 20 },
  payBtnText: { fontSize: 13.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted },
  payBtnTextActive: { color: Colors.primaryDark },

  instrCard: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, padding: 16,
    marginTop: 14, marginBottom: 6,
  },
  instrTitle: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 10 },
  instrStep: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textSecondary, marginBottom: 6, lineHeight: 20 },
  instrBold: { fontFamily: Fonts.bodyBold, color: Colors.text },
  instrNumber: {
    fontSize: 22, fontFamily: Fonts.bodyExtraBold, color: Colors.primary,
    textAlign: 'center', marginVertical: 8,
  },

  label: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.text, marginTop: 14, marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
    color: Colors.text, backgroundColor: Colors.surface, fontFamily: Fonts.bodyMedium,
  },

  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 16, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 9, marginTop: 22,
    ...(Shadows.button as object),
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 15, fontFamily: Fonts.bodyBold },

  legalNote: {
    fontSize: 11.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 14, lineHeight: 17,
  },

  doneWrap: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 36,
    backgroundColor: Colors.background,
  },
  doneTitle: { fontSize: 24, fontFamily: Fonts.display, color: Colors.text, marginTop: 22, marginBottom: 12 },
  doneSub: {
    fontSize: 14.5, fontFamily: Fonts.body, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 22, marginBottom: 32,
  },
  doneBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, paddingHorizontal: 36,
    ...(Shadows.button as object),
  },
  doneBtnText: { color: '#fff', fontSize: 15, fontFamily: Fonts.bodyBold },
});
