import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const SECTIONS = [
  {
    titre: '1. Éditeur de l\'application',
    contenu: `Nom de l\'application : AviConnect\nNature : Marketplace avicole mobile et web\nStatut juridique : En cours d\'immatriculation au RCCM de Dakar\n\nFondateur & Directeur de publication :\nAdama Sidibé\nEmail : contact@aviconnect.sn`,
  },
  {
    titre: '2. Siège social',
    contenu: `AviConnect\nDakar, République du Sénégal\n\nContact général : contact@aviconnect.sn\nSupport utilisateurs : support@aviconnect.sn\nPartenariats : partenaires@aviconnect.sn`,
  },
  {
    titre: '3. Hébergement',
    contenu: `L\'application AviConnect est hébergée par des prestataires tiers proposant des services d\'infrastructure cloud. Les données des utilisateurs sénégalais sont traitées dans le respect de la législation en vigueur.\n\nPour toute question relative à l\'hébergement, contactez : support@aviconnect.sn`,
  },
  {
    titre: '4. Activité réglementée',
    contenu: `AviConnect est une plateforme de mise en relation entre acteurs de la filière avicole au Sénégal. Elle ne constitue pas une activité bancaire, financière ou de transport. Les transactions commerciales sont conclues directement entre les utilisateurs, en dehors de la plateforme.\n\nAviConnect agit en tant qu\'intermédiaire de mise en relation et non en tant que partie contractante aux transactions.`,
  },
  {
    titre: '5. Propriété intellectuelle',
    contenu: `L\'ensemble des éléments composant l\'application AviConnect (logo, charte graphique, textes, structure, fonctionnalités) est la propriété exclusive d\'AviConnect et est protégé par les lois sénégalaises relatives à la propriété intellectuelle.\n\nToute reproduction, représentation, modification ou exploitation non autorisée est interdite et constitue une contrefaçon sanctionnée par la loi sénégalaise.`,
  },
  {
    titre: '6. Responsabilité',
    contenu: `AviConnect s\'efforce d\'assurer l\'exactitude et la mise à jour des informations diffusées sur la plateforme. Toutefois, AviConnect ne saurait être tenu responsable :\n\n• Des informations publiées par les utilisateurs\n• Des transactions réalisées entre utilisateurs\n• De tout préjudice résultant d\'une interruption de service\n• Du contenu des sites tiers accessibles via des liens`,
  },
  {
    titre: '7. Droit applicable',
    contenu: `Les présentes mentions légales sont soumises au droit sénégalais.\n\nTextes applicables :\n• Loi n°2008-08 du 25 janvier 2008 sur les transactions électroniques\n• Loi n°2008-12 du 25 janvier 2008 sur la protection des données à caractère personnel\n• Loi n°2008-11 du 25 janvier 2008 sur la cybercriminalité\n\nTout litige sera soumis aux juridictions compétentes de Dakar.`,
  },
  {
    titre: '8. Contact',
    contenu: `Pour toute question relative aux présentes mentions légales :\n\nEmail : contact@aviconnect.sn\nRéponse sous 72 heures ouvrées.`,
  },
];

export default function MentionsLegales() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mentions légales</Text>
          <Text style={styles.headerSub}>Dernière mise à jour : Juillet 2025</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.introBanner}>
          <Ionicons name="information-circle" size={30} color={Colors.primary} />
          <Text style={styles.introText}>
            Conformément à la loi n°2008-08 du 25 janvier 2008 sur les transactions électroniques au Sénégal, voici les informations légales relatives à AviConnect.
          </Text>
        </View>

        {SECTIONS.map((s, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitre}>{s.titre}</Text>
            <Text style={styles.sectionContenu}>{s.contenu}</Text>
          </View>
        ))}

        <View style={styles.legalRef}>
          <Text style={styles.legalRefTitle}>Textes de référence</Text>
          <Text style={styles.legalRefText}>• Loi n°2008-08 sur les transactions électroniques</Text>
          <Text style={styles.legalRefText}>• Loi n°2008-12 sur la protection des données personnelles</Text>
          <Text style={styles.legalRefText}>• Loi n°2008-11 sur la cybercriminalité</Text>
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
  section: { marginBottom: 24 },
  sectionTitre: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  sectionContenu: { fontSize: 13, color: Colors.textSecondary, lineHeight: 21 },
  legalRef: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: 12,
    padding: 16, marginBottom: 24, gap: 6,
  },
  legalRefTitle: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  legalRefText: { fontSize: 12, color: Colors.textMuted },
  footer: { alignItems: 'center', paddingTop: 16, borderTopWidth: 1, borderTopColor: Colors.border },
  footerText: { fontSize: 12, color: Colors.textMuted },
});

