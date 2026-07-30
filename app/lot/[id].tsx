import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Platform, Linking, Modal, Pressable, Image, FlatList, Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Calendar, ChevronRight, Flag, MapPin, MessageCircle, MessageSquare,
  Package, Pencil, Phone, ShoppingCart, Trash2, User,
} from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { PRODUCT_EMOJIS, PRODUCT_LABELS } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import CachedImage from '@/components/CachedImage';
import { useRewards } from '@/hooks/RewardsContext';
import { useBoost } from '@/hooks/BoostContext';
import ReportSheet from '@/components/ReportSheet';
import { Zap } from 'lucide-react-native';

const CARTON_SIZE = 50;

const PRODUCT_COLORS: Record<string, string> = {
  poulet: '#F3E6D5', poussin: '#F8EDDD', oeuf: '#EEF2E6', aliment: '#E9EFE3',
};

type LucideIcon = typeof User;

export default function LotDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getAllUsers } = useAuthContext();
  const { annonces, deleteAnnonce } = useAnnonces();
  const [photoIdx, setPhotoIdx] = useState(0);
  const [sellerPhoto, setSellerPhoto] = useState<string | undefined>();
  const [showContact, setShowContact] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const insets = useSafeAreaInsets();
  const { completeQuest, ready: rewardsReady } = useRewards();
  const { boostedAnnonceIds } = useBoost();

  const lot = annonces.find((l) => l.id === Number(id));
  const isOwner = user && lot ? lot.eleveurId === user.id || lot.eleveur === `${user.prenom} ${user.nom}` : false;

  useEffect(() => { if (rewardsReady) completeQuest('consulte_annonce'); }, [rewardsReady]);

  useEffect(() => {
    if (!lot?.eleveurId) return;
    getAllUsers().then((users) => {
      const seller = users.find((u) => u.id === lot.eleveurId);
      if (seller?.photo) setSellerPhoto(seller.photo);
    });
  }, [lot?.eleveurId]);

  const isCarton = lot?.unite === 'carton';
  const isBoosted = lot ? boostedAnnonceIds.has(lot.id) : false;

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
  const PHOTO_W = Dimensions.get('window').width;
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
    if (!lot.eleveurId) return;
    setShowContact(false);
    router.push({ pathname: '/chat/[id]', params: { id: lot.eleveurId } });
  };

  return (
    <View style={styles.container}>
      {/* Bouton retour flottant */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/marches')}
        hitSlop={10}
      >
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>

      <ScrollView>
        {/* Galerie photos */}
        {hasPhotos ? (
          <View style={styles.gallery}>
            <FlatList
              data={lot.photos!}
              keyExtractor={(_, i) => String(i)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={PHOTO_W}
              onMomentumScrollEnd={(e) =>
                setPhotoIdx(Math.round(e.nativeEvent.contentOffset.x / PHOTO_W))
              }
              renderItem={({ item: uri }) => (
                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={() => setShowViewer(true)}
                  style={{ width: PHOTO_W }}
                >
                  <CachedImage
                    uri={uri}
                    style={[styles.mainPhoto, { width: PHOTO_W }]}
                    containerStyle={[styles.mainPhotoContainer, { width: PHOTO_W }]}
                    fallback={<Text style={{ fontSize: 60 }}>{PRODUCT_EMOJIS[lot.produit]}</Text>}
                    skeletonColor="#1a1a1a"
                  />
                </TouchableOpacity>
              )}
            />
            {lot.photos!.length > 1 && (
              <View style={styles.photoDots}>
                {lot.photos!.map((_, i) => (
                  <View key={i} style={[styles.photoDot, i === photoIdx && styles.photoDotActive]} />
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
            <InfoRow Icon={MapPin} label="Région" value={lot.commune ? `${lot.commune}, ${lot.region}` : lot.region} />
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

          {/* Profil vendeur */}
          {!isOwner && lot.eleveurId && (
            <TouchableOpacity
              style={styles.sellerCard}
              onPress={() => router.push({ pathname: '/vendeur/[id]', params: { id: lot.eleveurId! } })}
              activeOpacity={0.85}
            >
              {sellerPhoto ? (
                <Image source={{ uri: sellerPhoto }} style={styles.sellerAvatarImg} />
              ) : (
                <View style={styles.sellerAvatar}>
                  <Text style={styles.sellerAvatarText}>
                    {lot.eleveur.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerLabel}>Vendeur</Text>
                <Text style={styles.sellerName}>{lot.eleveur}</Text>
                <Text style={styles.sellerSub}>Voir toutes ses annonces →</Text>
              </View>
              <ChevronRight size={20} color={Colors.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
          )}

          {/* Signalement (exigence App Store 1.2 sur le contenu utilisateur) */}
          {!isOwner && (
            <TouchableOpacity
              style={styles.reportBtn}
              onPress={() => {
                if (!user) { router.push('/(auth)/login'); return; }
                setShowReport(true);
              }}
              activeOpacity={0.7}
            >
              <Flag size={14} color={Colors.textMuted} strokeWidth={1.8} />
              <Text style={styles.reportBtnText}>Signaler cette annonce</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { paddingBottom: 16 + insets.bottom }]}>
        {isOwner ? (
          <>
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Trash2 size={16} color={Colors.error} strokeWidth={1.8} />
              <Text style={styles.deleteBtnText}>Retirer</Text>
            </TouchableOpacity>
            {!isBoosted ? (
              <TouchableOpacity
                style={styles.boostBtn}
                onPress={() => router.push({ pathname: '/boost/[id]', params: { id: lot.id } })}
              >
                <Zap size={16} color={Colors.gold} strokeWidth={1.8} />
                <Text style={styles.boostBtnText}>Booster</Text>
              </TouchableOpacity>
            ) : null}
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

      {/* Visualiseur photo plein écran */}
      <Modal
        visible={showViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowViewer(false)}
        statusBarTranslucent
      >
        <View style={styles.viewerBackdrop}>
          {/* Miniatures en haut si plusieurs photos */}
          {lot.photos!.length > 1 && (
            <View style={styles.viewerThumbs}>
              {lot.photos!.map((uri, i) => (
                <TouchableOpacity key={i} onPress={() => setPhotoIdx(i)}>
                  <CachedImage
                    uri={uri}
                    style={[styles.viewerThumb, i === photoIdx && styles.viewerThumbActive]}
                    containerStyle={[styles.viewerThumb, i === photoIdx && styles.viewerThumbActive]}
                    skeletonColor="#333"
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Photo principale */}
          <CachedImage
            uri={lot.photos![photoIdx]}
            style={styles.viewerPhoto}
            containerStyle={styles.viewerPhotoContainer}
            fallback={<Text style={{ fontSize: 80 }}>{PRODUCT_EMOJIS[lot.produit]}</Text>}
            skeletonColor="#1a1a1a"
          />

          {/* Bouton fermer */}
          <TouchableOpacity style={styles.viewerClose} onPress={() => setShowViewer(false)} hitSlop={12}>
            <Text style={styles.viewerCloseText}>✕</Text>
          </TouchableOpacity>

          {/* Flèches gauche/droite si plusieurs photos */}
          {lot.photos!.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.viewerArrow, styles.viewerArrowLeft]}
                onPress={() => setPhotoIdx((i) => (i - 1 + lot.photos!.length) % lot.photos!.length)}
                hitSlop={16}
              >
                <Text style={styles.viewerArrowText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewerArrow, styles.viewerArrowRight]}
                onPress={() => setPhotoIdx((i) => (i + 1) % lot.photos!.length)}
                hitSlop={16}
              >
                <Text style={styles.viewerArrowText}>›</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Compteur */}
          {lot.photos!.length > 1 && (
            <View style={styles.viewerCounter}>
              <Text style={styles.viewerCounterText}>{photoIdx + 1} / {lot.photos!.length}</Text>
            </View>
          )}
        </View>
      </Modal>

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

      {/* Feuille de signalement / blocage */}
      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        targetType="annonce"
        targetId={lot.id}
        targetLabel={lot.titre}
        reportedUserId={lot.eleveurId}
        reportedUserName={lot.eleveur}
      />
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
  backBtn: {
    position: 'absolute', left: 14, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 22,
    width: 38, height: 38, justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { color: '#fff', fontSize: 20, lineHeight: 22 },
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
  photoDots: {
    position: 'absolute', bottom: 10, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'center', gap: 5,
  },
  photoDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  photoDotActive: { backgroundColor: '#fff', width: 18, borderRadius: 3 },
  body: { padding: 22 },
  titre: { fontSize: 23, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6, letterSpacing: -0.2, lineHeight: 29 },
  detail: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.textSecondary, marginBottom: 18, lineHeight: 22 },
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
  infoLabel: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textTertiary, flex: 1 },
  infoValue: { fontSize: 14.5, fontFamily: Fonts.bodySemiBold, color: Colors.text },
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
  boostBtn: {
    flex: 1, flexDirection: 'row', gap: 6, borderWidth: 1.5, borderColor: Colors.gold, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(201,154,70,0.08)',
  },
  boostBtnText: { color: Colors.gold, fontSize: 14, fontFamily: Fonts.bodyBold },
  sellerCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    padding: 14, marginTop: 14,
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  reportBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    marginTop: 18, paddingVertical: 10,
  },
  reportBtnText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  sellerAvatarImg: { width: 48, height: 48, borderRadius: 24 },
  sellerAvatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  sellerAvatarText: { fontSize: 17, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },
  sellerLabel: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  sellerName: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  sellerSub: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.primary, marginTop: 2 },
  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: Colors.background },
  notFoundEmoji: { fontSize: 56 },
  notFoundText: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, marginTop: 14 },
  backLink: { color: Colors.primary, fontSize: 15, marginTop: 16, fontFamily: Fonts.bodyBold },

  // ── Visualiseur photo ─────────────────────────────────────────────────
  zoomHint: {
    position: 'absolute', bottom: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 16,
    width: 32, height: 32, justifyContent: 'center', alignItems: 'center',
  },
  zoomHintText: { fontSize: 15 },
  viewerBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center', alignItems: 'center',
  },
  viewerPhotoContainer: { width: '100%', aspectRatio: 1, maxHeight: '75%' },
  viewerPhoto: { width: '100%', height: '100%', resizeMode: 'contain' },
  viewerClose: {
    position: 'absolute', top: 52, right: 18,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
  },
  viewerCloseText: { color: '#fff', fontSize: 18, fontWeight: '300' },
  viewerThumbs: {
    position: 'absolute', top: 52, left: 0, right: 70,
    flexDirection: 'row', paddingHorizontal: 18, gap: 8,
  },
  viewerThumb: { width: 48, height: 48, borderRadius: 8, opacity: 0.5 },
  viewerThumbActive: { opacity: 1, borderWidth: 2, borderColor: Colors.gold },
  viewerArrow: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 24,
    width: 48, height: 48, justifyContent: 'center', alignItems: 'center',
  },
  viewerArrowLeft: { left: 16 },
  viewerArrowRight: { right: 16 },
  viewerArrowText: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  viewerCounter: {
    position: 'absolute', bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 5,
  },
  viewerCounterText: { color: '#fff', fontSize: 13, fontFamily: Fonts.bodySemiBold },

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
