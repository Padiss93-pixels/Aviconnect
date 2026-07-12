import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

const FAQ = [
  {
    q: 'Comment publier une annonce ?',
    a: 'Connectez-vous, puis appuyez sur le bouton "+" au centre de la barre de navigation. Remplissez les informations de votre lot (produit, quantité, prix, région) et appuyez sur "Publier l\'annonce".',
  },
  {
    q: 'Comment publier un besoin en tant qu\'acheteur ?',
    a: 'Les acheteurs peuvent publier leurs besoins depuis le bouton "+" de la barre de navigation. Un formulaire spécial "Besoin" s\'affiche automatiquement selon votre profil acheteur.',
  },
  {
    q: 'Comment contacter un éleveur ou un couvoir ?',
    a: 'Ouvrez une annonce qui vous intéresse, puis appuyez sur le bouton WhatsApp pour contacter directement le vendeur. Vous pouvez aussi envoyer un message interne ou passer une commande.',
  },
  {
    q: 'Comment créer un compte ?',
    a: 'Sur la page de connexion, appuyez sur "Créer un compte". Choisissez votre profil (Éleveur, Acheteur ou Couvoir), remplissez vos informations et validez.',
  },
  {
    q: 'Qu\'est-ce qu\'un couvoir certifié ?',
    a: 'Les couvoirs certifiés ont été vérifiés par l\'équipe AviConnect. Ils garantissent la qualité sanitaire et génétique de leurs poussins. Le badge "✅ Certifié" apparaît sur leur profil.',
  },
  {
    q: 'Comment obtenir la certification couvoir ?',
    a: 'Inscrivez-vous avec le rôle "Couvoir". Votre profil sera automatiquement soumis à vérification. L\'équipe AviConnect vous contactera pour valider votre certification.',
  },
  {
    q: 'Les paiements sont-ils sécurisés ?',
    a: 'AviConnect est une plateforme de mise en relation. Les transactions se font directement entre acheteurs et vendeurs. Nous conseillons de toujours vérifier l\'identité de votre interlocuteur avant tout paiement.',
  },
  {
    q: 'Comment signaler une annonce frauduleuse ?',
    a: 'Contactez-nous à support@aviconnect.sn ou via contact@aviconnect.sn. Nous traiterons votre signalement dans les 24h.',
  },
  {
    q: 'Comment modifier ou supprimer mon annonce ?',
    a: 'Allez dans "Mes annonces" depuis votre profil. Vous pouvez modifier ou supprimer n\'importe laquelle de vos annonces actives.',
  },
  {
    q: 'L\'application est-elle disponible sur iOS et Android ?',
    a: 'Oui, AviConnect est disponible sur l\'App Store (iOS) et le Google Play Store (Android). La version web est également accessible depuis n\'importe quel navigateur.',
  },
];

export default function AideScreen() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Aide & Support</Text>
          <Text style={styles.headerSub}>Nous sommes là pour vous aider</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* Contacts */}
        <Text style={styles.sectionTitle}>Nous contacter</Text>
        <View style={styles.contactsCard}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:contact@aviconnect.sn')}>
            <View style={[styles.contactIcon, { backgroundColor: Colors.primaryLight }]}>
              <Ionicons name="globe-outline" size={20} color={Colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Contact général</Text>
              <Text style={styles.contactEmail}>contact@aviconnect.sn</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:support@aviconnect.sn')}>
            <View style={[styles.contactIcon, { backgroundColor: '#eff6ff' }]}>
              <Ionicons name="help-buoy-outline" size={20} color="#1e40af" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Support utilisateurs</Text>
              <Text style={styles.contactEmail}>support@aviconnect.sn</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL('mailto:partenaires@aviconnect.sn')}>
            <View style={[styles.contactIcon, { backgroundColor: '#fefce8' }]}>
              <Ionicons name="briefcase-outline" size={20} color="#92400e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Partenariats</Text>
              <Text style={styles.contactEmail}>partenaires@aviconnect.sn</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Questions fréquentes</Text>

        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqCard}
            onPress={() => toggle(i)}
            activeOpacity={0.8}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{item.q}</Text>
              <Ionicons
                name={openIndex === i ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.primary}
              />
            </View>
            {openIndex === i && (
              <Text style={styles.faqAnswer}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Liens légaux */}
        <Text style={styles.sectionTitle}>Documents légaux</Text>
        <View style={styles.legalCard}>
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/confidentialite' as any)}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Politique de confidentialité</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/conditions' as any)}>
            <Ionicons name="document-text-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Conditions générales d'utilisation</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/mentions-legales' as any)}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Mentions légales</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/dpa' as any)}>
            <Ionicons name="shield-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Accord traitement données (DPA)</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/mes-droits' as any)}>
            <Ionicons name="person-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Mes droits sur mes données</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.legalDivider} />
          <TouchableOpacity style={styles.legalItem} onPress={() => router.push('/cookies' as any)}>
            <Ionicons name="phone-portrait-outline" size={20} color={Colors.primary} />
            <Text style={styles.legalText}>Politique de cookies</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Contact bas de page */}
        <View style={styles.bottomCard}>
          <Text style={styles.bottomTitle}>Vous n'avez pas trouvé votre réponse ?</Text>
          <Text style={styles.bottomSub}>Écrivez-nous, nous répondons sous 24h</Text>
          <TouchableOpacity
            style={styles.bottomBtn}
            onPress={() => Linking.openURL('mailto:support@aviconnect.sn?subject=Demande%20d%27aide')}
          >
            <Ionicons name="send" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.bottomBtnText}>support@aviconnect.sn</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>AviConnect · Version 1.0.0</Text>
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
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  contactCard: {
    backgroundColor: Colors.primary, borderRadius: 20, padding: 20, marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
      android: { elevation: 6 },
    }),
  },
  contactTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 6 },
  contactSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  contactBtns: { flexDirection: 'row', gap: 10 },
  contactBtn: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center', gap: 6,
  },
  contactBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  sectionTitle: {
    fontSize: 16, fontWeight: '800', color: Colors.text,
    marginBottom: 12, marginTop: 4,
  },

  faqCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16, marginBottom: 8,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  faqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1, marginRight: 8 },
  faqAnswer: {
    fontSize: 13, color: Colors.textSecondary, marginTop: 12,
    lineHeight: 21, borderTopWidth: 1, borderTopColor: Colors.border, paddingTop: 12,
  },

  contactsCard: {
    backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  contactIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  contactLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  contactEmail: { fontSize: 13, fontWeight: '700', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  legalCard: {
    backgroundColor: Colors.surface, borderRadius: 16, marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  legalItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 15,
  },
  legalText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  legalDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },

  bottomCard: {
    backgroundColor: Colors.primaryLight, borderRadius: 20,
    padding: 20, alignItems: 'center', marginBottom: 20,
  },
  bottomTitle: { fontSize: 16, fontWeight: '800', color: Colors.primaryDark, marginBottom: 4, textAlign: 'center' },
  bottomSub: { fontSize: 13, color: Colors.primary, marginBottom: 16, textAlign: 'center' },
  bottomBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  bottomBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  version: { textAlign: 'center', fontSize: 12, color: Colors.textMuted, marginTop: 8 },
});

