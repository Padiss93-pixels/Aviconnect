import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    titre: '1. Que sont les cookies / le stockage local ?',
    contenu: `AviConnect est une application mobile. Elle n\'utilise pas de cookies au sens traditionnel du terme (fichiers déposés par un navigateur web).\n\nEn revanche, l\'application utilise des technologies de stockage local sur votre appareil, notamment AsyncStorage (équivalent mobile des cookies), pour assurer son bon fonctionnement.`,
  },
  {
    titre: '2. Données stockées localement',
    contenu: `AviConnect stocke les informations suivantes sur votre appareil :\n\n• Jeton de session : pour vous maintenir connecté entre les ouvertures de l\'application\n• Vos préférences : langue, paramètres d\'affichage\n• Cache des annonces : pour un affichage rapide sans connexion\n• Données temporaires de formulaires : pour ne pas perdre vos saisies en cours\n\nCes données restent sur votre appareil et ne sont pas partagées avec des tiers.`,
  },
  {
    titre: '3. Finalités du stockage',
    contenu: `Le stockage local sert uniquement à :\n\n✅ Maintenir votre session active (éviter de vous reconnecter à chaque ouverture)\n✅ Améliorer la rapidité de l\'application (mise en cache)\n✅ Sauvegarder temporairement vos saisies en cours\n\nAucun suivi publicitaire ni profilage comportemental n\'est effectué via ces données.`,
  },
  {
    titre: '4. Données analytiques',
    contenu: `AviConnect peut collecter des données anonymes d\'utilisation pour améliorer ses services :\n\n• Nombre de sessions\n• Fonctionnalités les plus utilisées\n• Erreurs techniques rencontrées\n\nCes données sont entièrement anonymisées et ne permettent pas de vous identifier personnellement. Elles ne sont pas croisées avec vos données de profil.`,
  },
  {
    titre: '5. Durée de conservation',
    contenu: `Les données stockées localement sont conservées :\n\n• Jeton de session : jusqu\'à votre déconnexion ou expiration automatique (30 jours)\n• Cache des annonces : 24 heures maximum\n• Préférences utilisateur : jusqu\'à désinstallation de l\'application\n\nLa désinstallation de l\'application supprime toutes les données stockées localement sur votre appareil.`,
  },
  {
    titre: '6. Contrôle et suppression',
    contenu: `Vous pouvez contrôler le stockage local de deux façons :\n\n1. Depuis l\'application : vous déconnecter supprime votre jeton de session\n2. Depuis votre téléphone : vider le cache de l\'application via les paramètres de votre appareil (iOS > Réglages > AviConnect / Android > Paramètres > Applications > AviConnect > Effacer les données)\n\nLa suppression du cache peut vous déconnecter et ralentir temporairement l\'affichage.`,
  },
  {
    titre: '7. Tiers et SDK',
    contenu: `AviConnect peut intégrer des SDK tiers pour les fonctionnalités suivantes :\n\n• Notifications push (Expo Notifications)\n• Téléchargement d\'images (Expo Image)\n\nCes SDK peuvent déposer leurs propres données techniques sur votre appareil. Ils sont sélectionnés pour leur conformité aux standards de protection des données. Aucun SDK publicitaire ou de tracking n\'est utilisé.`,
  },
  {
    titre: '8. Base légale',
    contenu: `Le stockage local strictement nécessaire au fonctionnement de l\'application (session, cache) est effectué sur la base de l\'intérêt légitime d\'AviConnect à fournir un service fonctionnel, conformément à la Loi n°2008-12 du 25 janvier 2008 sur la protection des données au Sénégal.\n\nLe stockage analytique repose sur votre consentement implicite lors de l\'utilisation de l\'application.`,
  },
  {
    titre: '9. Contact',
    contenu: `Pour toute question sur le stockage des données locales :\n\nEmail : contact@aviconnect.sn\nObjet : [COOKIES] + votre question\nDélai de réponse : 72 heures ouvrées`,
  },
];

export default function PolitiqueCookies() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Politique de cookies</Text>
          <Text style={styles.headerSub}>Stockage local · Juillet 2025</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="phone-portrait" size={30} color="#ea580c" />
          <Text style={styles.introText}>
            AviConnect est une application mobile. Au lieu de cookies, elle utilise le stockage local de votre appareil (AsyncStorage) pour fonctionner correctement, sans aucun suivi publicitaire.
          </Text>
        </View>

        <View style={styles.noCookiesBox}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.noCookiesText}>Aucun cookie publicitaire · Aucun tracking · Aucune revente de données</Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitre}>{s.titre}</Text>
            <Text style={styles.sectionContenu}>{s.contenu}</Text>
          </View>
        ))}

        <View style={styles.legalRef}>
          <Text style={styles.legalRefTitle}>Base légale</Text>
          <Text style={styles.legalRefText}>Loi n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel au Sénégal · CDP (Commission des Données Personnelles)</Text>
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
    backgroundColor: '#c2410c',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },
  introBanner: {
    backgroundColor: '#fff7ed', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 16,
  },
  introText: { flex: 1, fontSize: 13, color: '#9a3412', lineHeight: 19, fontWeight: '500' },
  noCookiesBox: {
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24,
  },
  noCookiesText: { flex: 1, fontSize: 12, color: '#15803d', fontWeight: '600' },
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  legalRef: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: 12,
    padding: 16, marginBottom: 24, gap: 6,
  },
  legalRefTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  legalRefText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});

