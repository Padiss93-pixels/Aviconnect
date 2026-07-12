import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Platform, Linking, Modal, Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {
  Calendar, ChevronRight, MapPin, MessageCircle, MessageSquare,
  Package, Pencil, Phone, ShoppingCart, Trash2, User,
} from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { PRODUCT_EMOJIS, PRODUCT_LABELS } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import CachedImage from '@/components/CachedImage';

const CARTON_SIZE = 50;

const PRODUCT_COLORS: Record<string, string> = {
  poulet: '#F3E6D5', poussin: '#F8EDDD', oeuf: '#EEF2E6', aliment: '#E9EFE3',
};

type LucideIcon = typeof User;

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const { annonces, deleteAnnonce } = useAnnonces();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [showContact, setShowContact] = useState(false);

  const lot = annonces.find((l) => l.id === Number(id));
  const isOwner = user && lot ? lot.eleveurId === user.id || lot.eleveur === `${user.prenom} ${user.nom}` : false;
  const isCarton = lot?.unite === 'carton';

  if (!lot) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundEmoji}>😕</Text>
        <Text style={styles.notFoundText}>Cette annonce n'existe plus</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Text style={styles.backLink}>← Retour au marché</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasPhotos = lot.photos && lot.photos.length > 0;
  const phone = lot.eleveurPhone?.replace(/\D/g, '');
  const hasPhone = !!phone;

  const handleDelete = () => {
    const doDelete = () => { deleteAnnonce(lot.id); router.canGoBack() ? router.back() : router.replace('/(tabs)'); };
    if (Platform.OS === 'web') {
      if (window.confirm('Retirer cette annonce du marché ?')) doDelete();
    } else {
      Alert.alert('On la retire ?', 'Ton annonce ne sera plus visible sur le marché.', [
        { text: 'Garder', style: 'cancel' },
        { text: 'Retirer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const openContact = () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (!hasPhone) {
      if (Platform.OS === 'web') window.alert('Cet éleveur n\'a pas encore renseigné de numéro de téléphone.');
      else Alert.alert('Pas de numéro', 'Cet éleveur n\'a pas encore renseigné son numéro.');
      return;
    }
    setShowContact(true);
  };

  const callPhone = () => {
    setShowContact(false);
    Linking.openURL(`tel:+221${phone}`);
  };

  const openWhatsApp = () => {
    setShowContact(false);
    const waUrl = `https://wa.me/221${phone}?text=${encodeURIComponent(`Bonjour, je suis intéressé par votre annonce "${lot.titre}" sur AviConnect.`)}`;
    if (Platform.OS === 'web') {
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(waUrl).catch(() => {
        Alert.alert(
          'WhatsApp indisponible',
          'WhatsApp ne semble pas installé sur cet appareil. On appelle plutôt ?',
          [
            { text: 'Appeler', onPress: callPhone },
            { text: 'Annuler', style: 'cancel' },
          ]
        );
      });
    }
  };

  const openInAppChat = () => {
    setShowContact(false);
    router.push({ pathname: '/chat/[id]', params: { id: lot.id } });
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Galerie photos */}
        {hasPhotos ? (
          <View style={styles.gallery}>
            <CachedImage
              uri={lot.photos![photoIdx]}
              style={styles.mainPhoto}
              containerStyle={styles.mainPhotoContainer}
              fallback={<Text style={{ fontSize: 60 }}>{PRODUCT_EMOJIS[lot.produit]}</Text>}
              skeletonColor="#1a1a1a"
            />
            {lot.photos!.length > 1 && (
              <View style={styles.thumbsRow}>
                {lot.photos!.map((uri, i) => (
                  <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                    <CachedImage
                      uri={uri}
                      style={[styles.thumb, i === photoIdx && styles.thumbActive]}
                      containerStyle={[styles.thumb, i === photoIdx && styles.thumbActive]}
                      skeletonColor="#333"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.banner, { backgroundColor: PRODUCT_COLORS[lot.produit] }]}>
            <Text style={styles.bannerEmoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{PRODUCT_LABELS[lot.produit]}</Text>
            </View>
            {isOwner && (
              <View style={styles.ownerBadge}>
                <Text style={styles.ownerBadgeText}>Mon annonce</Text>
              </View>
            )}
          </View>
        )}

        <View style={styles.body}>
          {hasPhotos && isOwner && (
            <View style={styles.ownerBadgeInline}>
              <Text style={styles.ownerBadgeText}>Mon annonce</Text>
            </View>
          )}

          <Text style={styles.titre}>{lot.titre}</Text>
          {lot.detail ? <Text style={styles.detail}>{lot.detail}</Text> : null}

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{lot.prix.toLocaleString()}</Text>
              <Text style={styles.statLbl}>{isCarton ? 'F CFA / carton' : 'F CFA / unité'}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{lot.qte.toLocaleString()}</Text>
              <Text style={styles.statLbl}>{isCarton ? `cartons (${(lot.qte * CARTON_SIZE).toLocaleString()} poussins)` : 'unités disponibles'}</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <InfoRow Icon={User} label="Éleveur / Couvoir" value={lot.eleveur} />
            <InfoRow Icon={MapPin} label="Région" value={lot.region} />
            <InfoRow Icon={Calendar} label="Disponibilité" value={lot.dispo} />
            {lot.eleveurPhone ? (
              <InfoRow Icon={Phone} label="Téléphone" value={`+221 ${lot.eleveurPhone}`} last />
            ) : (
              <InfoRow Icon={Package} label="Produit" value={PRODUCT_LABELS[lot.produit]} last />
            )}
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>
              {isCarton
                ? `Le lot complet (${lot.qte} carton${lot.qte > 1 ? 's' : ''})`
                : `Le lot complet (${lot.qte.toLocaleString()} unités)`}
            </Text>
            <Text style={styles.totalVal}>{(lot.prix * lot.qte).toLocaleString()} F CFA</Text>
          </View>
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        {isOwner ? (
          <>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 size={16} color={Colors.error} strokeWidth={1.8} />
              <Text style={styles.deleteBtnText}>Retirer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => router.push({ pathname: '/modifier-annonce/[id]', params: { id: lot.id } })}
            >
              <Pencil size={16} color="#fff" strokeWidth={1.8} />
              <Text style={styles.primaryBtnText}>Modifier</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.secondaryBtn} onPress={openContact}>
              <MessageCircle size={16} color={Colors.primary} strokeWidth={1.8} />
              <Text style={styles.secondaryBtnText}>Contacter</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => {
              if (!user) { router.push('/(auth)/login'); return; }
              router.push({ pathname: '/commander/[id]', params: { id: lot.id } });
            }}>
              <ShoppingCart size={16} color="#fff" strokeWidth={1.8} />
              <Text style={styles.primaryBtnText}>Commander</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Feuille de contact */}
      <Modal
        visible={showContact}
        transparent
        animationType="slide"
        onRequestClose={() => setShowContact(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setShowContact(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            {/* Poignée */}
            <View style={styles.sheetHandle} />

            {/* Infos vendeur */}
            <View style={styles.sheetHeader}>
              <View style={styles.sheetAvatar}>
                <Text style={styles.sheetAvatarText}>
                  {lot.eleveur.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetName}>{lot.eleveur}</Text>
                <Text style={styles.sheetPhone}>
                  {hasPhone ? `+221 ${lot.eleveurPhone}` : 'Numéro non renseigné'}
                </Text>
              </View>
            </View>

            <Text style={styles.sheetTitle}>On le joint comment ?</Text>

            {/* WhatsApp */}
            <TouchableOpacity
              style={[styles.contactOption, !hasPhone && styles.contactOptionDisabled]}
              onPress={hasPhone ? openWhatsApp : undefined}
              activeOpacity={hasPhone ? 0.75 : 1}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#25D366' }]}>
                <MessageCircle size={22} color="#fff" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>WhatsApp</Text>
                <Text style={styles.contactSub}>
                  {hasPhone ? 'Le canal préféré des éleveurs' : 'Numéro non disponible'}
                </Text>
              </View>
              {hasPhone && <ChevronRight size={18} color={Colors.textMuted} strokeWidth={1.6} />}
            </TouchableOpacity>

            {/* Appel téléphonique */}
            <TouchableOpacity
              style={[styles.contactOption, !hasPhone && styles.contactOptionDisabled]}
              onPress={hasPhone ? callPhone : undefined}
              activeOpacity={hasPhone ? 0.75 : 1}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.primary }]}>
                <Phone size={21} color="#fff" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Appel direct</Text>
                <Text style={styles.contactSub}>
                  {hasPhone ? `Appeler le +221 ${lot.eleveurPhone}` : 'Numéro non disponible'}
                </Text>
              </View>
              {hasPhone && <ChevronRight size={18} color={Colors.textMuted} strokeWidth={1.6} />}
            </TouchableOpacity>

            {/* Message in-app */}
            <TouchableOpacity
              style={styles.contactOption}
              onPress={openInAppChat}
              activeOpacity={0.75}
            >
              <View style={[styles.contactIcon, { backgroundColor: Colors.accent }]}>
                <MessageSquare size={21} color="#fff" strokeWidth={1.8} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactLabel}>Message AviConnect</Text>
                <Text style={styles.contactSub}>Discuter directement dans l'app</Text>
              </View>
              <ChevronRight size={18} color={Colors.textMuted} strokeWidth={1.6} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowContact(false)}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

function InfoRow({ Icon, label, value, last }: { Icon: LucideIcon; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.infoRow, last && styles.infoRowLast]}>
      <View style={styles.infoIconBox}>
        <Icon size={15} color={Colors.textTertiary} strokeWidth={1.7} />
      </View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  banner: { height: 210, justifyContent: 'center', alignItems: 'center' },
  bannerEmoji: { fontSize: 80 },
  badge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: Radius.pill, paddingHorizontal: 12, paddingVertical: 5,
  },
  badgeText: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.text, textTransform: 'uppercase', letterSpacing: 0.5 },
  ownerBadge: {
    position: 'absolute', top: 16, left: 16,
    backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 5,
  },
  ownerBadgeInline: {
    alignSelf: 'flex-start', backgroundColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 5, marginBottom: 12,
  },
  ownerBadgeText: { fontSize: 11.5, fontFamily: Fonts.bodyBold, color: '#fff' },
  gallery: { backgroundColor: Colors.ink },
  mainPhotoContainer: { width: '100%', height: 270, backgroundColor: '#1a1a1a' },
  mainPhoto: { width: '100%', height: 270 },
  thumbsRow: { flexDirection: 'row', padding: 8, gap: 6, backgroundColor: Colors.ink },
  thumb: { width: 56, height: 56, borderRadius: Radius.sm, opacity: 0.55 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: Colors.gold },
  body: { padding: 22 },
  titre: { fontSize: 23, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6, letterSpacing: -0.2, lineHeight: 29 },
  detail: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textSecondary, marginBottom: 18, lineHeight: 21 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statBox: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 17, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  statVal: { fontSize: 22, fontFamily: Fonts.display, color: Colors.primary, letterSpacing: -0.3 },
  statLbl: { fontSize: 11, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 4, textAlign: 'center' },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
    marginBottom: 18,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoIconBox: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center', marginRight: 11,
  },
  infoLabel: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, flex: 1 },
  infoValue: { fontSize: 13.5, fontFamily: Fonts.bodySemiBold, color: Colors.text },
  totalCard: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.md, padding: 17,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1, borderColor: Colors.primaryTint,
  },
  totalLabel: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.primaryDark, flexShrink: 1, paddingRight: 8 },
  totalVal: { fontSize: 18, fontFamily: Fonts.bodyExtraBold, color: Colors.primary, letterSpacing: -0.2 },
  actions: {
    flexDirection: 'row', gap: 12, padding: 16,
    backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  secondaryBtn: {
    flex: 1, flexDirection: 'row', gap: 7, borderWidth: 1.5, borderColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  secondaryBtnText: { color: Colors.primary, fontSize: 14.5, fontFamily: Fonts.bodyBold },
  primaryBtn: {
    flex: 2, flexDirection: 'row', gap: 7, backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    ...(Shadows.button as object),
  },
  primaryBtnText: { color: '#fff', fontSize: 14.5, fontFamily: Fonts.bodyBold },
  deleteBtn: {
    flex: 1, flexDirection: 'row', gap: 7, borderWidth: 1.5, borderColor: Colors.error, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { color: Colors.error, fontSize: 14.5, fontFamily: Fonts.bodyBold },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: Colors.background },
  notFoundEmoji: { fontSize: 56 },
  notFoundText: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, marginTop: 14 },
  backLink: { color: Colors.primary, fontSize: 15, marginTop: 16, fontFamily: Fonts.bodyBold },

  // ── Feuille de contact ────────────────────────────────────────────────
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(23,18,12,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    ...(Shadows.floating as object),
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: Colors.separator,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md, padding: 14, marginBottom: 20,
  },
  sheetAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center',
  },
  sheetAvatarText: { fontSize: 15, fontFamily: Fonts.bodyExtraBold, color: Colors.primaryDark },
  sheetName: { fontSize: 15.5, fontFamily: Fonts.bodyBold, color: Colors.text },
  sheetPhone: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  sheetTitle: {
    fontSize: 11.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 12,
  },
  contactOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  contactOptionDisabled: { opacity: 0.4 },
  contactIcon: {
    width: 46, height: 46, borderRadius: 15,
    justifyContent: 'center', alignItems: 'center',
  },
  contactLabel: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text },
  contactSub: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  cancelBtn: {
    marginTop: 16, backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text },
});
