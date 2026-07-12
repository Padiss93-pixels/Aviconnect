import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    titre: '1. Objet et champ d\'application',
    contenu: `Le présent Accord sur le Traitement des Données (DPA) définit les obligations d\'AviConnect en tant que responsable du traitement des données à caractère personnel de ses utilisateurs, conformément à la Loi n°2008-12 du 25 janvier 2008 portant sur la Protection des Données à caractère Personnel au Sénégal.\n\nCet accord s\'applique à toutes les données traitées dans le cadre de l\'utilisation de l\'application AviConnect.`,
  },
  {
    titre: '2. Responsable du traitement',
    contenu: `Responsable du traitement : AviConnect\nReprésentant légal : Adama Sidibé\nSiège social : Dakar, République du Sénégal\nContact DPO : contact@aviconnect.sn\n\nConformément à l\'article 3 de la Loi n°2008-12, AviConnect est enregistré auprès de la Commission des Données Personnelles (CDP) du Sénégal.`,
  },
  {
    titre: '3. Données traitées',
    contenu: `Dans le cadre de l\'utilisation d\'AviConnect, nous traitons les catégories de données suivantes :\n\n• Données d\'identité : nom, prénom, rôle (éleveur, acheteur, couvoir)\n• Données de contact : numéro de téléphone, adresse email\n• Données de localisation : région déclarée\n• Données d\'activité : annonces publiées, besoins exprimés, commandes passées\n• Données techniques : identifiants de session stockés localement (AsyncStorage)\n\nAucune donnée sensible au sens de l\'article 27 de la Loi n°2008-12 n\'est collectée (pas de données biométriques, de santé, d\'origine ethnique).`,
  },
  {
    titre: '4. Finalités du traitement',
    contenu: `Les données sont traitées pour les finalités suivantes :\n\n• Création et gestion des comptes utilisateurs\n• Affichage et mise en relation entre acheteurs et vendeurs\n• Envoi de notifications liées aux annonces et commandes\n• Amélioration de l\'expérience utilisateur\n• Modération de la plateforme\n• Statistiques d\'utilisation (données agrégées et anonymisées)\n\nConformément à l\'article 5 de la Loi n°2008-12, les données ne sont pas utilisées à d\'autres fins que celles déclarées.`,
  },
  {
    titre: '5. Base légale du traitement',
    contenu: `Conformément à la Loi n°2008-12, les traitements effectués par AviConnect reposent sur :\n\n• Le consentement explicite de l\'utilisateur lors de l\'inscription\n• L\'exécution du contrat (CGU) accepté à l\'inscription\n• L\'intérêt légitime d\'AviConnect pour améliorer la plateforme\n\nL\'utilisateur peut retirer son consentement à tout moment en contactant support@aviconnect.sn.`,
  },
  {
    titre: '6. Durée de conservation',
    contenu: `Les données personnelles sont conservées :\n\n• Pendant toute la durée d\'activité du compte utilisateur\n• Puis supprimées dans un délai de 30 jours suivant la clôture du compte\n• Les données de transactions peuvent être conservées 5 ans à des fins comptables\n\nConformément à l\'article 14 de la Loi n°2008-12, les données ne sont pas conservées au-delà de la durée nécessaire.`,
  },
  {
    titre: '7. Transferts de données',
    contenu: `Les données des utilisateurs sénégalais sont traitées dans le respect du cadre légal sénégalais. En cas de transfert vers un pays tiers, AviConnect s\'assure que ce pays offre un niveau de protection adéquat ou que des garanties contractuelles appropriées sont mises en place, conformément aux articles 46 à 48 de la Loi n°2008-12.`,
  },
  {
    titre: '8. Sous-traitants',
    contenu: `AviConnect peut faire appel à des prestataires tiers pour des services techniques (hébergement, push notifications). Ces sous-traitants sont sélectionnés pour leur conformité aux standards de protection des données et sont liés par des obligations contractuelles de confidentialité.\n\nAucun sous-traitant ne peut utiliser les données des utilisateurs AviConnect à ses propres fins.`,
  },
  {
    titre: '9. Sécurité des données',
    contenu: `AviConnect met en œuvre des mesures techniques et organisationnelles appropriées pour protéger les données contre :\n\n• L\'accès non autorisé\n• La modification ou destruction accidentelle\n• La divulgation illicite\n\nLes données sont stockées localement sur l\'appareil de l\'utilisateur via AsyncStorage avec les protections natives d\'iOS et Android. Les mots de passe ne sont jamais stockés en clair.`,
  },
  {
    titre: '10. Vos droits selon la Loi n°2008-12',
    contenu: `Conformément à la Loi n°2008-12, vous disposez des droits suivants :\n\n• Droit d\'accès (art. 37) : obtenir la liste de vos données traitées\n• Droit de rectification (art. 38) : corriger des données inexactes\n• Droit d\'opposition (art. 40) : s\'opposer à certains traitements\n• Droit de suppression : demander l\'effacement de vos données\n\nPour exercer ces droits : contact@aviconnect.sn\n\nVous pouvez également saisir la CDP (Commission des Données Personnelles) : www.cdp.sn`,
  },
  {
    titre: '11. Contact DPO',
    contenu: `Pour toute question relative au traitement de vos données :\n\nEmail : contact@aviconnect.sn\nSujet : [DPA] + votre demande\nDélai de réponse : 72 heures ouvrées\n\nAutorité de contrôle : Commission des Données Personnelles (CDP) du Sénégal`,
  },
];

export default function DPA() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Accord sur le traitement des données</Text>
          <Text style={styles.headerSub}>DPA · Loi n°2008-12 · Juillet 2025</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="shield-checkmark" size={30} color="#7c3aed" />
          <Text style={styles.introText}>
            Cet accord définit comment AviConnect traite vos données personnelles, conformément à la Loi n°2008-12 du 25 janvier 2008 sur la protection des données au Sénégal et sous le contrôle de la CDP.
          </Text>
        </View>

        <View style={styles.cdpBadge}>
          <Ionicons name="shield" size={20} color="#7c3aed" />
          <Text style={styles.cdpText}>Traitement déclaré à la CDP — Commission des Données Personnelles du Sénégal</Text>
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
    backgroundColor: '#5b21b6',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 15, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  introBanner: {
    backgroundColor: '#f5f3ff', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 16,
  },
  introText: { flex: 1, fontSize: 13, color: '#5b21b6', lineHeight: 19, fontWeight: '500' },
  cdpBadge: {
    backgroundColor: '#ede9fe', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24,
  },
  cdpText: { flex: 1, fontSize: 12, color: '#6d28d9', fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});

