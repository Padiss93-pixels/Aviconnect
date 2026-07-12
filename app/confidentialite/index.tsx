import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    titre: '1. Responsable du traitement',
    contenu: `AviConnect est le responsable du traitement de vos données personnelles, conformément à la Loi n°2008-12 du 25 janvier 2008 portant sur la Protection des Données à caractère Personnel au Sénégal.\n\nÉditeur : AviConnect — Dakar, Sénégal\nContact DPO : contact@aviconnect.sn\nSupport : support@aviconnect.sn\nPartenariats : partenaires@aviconnect.sn`,
  },
  {
    titre: '2. Données collectées',
    contenu: `Lors de votre inscription et utilisation d\'AviConnect, nous collectons :\n\n• Données d\'identité : nom, prénom, rôle (éleveur, acheteur, couvoir)\n• Données de contact : adresse email, numéro de téléphone sénégalais\n• Données de localisation : région déclarée\n• Données d\'activité : annonces publiées, besoins exprimés, commandes passées\n• Données techniques : jeton de session stocké localement (AsyncStorage)\n\nAucune donnée sensible (biométrique, santé, ethnie) n\'est collectée (art. 27 — Loi n°2008-12).`,
  },
  {
    titre: '3. Finalités et base légale',
    contenu: `Vos données sont traitées pour les finalités suivantes, conformément à l\'article 5 de la Loi n°2008-12 :\n\n• Création et gestion de compte (base : exécution du contrat)\n• Mise en relation acheteurs/vendeurs (base : exécution du contrat)\n• Notifications liées aux transactions (base : intérêt légitime)\n• Amélioration de la plateforme (base : intérêt légitime)\n• Modération et sécurité (base : obligation légale)\n\nVos données ne sont jamais vendues à des tiers.`,
  },
  {
    titre: '4. Partage des données',
    contenu: `Certaines informations (nom, région, téléphone) sont visibles par les autres utilisateurs lorsque vous publiez une annonce ou un besoin. Cette visibilité est nécessaire pour les contacts commerciaux et repose sur votre consentement à l\'inscription.\n\nNous ne partageons pas vos données avec des partenaires commerciaux sans votre accord explicite.`,
  },
  {
    titre: '5. Durée de conservation',
    contenu: `Conformément à l\'article 14 de la Loi n°2008-12, vos données sont conservées :\n\n• Pendant toute la durée de vie de votre compte\n• Puis supprimées dans les 30 jours suivant la clôture\n• Données de transactions : conservées 5 ans (obligation comptable)\n\nLa désinstallation de l\'application supprime immédiatement les données stockées localement sur votre appareil.`,
  },
  {
    titre: '6. Sécurité',
    contenu: `AviConnect met en œuvre des mesures techniques et organisationnelles pour protéger vos données :\n\n• Stockage local chiffré par les protections natives iOS et Android\n• Accès aux données limité aux équipes autorisées\n• Mots de passe jamais stockés en clair\n• Audit de sécurité régulier\n\nEn cas de violation de données, vous serez informé conformément à la Loi n°2008-12.`,
  },
  {
    titre: '7. Vos droits (Loi n°2008-12)',
    contenu: `Conformément à la Loi n°2008-12, vous disposez des droits suivants :\n\n• Droit d\'accès (art. 37) : liste de vos données traitées\n• Droit de rectification (art. 38) : correction des données inexactes\n• Droit à l\'effacement : suppression de vos données\n• Droit d\'opposition (art. 40) : opposition à certains traitements\n• Droit à la portabilité : recevoir vos données en format lisible\n\nPour exercer vos droits : contact@aviconnect.sn\nVous pouvez aussi saisir la CDP (Commission des Données Personnelles) : www.cdp.sn`,
  },
  {
    titre: '8. Stockage local (cookies)',
    contenu: `AviConnect utilise AsyncStorage (équivalent mobile des cookies) pour :\n\n• Maintenir votre session active\n• Mettre en cache les annonces pour un affichage rapide\n• Sauvegarder vos préférences\n\nAucun cookie publicitaire ni outil de tracking n\'est utilisé. Voir notre Politique de cookies pour plus de détails.`,
  },
  {
    titre: '9. Modifications',
    contenu: `AviConnect se réserve le droit de modifier cette politique à tout moment. Toute modification importante vous sera notifiée via l\'application. La poursuite de l\'utilisation après notification vaut acceptation des nouvelles conditions.`,
  },
  {
    titre: '10. Contact et CDP',
    contenu: `Pour toute question relative à vos données personnelles :\n\nEmail : contact@aviconnect.sn\nDélai de réponse : 72 heures ouvrées\n\nAutorité de contrôle :\nCommission des Données Personnelles (CDP) du Sénégal\nwww.cdp.sn`,
  },
];

export default function PolitiqueConfidentialite() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Politique de confidentialité</Text>
          <Text style={styles.headerSub}>Loi n°2008-12 · CDP Sénégal · Juillet 2025</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.primary} />
          <Text style={styles.introText}>
            AviConnect protège vos données personnelles conformément à la Loi n°2008-12 du 25 janvier 2008 sur la protection des données au Sénégal, sous le contrôle de la CDP.
          </Text>
        </View>

        <View style={styles.cdpBadge}>
          <Ionicons name="shield" size={16} color="#5b21b6" />
          <Text style={styles.cdpText}>Conforme Loi n°2008-12 · CDP Sénégal</Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitre}>{s.titre}</Text>
            <Text style={styles.sectionContenu}>{s.contenu}</Text>
          </View>
        ))}

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
    gap: 12, marginBottom: 16,
  },
  introText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 19, fontWeight: '500' },
  cdpBadge: {
    backgroundColor: '#ede9fe', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 24, alignSelf: 'flex-start',
  },
  cdpText: { fontSize: 12, color: '#5b21b6', fontWeight: '700' },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});

