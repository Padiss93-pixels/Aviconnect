import { View, Text, ScrollView, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { BESOINS, PRODUCT_EMOJIS, PRODUCT_LABELS } from '@/constants/mockData';
import { useBesoins } from '@/hooks/BesoinContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';

export default function BesoinsScreen() {
  const { user } = useAuthContext();
  const { besoins: userBesoins } = useBesoins();
  const { unreadCount } = useAnnonces();

  // Merge : besoins publiés par les acheteurs en premier, puis les mock
  const mockIds = new Set(BESOINS.map((b) => b.id));
  const uniqueUser = userBesoins.filter((b) => !mockIds.has(b.id));
  const allBesoins = [...uniqueUser, ...BESOINS];

  const isAcheteur = user?.role === 'acheteur';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Demandes du marché</Text>
          <Text style={styles.headerSub}>{allBesoins.length} besoin{allBesoins.length !== 1 ? 's' : ''} publiés</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} onPress={() => router.push('/notifications' as any)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="notifications" size={24} color={Colors.primary} />
          {unreadCount > 0 && (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {allBesoins.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyTitle}>Aucun besoin publié</Text>
            <Text style={styles.emptySub}>Les acheteurs peuvent publier leurs recherches ici.</Text>
          </View>
        ) : (
          allBesoins.map((b) => {
            const nom = 'acheteurNom' in b ? b.acheteurNom : (b as any).acheteur;
            const isNew = 'acheteurId' in b;
            const phone = 'acheteurPhone' in b ? b.acheteurPhone : undefined;
            return (
              <View key={b.id} style={styles.card}>
                {/* En-tête carte */}
                <View style={styles.cardTop}>
                  <View style={styles.emojiBox}>
                    <Text style={styles.emoji}>{PRODUCT_EMOJIS[b.produit]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                      <Text style={styles.produitLabel}>{PRODUCT_LABELS[b.produit]}</Text>
                      {isNew && (
                        <View style={styles.newBadge}>
                          <Text style={styles.newBadgeText}>Nouveau</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.acheteurNom} numberOfLines={1}>{nom}</Text>
                  </View>
                  <View style={styles.prixBox}>
                    <Text style={styles.prixVal}>{b.prixMax.toLocaleString()}</Text>
                    <Text style={styles.prixLbl}>F max</Text>
                  </View>
                </View>

                {/* Détails */}
                <View style={styles.detailsRow}>
                  <View style={styles.chip}>
                    <Ionicons name="cube-outline" size={13} color={Colors.primary} />
                    <Text style={styles.chipText}>{b.qte.toLocaleString()} {PRODUCT_LABELS[b.produit]}s</Text>
                  </View>
                  <View style={styles.chip}>
                    <Ionicons name="location-outline" size={13} color={Colors.primary} />
                    <Text style={styles.chipText}>{b.region}</Text>
                  </View>
                </View>

                {/* Description si disponible */}
                {'detail' in b && b.detail ? (
                  <Text style={styles.detail} numberOfLines={2}>{b.detail}</Text>
                ) : null}

                {/* Bouton contacter si on est éleveur/couvoir et qu'il y a un téléphone */}
                {!isAcheteur && phone && (
                  <TouchableOpacity
                    style={styles.contactBtn}
                    onPress={() => {
                      const waUrl = `https://wa.me/221${phone}?text=${encodeURIComponent(`Bonjour ${nom}, j'ai vu votre besoin sur AviConnect pour ${PRODUCT_LABELS[b.produit]}.`)}`;
                      if (Platform.OS === 'web') window.open(waUrl, '_blank', 'noopener,noreferrer');
                      else {
                        const Linking = require('react-native').Linking;
                        Linking.openURL(waUrl).catch(() => Linking.openURL(`tel:+221${phone}`));
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={styles.contactBtnText}>Contacter sur WhatsApp</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  bellBtn: {
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 20,
  },
  bellBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: Colors.error, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800' },

  scroll: { flex: 1 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.07)' } as any,
    }),
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  emojiBox: {
    width: 52, height: 52, borderRadius: 16,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  emoji: { fontSize: 28 },
  produitLabel: { fontSize: 15, fontWeight: '700', color: Colors.text, letterSpacing: -0.2 },
  acheteurNom: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  prixBox: { alignItems: 'flex-end' },
  prixVal: { fontSize: 18, fontWeight: '900', color: Colors.primary, letterSpacing: -0.3 },
  prixLbl: { fontSize: 10, color: Colors.textMuted, marginTop: 1 },

  detailsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },

  detail: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: 12 },

  newBadge: { backgroundColor: Colors.primaryTint, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  newBadgeText: { fontSize: 9, fontWeight: '700', color: Colors.primaryDark, textTransform: 'uppercase', letterSpacing: 0.3 },

  contactBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 11,
    marginTop: 4,
  },
  contactBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

