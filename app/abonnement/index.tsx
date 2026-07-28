import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useBoost } from '@/hooks/BoostContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { Star, CheckCircle, Crown } from 'lucide-react-native';

const WAVE_NUMBER = '77 338 65 40';
const OM_NUMBER = '77 338 65 40';

const AVANTAGES = [
  'Section « Partenaires certifiés » sur la page d\'accueil',
  'Position prioritaire dans les recherches',
  'Fiche complète : photos, téléphone, description',
  'Badge Partenaire certifié ⭐ sur votre profil',
  'Accès aux statistiques de visites de votre profil',
];

export default function AbonnementScreen() {
  const { user } = useAuthContext();
  const { requestSubscription, hasActiveSubscription } = useBoost();
  const [payMethod, setPayMethod] = useState<'wave' | 'orange_money'>('wave');
  const [payRef, setPayRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const payNumber = payMethod === 'wave' ? WAVE_NUMBER : OM_NUMBER;

  const handleSubmit = async () => {
    if (!payRef.trim()) {
      const msg = 'Entrez votre numéro de transaction';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Référence manquante', msg);
      return;
    }
    setLoading(true);
    const result = await requestSubscription(payMethod, payRef.trim());
    setLoading(false);
    if (result === 'ok') {
      setDone(true);
    } else {
      const msg = 'Une erreur est survenue. Vérifiez votre connexion.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erreur', msg);
    }
  };

  if (hasActiveSubscription) {
    return (
      <View style={styles.doneWrap}>
        <Crown size={64} color={Colors.gold} strokeWidth={1.4} />
        <Text style={styles.doneTitle}>Abonnement actif !</Text>
        <Text style={styles.doneSub}>
          Votre couvoir bénéficie de la visibilité maximale sur AviConnect.{'\n'}
          Votre abonnement se renouvelle chaque mois.
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

  if (done) {
    return (
      <View style={styles.doneWrap}>
        <CheckCircle size={64} color={Colors.primary} strokeWidth={1.5} />
        <Text style={styles.doneTitle}>Demande envoyée !</Text>
        <Text style={styles.doneSub}>
          Votre demande d'abonnement est en cours de validation.{'\n'}
          Votre couvoir sera mis en avant sous 24h après vérification du paiement.
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
        <View>
          <Text style={styles.headerTitle}>Abonnement Partenaire</Text>
          <Text style={styles.headerSub}>25 000 F CFA / mois</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Prix hero */}
        <View style={styles.priceHero}>
          <Crown size={36} color={Colors.gold} strokeWidth={1.5} />
          <Text style={styles.priceVal}>25 000 <Text style={styles.pricePer}>F CFA/mois</Text></Text>
          <Text style={styles.priceDesc}>Résiliable à tout moment</Text>
        </View>

        {/* Avantages */}
        <Text style={styles.sectionLabel}>Inclus dans l'abonnement</Text>
        {AVANTAGES.map((a) => (
          <View key={a} style={styles.advantageRow}>
            <Star size={14} color={Colors.gold} fill={Colors.gold} strokeWidth={1.5} />
            <Text style={styles.advantageText}>{a}</Text>
          </View>
        ))}

        {/* Mode de paiement */}
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

        {/* Instructions */}
        <View style={styles.instrCard}>
          <Text style={styles.instrTitle}>Comment payer ?</Text>
          <Text style={styles.instrStep}>
            1. Envoyez <Text style={styles.instrBold}>25 000 F CFA</Text> au numéro :
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
              <Crown size={18} color="#fff" strokeWidth={1.8} />
              <Text style={styles.submitBtnText}>S'abonner · 25 000 F/mois</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.legalNote}>
          Votre profil sera mis en avant après vérification du paiement (sous 24h ouvrées).
          L'abonnement est mensuel et non automatiquement reconduit — vous devrez renouveler chaque mois.
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
  backBtn: { marginBottom: 4 },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 20, fontFamily: Fonts.bodyBold, color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scroll: { padding: 18, paddingBottom: 60 },

  priceHero: {
    backgroundColor: Colors.ink, borderRadius: Radius.xl, padding: 28,
    alignItems: 'center', marginBottom: 24, gap: 6,
  },
  priceVal: { fontSize: 32, fontFamily: Fonts.display, color: '#fff', letterSpacing: -0.5, marginTop: 8 },
  pricePer: { fontSize: 15, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.6)' },
  priceDesc: { fontSize: 12, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.5)' },

  sectionLabel: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2,
    marginTop: 22, marginBottom: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, paddingBottom: 6,
  },

  advantageRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  advantageText: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, flex: 1, lineHeight: 20 },

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
