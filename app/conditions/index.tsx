import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    titre: '1. Objet',
    contenu: `Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de l'application mobile AviConnect, marketplace avicole dédiée aux acteurs du secteur de la volaille au Sénégal.\n\nEn créant un compte ou en utilisant AviConnect, vous acceptez pleinement et sans réserve ces CGU.`,
  },
  {
    titre: '2. Description du service',
    contenu: `AviConnect est une plateforme numérique permettant :\n\n• Aux éleveurs de publier et vendre leurs animaux et produits avicoles (poulets, poussins, œufs, aliments)\n• Aux acheteurs de rechercher des produits et de publier leurs besoins\n• Aux couvoirs certifiés de proposer leurs poussins et aliments\n• À tous les utilisateurs de se mettre en contact via WhatsApp\n\nAviConnect agit en tant qu'intermédiaire de mise en relation et n'est pas partie aux transactions commerciales entre utilisateurs.`,
  },
  {
    titre: '3. Inscription et compte',
    contenu: `Pour utiliser AviConnect, vous devez :\n\n• Être âgé d'au moins 18 ans\n• Fournir des informations exactes et complètes lors de l'inscription\n• Disposer d'un numéro de téléphone sénégalais valide\n• Choisir un rôle correspondant à votre activité réelle (éleveur, acheteur, couvoir)\n\nVous êtes responsable de la confidentialité de vos identifiants de connexion. Tout accès via votre compte est réputé effectué par vous.`,
  },
  {
    titre: '4. Règles de publication',
    contenu: `Les annonces et besoins publiés sur AviConnect doivent :\n\n• Être réels et correspondre à des produits avicoles disponibles ou recherchés\n• Comporter des informations exactes (prix, quantités, disponibilité)\n• Respecter les normes sanitaires et réglementaires sénégalaises\n• Ne pas contenir de contenu illicite, offensant ou trompeur\n\nAviConnect se réserve le droit de supprimer toute annonce ne respectant pas ces règles, sans préavis.`,
  },
  {
    titre: '5. Rôles et restrictions',
    contenu: `Selon votre profil, des restrictions s'appliquent :\n\n🛒 Acheteur : peut uniquement publier des besoins (demandes d'achat). Ne peut pas publier d'annonces de vente.\n\n🏭 Couvoir : peut uniquement publier des annonces de poussins et d'aliments. Doit obtenir la certification AviConnect pour apparaître dans la liste des couvoirs certifiés.\n\n🐔 Éleveur : peut publier toutes catégories d'annonces avicoles.\n\n🔐 Admin : accès complet à la gestion de la plateforme.`,
  },
  {
    titre: '6. Certification des couvoirs',
    contenu: `Les couvoirs souhaitant obtenir le badge "Certifié AviConnect" doivent :\n\n• S'inscrire avec le rôle "Couvoir"\n• Soumettre leur profil à validation\n• Attendre la vérification par l'équipe AviConnect\n\nAviConnect se réserve le droit d'accorder, suspendre ou retirer la certification à tout moment, sans obligation de motivation.`,
  },
  {
    titre: '7. Transactions et paiements',
    contenu: `AviConnect est une plateforme de mise en relation. Les transactions commerciales (paiement, livraison, garantie) sont réalisées directement entre acheteur et vendeur, en dehors de la plateforme.\n\nAviConnect décline toute responsabilité en cas de litige commercial entre utilisateurs, de non-paiement, de produit non conforme ou de toute autre réclamation liée à une transaction.`,
  },
  {
    titre: '8. Comportements interdits',
    contenu: `Il est strictement interdit de :\n\n• Publier de fausses annonces ou informations trompeuses\n• Utiliser la plateforme à des fins illégales\n• Harceler, menacer ou escroquer d'autres utilisateurs\n• Tenter de contourner les mesures de sécurité\n• Créer plusieurs comptes pour contourner un bannissement\n• Publier du contenu sans rapport avec l'aviculture\n\nTout manquement peut entraîner la suspension ou suppression définitive du compte.`,
  },
  {
    titre: '9. Responsabilité',
    contenu: `AviConnect s'efforce d'assurer la disponibilité de la plateforme mais ne garantit pas un accès ininterrompu. Nous déclinons toute responsabilité pour :\n\n• Les dommages résultant d'une interruption de service\n• Le contenu publié par les utilisateurs\n• Les litiges entre utilisateurs\n• La perte de données due à des circonstances hors de notre contrôle`,
  },
  {
    titre: '10. Modification et résiliation',
    contenu: `AviConnect se réserve le droit de modifier ces CGU à tout moment. Les modifications importantes seront notifiées via l'application.\n\nVous pouvez supprimer votre compte à tout moment en contactant le support à support@aviconnect.sn. AviConnect peut suspendre ou supprimer un compte en cas de violation des présentes CGU.`,
  },
  {
    titre: '11. Droit applicable',
    contenu: `Les présentes CGU sont soumises au droit sénégalais.\n\nTextes applicables :\n• Loi n°2008-08 du 25 janvier 2008 sur les transactions électroniques\n• Loi n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel\n• Loi n°2008-11 du 25 janvier 2008 portant sur la cybercriminalité\n\nEn cas de litige, les parties s'efforceront de trouver une solution amiable avant tout recours judiciaire. À défaut, les tribunaux compétents de Dakar seront seuls compétents.`,
  },
  {
    titre: '12. Nous contacter',
    contenu: `Pour toute question relative aux présentes CGU :\n\n📧 Contact général : contact@aviconnect.sn\n🛟 Support utilisateurs : support@aviconnect.sn\n🤝 Partenariats : partenaires@aviconnect.sn`,
  },
];

export default function ConditionsGenerales() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Conditions générales d'utilisation</Text>
          <Text style={styles.headerSub}>Dernière mise à jour : Juillet 2025</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="document-text" size={32} color="#1e40af" />
          <Text style={styles.introText}>
            Veuillez lire attentivement ces conditions avant d'utiliser AviConnect. En vous inscrivant, vous acceptez l'ensemble de ces règles.
          </Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitre}>{s.titre}</Text>
            <Text style={styles.sectionContenu}>{s.contenu}</Text>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 AviConnect · Tous droits réservés</Text>
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
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 60 },

  introBanner: {
    backgroundColor: '#eff6ff', borderRadius: 16,
    padding: 16, flexDirection: 'row', alignItems: 'flex-start',
    gap: 12, marginBottom: 24,
  },
  introText: { flex: 1, fontSize: 13, color: '#1e40af', lineHeight: 19, fontWeight: '500' },

  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },

  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});
