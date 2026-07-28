import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, ActivityIndicator, Modal,
  TextInput, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Flag, MapPin, Phone, Package, ShieldOff, Star, UserCheck, UserPlus } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { supabase } from '@/lib/supabase';
import LotGrid from '@/components/LotGrid';
import { useBoost } from '@/hooks/BoostContext';
import { useModeration } from '@/hooks/ModerationContext';
import ReportSheet from '@/components/ReportSheet';

type SellerProfile = {
  id: string;
  prenom: string;
  nom: string;
  region?: string;
  phone?: string;
  role: string;
  ferme?: string;
  couvoir_status?: string;
  vet_status?: string;
  created_at: string;
};

type Review = {
  id: number;
  reviewer_id: string;
  reviewer_nom: string;
  rating: number;
  comment: string;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur', couvoir: 'Couvoir', veterinaire: 'Vétérinaire', acheteur: 'Acheteur',
};
const ROLE_EMOJIS: Record<string, string> = {
  eleveur: '🐔', couvoir: '🏭', veterinaire: '💉', acheteur: '🛒',
};
const MONTHS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];

function StarRow({ rating, size = 16, onPress }: { rating: number; size?: number; onPress?: (r: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1,2,3,4,5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onPress?.(n)} disabled={!onPress} hitSlop={6}>
          <Star
            size={size}
            color={n <= rating ? '#F59E0B' : Colors.border}
            fill={n <= rating ? '#F59E0B' : 'transparent'}
            strokeWidth={1.6}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function VendeurScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { annonces } = useAnnonces();
  const { boostedAnnonceIds } = useBoost();
  const { user } = useAuthContext();

  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);

  // Modal avis
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  // Modération : signalement et blocage de ce vendeur
  const { isBlocked, blockUser, unblockUser } = useModeration();
  const [showReport, setShowReport] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;

    const [{ data: profileData }, { data: followData }, { data: reviewData }] = await Promise.all([
      supabase.from('profiles').select('id, prenom, nom, region, phone, role, ferme, couvoir_status, vet_status, created_at').eq('id', id).single(),
      supabase.from('follows').select('follower_id', { count: 'exact' }).eq('followed_id', id),
      supabase.from('reviews').select('id, reviewer_id, rating, comment, created_at, profiles:reviewer_id(prenom, nom)').eq('seller_id', id).order('created_at', { ascending: false }),
    ]);

    if (profileData) setProfile(profileData);

    setFollowerCount(followData?.length ?? 0);

    if (reviewData) {
      const mapped: Review[] = reviewData.map((r: any) => ({
        id: r.id,
        reviewer_id: r.reviewer_id,
        reviewer_nom: r.profiles ? `${r.profiles.prenom} ${r.profiles.nom}` : 'Anonyme',
        rating: r.rating,
        comment: r.comment ?? '',
        created_at: r.created_at,
      }));
      setReviews(mapped);
      if (mapped.length > 0) {
        setAvgRating(Math.round((mapped.reduce((s, r) => s + r.rating, 0) / mapped.length) * 10) / 10);
      }
      if (user?.id) {
        setAlreadyReviewed(mapped.some((r) => r.reviewer_id === user.id));
      }
    }

    if (user?.id) {
      const { data: myFollow } = await supabase
        .from('follows').select('id').eq('follower_id', user.id).eq('followed_id', id).maybeSingle();
      setIsFollowing(!!myFollow);
    }

    setLoading(false);
  }, [id, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const toggleFollow = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('followed_id', id);
      setIsFollowing(false);
      setFollowerCount((c) => Math.max(0, c - 1));
    } else {
      await supabase.from('follows').insert({ follower_id: user.id, followed_id: id });
      setIsFollowing(true);
      setFollowerCount((c) => c + 1);
    }
    setFollowLoading(false);
  };

  const submitReview = async () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (reviewRating === 0) {
      const msg = 'Sélectionne une note de 1 à 5 étoiles';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Note requise', msg);
      return;
    }
    setReviewLoading(true);
    const { error } = await supabase.from('reviews').insert({
      reviewer_id: user.id,
      seller_id: id,
      rating: reviewRating,
      comment: reviewComment.trim() || null,
    });
    setReviewLoading(false);
    if (error) {
      const msg = 'Erreur lors de l\'envoi. Réessayez.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Erreur', msg);
      return;
    }
    setShowReviewModal(false);
    setReviewRating(0);
    setReviewComment('');
    setAlreadyReviewed(true);
    await loadData();
  };

  const sellerLots = annonces.filter((l) => l.eleveurId === id && l.qte > 0);

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.notFoundEmoji}>😕</Text>
        <Text style={styles.notFoundText}>Profil introuvable</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Text style={styles.backLink}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = `${profile.prenom.charAt(0)}${profile.nom ? profile.nom.charAt(0) : ''}`.toUpperCase();
  const isCertified = profile.couvoir_status === 'certified' || profile.vet_status === 'certified';
  const memberDate = new Date(profile.created_at);
  const memberSince = `${MONTHS_FR[memberDate.getMonth()]} ${memberDate.getFullYear()}`;
  const isOwnProfile = user?.id === id;
  const blocked = isBlocked(id);
  const sellerName = `${profile.prenom} ${profile.nom}`.trim();

  const toggleBlock = () => {
    if (!user) { router.push('/(auth)/login'); return; }
    if (blocked) { unblockUser(id!); return; }
    const message = `Vous ne verrez plus les annonces ni les messages de ${sellerName}.`;
    const doBlock = () => { blockUser(id!); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Bloquer ${sellerName} ?\n\n${message}`)) doBlock();
    } else {
      Alert.alert(`Bloquer ${sellerName} ?`, message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Bloquer', style: 'destructive', onPress: doBlock },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={12}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil vendeur</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Carte profil */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>

          <Text style={styles.name}>{profile.prenom} {profile.nom}</Text>

          <View style={styles.rolePill}>
            <Text style={styles.rolePillText}>{ROLE_EMOJIS[profile.role] ?? '👤'} {ROLE_LABELS[profile.role] ?? profile.role}</Text>
          </View>

          {isCertified && (
            <View style={styles.certifiedBadge}>
              <Text style={styles.certifiedText}>
                ✅ {ROLE_LABELS[profile.role] ?? 'Partenaire'} certifié AviConnect
              </Text>
            </View>
          )}

          {/* Stats : abonnés + note */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{followerCount}</Text>
              <Text style={styles.statLbl}>Abonné{followerCount > 1 ? 's' : ''}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>{reviews.length}</Text>
              <Text style={styles.statLbl}>Avis</Text>
            </View>
            {reviews.length > 0 && (
              <>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statVal}>⭐ {avgRating}</Text>
                  <Text style={styles.statLbl}>Note moyenne</Text>
                </View>
              </>
            )}
          </View>

          {/* Infos */}
          <View style={styles.infoRows}>
            {profile.ferme ? (
              <View style={styles.infoRow}>
                <Package size={14} color={Colors.textMuted} strokeWidth={1.7} />
                <Text style={styles.infoText}>{profile.ferme}</Text>
              </View>
            ) : null}
            {profile.region ? (
              <View style={styles.infoRow}>
                <MapPin size={14} color={Colors.textMuted} strokeWidth={1.7} />
                <Text style={styles.infoText}>{profile.region}</Text>
              </View>
            ) : null}
            {profile.phone ? (
              <View style={styles.infoRow}>
                <Phone size={14} color={Colors.textMuted} strokeWidth={1.7} />
                <Text style={styles.infoText}>+221 {profile.phone}</Text>
              </View>
            ) : null}
            <View style={styles.infoRow}>
              <Text style={styles.memberSince}>📅 Membre depuis {memberSince}</Text>
            </View>
          </View>

          {/* Bouton suivre */}
          {!isOwnProfile && (
            <TouchableOpacity
              style={[styles.followBtn, isFollowing && styles.followBtnActive]}
              onPress={toggleFollow}
              disabled={followLoading}
              activeOpacity={0.85}
            >
              {isFollowing
                ? <UserCheck size={16} color={Colors.primary} strokeWidth={1.8} />
                : <UserPlus size={16} color="#fff" strokeWidth={1.8} />
              }
              <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                {isFollowing ? 'Abonné' : 'Suivre'}
              </Text>
            </TouchableOpacity>
          )}

          {/* Modération : signaler ou bloquer (exigence App Store 1.2) */}
          {!isOwnProfile && (
            <View style={styles.modRow}>
              <TouchableOpacity
                style={styles.modBtn}
                onPress={() => {
                  if (!user) { router.push('/(auth)/login'); return; }
                  setShowReport(true);
                }}
                activeOpacity={0.7}
              >
                <Flag size={13} color={Colors.textMuted} strokeWidth={1.8} />
                <Text style={styles.modBtnText}>Signaler</Text>
              </TouchableOpacity>
              <View style={styles.modDivider} />
              <TouchableOpacity style={styles.modBtn} onPress={toggleBlock} activeOpacity={0.7}>
                <ShieldOff size={13} color={blocked ? Colors.primary : Colors.textMuted} strokeWidth={1.8} />
                <Text style={[styles.modBtnText, blocked && styles.modBtnTextActive]}>
                  {blocked ? 'Débloquer' : 'Bloquer'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Annonces actives */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annonces actives</Text>
          <Text style={styles.sectionCount}>{sellerLots.length}</Text>
        </View>

        {sellerLots.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>Aucune annonce active pour le moment</Text>
          </View>
        ) : (
          <LotGrid lots={sellerLots} boostedIds={boostedAnnonceIds} />
        )}

        {/* Avis */}
        <View style={[styles.sectionHeader, { marginTop: 8 }]}>
          <Text style={styles.sectionTitle}>Avis clients</Text>
          {!isOwnProfile && !alreadyReviewed && (
            <TouchableOpacity style={styles.addReviewBtn} onPress={() => setShowReviewModal(true)}>
              <Star size={13} color={Colors.primary} strokeWidth={1.8} />
              <Text style={styles.addReviewBtnText}>Laisser un avis</Text>
            </TouchableOpacity>
          )}
        </View>

        {reviews.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>⭐</Text>
            <Text style={styles.emptyText}>Aucun avis pour l'instant</Text>
          </View>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewAvatar}>
                  <Text style={styles.reviewAvatarText}>{r.reviewer_nom.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewName}>{r.reviewer_nom}</Text>
                  <StarRow rating={r.rating} size={13} />
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(r.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
              </View>
              {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Modal laisser un avis */}
      <Modal visible={showReviewModal} transparent animationType="slide" onRequestClose={() => setShowReviewModal(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setShowReviewModal(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Laisser un avis</Text>
            <Text style={styles.sheetSub}>Votre expérience avec {profile.prenom}</Text>

            <View style={styles.starsRow}>
              <StarRow rating={reviewRating} size={36} onPress={setReviewRating} />
            </View>
            <Text style={styles.ratingLabel}>
              {reviewRating === 0 ? 'Touchez une étoile' : ['','Mauvais','Passable','Bien','Très bien','Excellent'][reviewRating]}
            </Text>

            <TextInput
              style={styles.commentInput}
              placeholder="Partagez votre expérience (facultatif)..."
              placeholderTextColor={Colors.textMuted}
              value={reviewComment}
              onChangeText={setReviewComment}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity
              style={[styles.submitBtn, (reviewLoading || reviewRating === 0) && { opacity: 0.5 }]}
              onPress={submitReview}
              disabled={reviewLoading || reviewRating === 0}
            >
              <Text style={styles.submitBtnText}>{reviewLoading ? 'Envoi...' : 'Publier l\'avis'}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Feuille de signalement / blocage */}
      <ReportSheet
        visible={showReport}
        onClose={() => setShowReport(false)}
        targetType="profil"
        targetId={id!}
        targetLabel={sellerName}
        reportedUserId={id}
        reportedUserName={sellerName}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontFamily: Fonts.bodyBold, color: '#fff' },
  scroll: { padding: 18 },

  profileCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 24, alignItems: 'center', marginBottom: 22,
    ...(Shadows.card as object),
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },
  name: { fontSize: 20, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 8 },
  rolePill: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 6, marginBottom: 8,
  },
  rolePillText: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },
  certifiedBadge: {
    backgroundColor: '#dcfce7', borderRadius: Radius.pill,
    paddingHorizontal: 14, paddingVertical: 5, marginBottom: 14,
  },
  certifiedText: { fontSize: 12, fontFamily: Fonts.bodyBold, color: '#166534' },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: 8, marginBottom: 16, width: '100%',
  },
  statBox: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontFamily: Fonts.bodyBold, color: Colors.text },
  statLbl: { fontSize: 10.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.border },

  infoRows: { width: '100%', gap: 8, marginBottom: 16 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  memberSince: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },

  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 11, paddingHorizontal: 28,
    ...(Shadows.button as object),
  },
  followBtnActive: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.primary,
  },
  followBtnText: { fontSize: 14, fontFamily: Fonts.bodyBold, color: '#fff' },
  followBtnTextActive: { color: Colors.primary },

  modRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 14, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: Colors.borderSoft, alignSelf: 'stretch',
  },
  modBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 6 },
  modBtnText: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  modBtnTextActive: { color: Colors.primary, fontFamily: Fonts.bodySemiBold },
  modDivider: { width: 1, height: 16, backgroundColor: Colors.borderSoft },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 14, marginTop: 4,
  },
  sectionTitle: { fontSize: 16, fontFamily: Fonts.bodyBold, color: Colors.text },
  sectionCount: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },

  addReviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.primaryLight, borderRadius: Radius.pill,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  addReviewBtnText: { fontSize: 12.5, fontFamily: Fonts.bodyBold, color: Colors.primary },

  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, textAlign: 'center' },

  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.md, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  reviewAvatarText: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },
  reviewName: { fontSize: 13.5, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 3 },
  reviewDate: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  reviewComment: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textSecondary, lineHeight: 20 },

  // Modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 28,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontFamily: Fonts.display, color: Colors.text, marginBottom: 4 },
  sheetSub: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 22 },
  starsRow: { alignItems: 'center', marginBottom: 8 },
  ratingLabel: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary, textAlign: 'center', marginBottom: 18, height: 20 },
  commentInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    padding: 14, fontSize: 14, fontFamily: Fonts.body,
    color: Colors.text, minHeight: 90, textAlignVertical: 'top', marginBottom: 18,
  },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center',
    ...(Shadows.button as object),
  },
  submitBtnText: { fontSize: 15, fontFamily: Fonts.bodyBold, color: '#fff' },

  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  notFoundEmoji: { fontSize: 48 },
  notFoundText: { fontSize: 16, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  backLink: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.primary, marginTop: 8 },
});
