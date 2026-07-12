import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity, Linking } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const DROITS = [
  {
    icon: 'eye-outline' as const,
    couleur: '#2563eb',
    bg: '#eff6ff',
    titre: 'Droit d\'accès',
    article: 'Art. 37 — Loi n°2008-12',
    contenu: `Vous avez le droit d\'obtenir la confirmation que des données vous concernant sont traitées par AviConnect, ainsi que la liste complète de ces données.\n\nPour exercer ce droit, envoyez un email à contact@aviconnect.sn avec l\'objet "[ACCÈS] Mes données".`,
  },
  {
    icon: 'create-outline' as const,
    couleur: '#16a34a',
    bg: '#f0fdf4',
    titre: 'Droit de rectification',
    article: 'Art. 38 — Loi n°2008-12',
    contenu: `Vous pouvez demander la correction de toute donnée inexacte, incomplète ou obsolète vous concernant.\n\nVous pouvez aussi modifier directement vos informations depuis votre profil dans l\'application AviConnect (nom, téléphone, région).`,
  },
  {
    icon: 'trash-outline' as const,
    couleur: '#dc2626',
    bg: '#fef2f2',
    titre: 'Droit à l\'effacement',
    article: 'Art. 38 — Loi n°2008-12',
    contenu: `Vous avez le droit de demander la suppression de vos données personnelles, sauf si leur conservation est nécessaire à l\'exécution d\'une obligation légale.\n\nSuppression du compte et des données : support@aviconnect.sn\nDélai de traitement : 30 jours maximum.`,
  },
  {
    icon: 'hand-left-outline' as const,
    couleur: '#d97706',
    bg: '#fffbeb',
    titre: 'Droit d\'opposition',
    article: 'Art. 40 — Loi n°2008-12',
    contenu: `Vous pouvez vous opposer à tout moment au traitement de vos données pour des raisons tenant à votre situation particulière.\n\nVous pouvez notamment vous opposer à la réception de notifications ou à l\'utilisation de vos données à des fins de statistiques.`,
  },
  {
    icon: 'lock-closed-outline' as const,
    couleur: '#7c3aed',
    bg: '#f5f3ff',
    titre: 'Droit à la limitation',
    article: 'Loi n°2008-12',
    contenu: `Vous pouvez demander la limitation du traitement de vos données dans les cas suivants :\n\n• Vous contestez l\'exactitude de vos données (pendant la vérification)\n• Le traitement est illicite mais vous préférez la limitation à l\'effacement\n• Vous avez exercé votre droit d\'opposition (pendant l\'examen)`,
  },
  {
    icon: 'download-outline' as const,
    couleur: '#0891b2',
    bg: '#ecfeff',
    titre: 'Droit à la portabilité',
    article: 'Loi n°2008-12',
    contenu: `Vous avez le droit de recevoir vos données dans un format structuré et lisible, afin de les transmettre à un autre service si vous le souhaitez.\n\nDemande de portabilité : contact@aviconnect.sn\nObjet : "[PORTABILITÉ] Mes données AviConnect"`,
  },
  {
    icon: 'alert-circle-outline' as const,
    couleur: '#ea580c',
    bg: '#fff7ed',
    titre: 'Droit de saisir la CDP',
    article: 'Art. 43 — Loi n°2008-12',
    contenu: `Si vous estimez que vos droits ne sont pas respectés, vous pouvez saisir la Commission des Données Personnelles (CDP) du Sénégal, autorité de contrôle indépendante.\n\nSite web : www.cdp.sn\nAdresse : Dakar, Sénégal\n\nAviConnect s\'engage à coopérer pleinement avec la CDP.`,
  },
];

export default function MesDroits() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mes droits sur mes données</Text>
          <Text style={styles.headerSub}>Loi n°2008-12 — CDP Sénégal</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="person-circle" size={30} color={Colors.primary} />
          <Text style={styles.introText}>
            En tant qu\'utilisateur d\'AviConnect au Sénégal, vous bénéficiez de droits garantis par la Loi n°2008-12 du 25 janvier 2008 sur la protection des données personnelles.
          </Text>
        </View>

        {DROITS.map((d, i) => (
          <View key={i} style={[styles.droitCard, { borderLeftColor: d.couleur }]}>
            <View style={[styles.droitIconBox, { backgroundColor: d.bg }]}>
              <Ionicons name={d.icon} size={22} color={d.couleur} />
            </View>
            <View style={styles.droitBody}>
              <Text style={[styles.droitTitre, { color: d.couleur }]}>{d.titre}</Text>
              <Text style={styles.droitArticle}>{d.article}</Text>
              <Text style={styles.droitContenu}>{d.contenu}</Text>
            </View>
          </View>
        ))}

        <View style={styles.contactBox}>
          <Text style={styles.contactTitle}>Exercer vos droits</Text>
          <Text style={styles.contactSub}>Toute demande doit être envoyée par email avec une preuve d\'identité. Délai de réponse : 72 heures ouvrées.</Text>
          <TouchableOpacity style={styles.contactBtn} onPress={() => Linking.openURL('mailto:contact@aviconnect.sn?subject=[DROITS] Demande RGPD')}>
            <Ionicons name="mail" size={18} color="#fff" />
            <Text style={styles.contactBtnText}>contact@aviconnect.sn</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cdpBox}>
          <Ionicons name="shield" size={20} color="#6d28d9" />
          <View style={{ flex: 1 }}>
            <Text style={styles.cdpTitle}>Commission des Données Personnelles (CDP)</Text>
            <Text style={styles.cdpSub}>Autorité de contrôle sénégalaise — www.cdp.sn</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 AviConnect · Dakar, Sénégal</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  introBanner: {
    backgroundColor: Colors.primaryLight, borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 24,
  },
  introText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 19, fontWeight: '500' },
  droitCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    flexDirection: 'row', gap: 14, marginBottom: 16,
    borderLeftWidth: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  droitIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  droitBody: { flex: 1 },
  droitTitre: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  droitArticle: { fontSize: 11, color: Colors.textMuted, marginBottom: 8, fontStyle: 'italic' },
  droitContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  contactBox: {
    backgroundColor: Colors.primary, borderRadius: 16, padding: 20, marginBottom: 16,
  },
  contactTitle: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 6 },
  contactSub: { fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 18, marginBottom: 14 },
  contactBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 10, paddingVertical: 12,
    paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  cdpBox: {
    backgroundColor: '#ede9fe', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24,
  },
  cdpTitle: { fontSize: 13, fontWeight: '700', color: '#5b21b6', marginBottom: 2 },
  cdpSub: { fontSize: 12, color: '#7c3aed' },
  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});

