import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Linking, Platform, StatusBar, Dimensions, Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Factory, MapPin, ShieldCheck, Stethoscope, Users } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { PRODUCT_EMOJIS, PRODUCT_LABELS } from '@/constants/mockData';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBesoins } from '@/hooks/BesoinContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { usePubs } from '@/hooks/PubContext';
import { useDrawer } from '@/hooks/DrawerContext';
import { useBoost } from '@/hooks/BoostContext';
import { Crown } from 'lucide-react-native';
import LotCard from '@/components/LotCard';
import LegalFooter from '@/components/LegalFooter';
import ScreenHeader from '@/components/ui/ScreenHeader';
import PlumesOrSVG from '@/components/PlumesOrSVG';

export default function HomeScreen() {
  const { user, getAllUsers } = useAuthContext();
  const { toggle: toggleDrawer } = useDrawer();
  const [partnerPhotos, setPartnerPhotos] = useState<Record<string, string>>({});
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const slideWidth = Dimensions.get('window').width - 36;
  const { annonces: lots, unreadCount } = useAnnonces();
  const { banners } = usePubs();
  const { besoins: userBesoins } = useBesoins();
  const { featuredCouvoirs, boostedAnnonceIds, refreshBoosts } = useBoost();

  useFocusEffect(useCallback(() => {
    refreshBoosts();
    getAllUsers().then((users) => {
      const map: Record<string, string> = {};
      users.forEach((u) => { if (u.photo) map[u.id] = u.photo; });
      setPartnerPhotos(map);
    });
  }, [refreshBoosts]));
  const allBesoins = userBesoins;
  const activeSlides = banners.filter((b) => b.actif);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => {
        const next = (prev + 1) % activeSlides.length;
        carouselRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScreenHeader showLogo onMenuPress={toggleDrawer} unreadCount={unreadCount} showFavorites />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Salutation */}
        <View style={styles.greeting}>
          <Text style={styles.greetingEyebrow}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.greetingTitle}>
            {user?.prenom ? `Bonjour ${user.prenom},` : 'Bonjour,'}{'\n'}le marché t'attend.
          </Text>
        </View>

        {/* Carousel bannières — swipeable */}
        {activeSlides.length > 0 && (
          <View style={styles.carouselWrap}>
            <FlatList
              ref={carouselRef}
              data={activeSlides}
              horizontal
              pagingEnabled
              snapToInterval={slideWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              getItemLayout={(_, index) => ({ length: slideWidth, offset: slideWidth * index, index })}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / slideWidth);
                setSlideIndex(newIndex);
              }}
              style={{ borderRadius: Radius.xl, overflow: 'hidden' }}
              renderItem={({ item: slide }) => {
                const hasLien = !!slide.lien;
                const accent = slide.accentColor ?? Colors.gold;
                const openSlide = () => {
                  if (!slide.lien) return;
                  if (Platform.OS === 'web') window.open(slide.lien, '_blank', 'noopener,noreferrer');
                  else Linking.openURL(slide.lien).catch(() => {});
                };
                return (
                  <TouchableOpacity
                    activeOpacity={hasLien ? 0.9 : 1}
                    onPress={hasLien ? openSlide : undefined}
                    style={[styles.slide, { width: slideWidth }]}
                  >
                    {slide.image && !slide.image.startsWith('blob:') && (
                      <Image
                        source={{ uri: slide.image }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                        onError={() => {}}
                      />
                    )}
                    {(slide.bg || !slide.image) && (
                      <LinearGradient
                        colors={slide.type === 'promo'
                          ? [slide.bg || Colors.primaryDark, (slide.bg || Colors.primaryDark) + 'CC']
                          : slide.bg
                            ? [slide.bg, slide.bg]
                            : slide.image
                              ? ['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.65)']
                              : [Colors.ink, Colors.primaryDark]}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFillObject}
                      />
                    )}
                    <View style={[styles.slideDeco1, slide.type === 'promo' && { backgroundColor: accent + '18' }]} />
                    <View style={[styles.slideDeco2, slide.type === 'promo' && { backgroundColor: accent + '22' }]} />

                    {slide.type === 'promo' ? (
                      <View style={[styles.slideInner, { flexDirection: 'row', alignItems: 'center', paddingVertical: 16 }]}>
                        <View style={{ flex: 1 }}>
                          {slide.tag && (
                            <View style={[styles.slidePill, { backgroundColor: accent + '28', borderColor: accent + '55', borderWidth: 1 }]}>
                              <Text style={[styles.slidePillText, { color: accent }]}>{slide.tag}</Text>
                            </View>
                          )}
                          <Text style={[styles.slideTitle, { fontSize: 18 }]} numberOfLines={2}>{slide.title}</Text>
                          <Text style={[styles.slideSub, { marginTop: 3 }]} numberOfLines={2}>{slide.sub}</Text>
                          {slide.price && (
                            <View style={[styles.promoPriceBadge, { borderColor: accent + '88', alignSelf: 'flex-start', marginTop: 8 }]}>
                              <Text style={[styles.promoPriceLabel, { color: accent + 'BB' }]}>{slide.priceLabel}</Text>
                              <Text style={[styles.promoPriceValue, { color: accent }]}>{slide.price}</Text>
                            </View>
                          )}
                          {hasLien && (
                            <View style={[styles.slideCta, { marginTop: 10, backgroundColor: accent }]}>
                              <Text style={[styles.slideCtaText, { color: Colors.ink }]}>Appeler</Text>
                              <View style={[styles.slideCtaArrow, { backgroundColor: 'rgba(0,0,0,0.12)' }]}>
                                <ArrowRight size={12} color={Colors.ink} strokeWidth={2} />
                              </View>
                            </View>
                          )}
                        </View>
                        {slide.id.startsWith('promo_pdo') && (
                          <View style={{ marginLeft: 8, opacity: 0.95 }}>
                            <PlumesOrSVG size={108} />
                          </View>
                        )}
                      </View>
                    ) : (
                      <View style={styles.slideInner}>
                        <View style={styles.slidePill}><Text style={styles.slidePillText}>AviConnect</Text></View>
                        <Text style={styles.slideTitle}>{slide.title}</Text>
                        <Text style={styles.slideSub}>{slide.sub}</Text>
                        {hasLien && (
                          <View style={styles.slideCta}>
                            <Text style={styles.slideCtaText}>Découvrir</Text>
                            <View style={styles.slideCtaArrow}>
                              <ArrowRight size={12} color={Colors.ink} strokeWidth={2} />
                            </View>
                          </View>
                        )}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            {activeSlides.length > 1 && (
              <View style={styles.dots}>
                {activeSlides.map((_, i) => (
                  <View key={i} style={[styles.dot, i === slideIndex && styles.dotActive]} />
                ))}
              </View>
            )}
          </View>
        )}

        {/* Couvoirs en vedette */}
        {featuredCouvoirs.length > 0 && (
          <>
            <View style={styles.sectionRow}>
              <View>
                <Text style={styles.sectionEyebrow}>Abonnés Premium ⭐</Text>
                <Text style={styles.sectionTitle}>Partenaires certifiés</Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 22, paddingRight: 10, gap: 12 }}
            >
              {featuredCouvoirs.map((c) => (
                <TouchableOpacity
                  key={c.userId}
                  style={styles.featuredCard}
                  onPress={() => router.push({ pathname: c.role === 'veterinaire' ? '/veterinaire/[id]' : '/vendeur/[id]', params: { id: c.userId } })}
                  activeOpacity={0.88}
                >
                  <View style={styles.featuredGoldRing}>
                    {partnerPhotos[c.userId] ? (
                      <Image source={{ uri: partnerPhotos[c.userId] }} style={styles.featuredAvatarImg} />
                    ) : (
                      <View style={styles.featuredAvatar}>
                        <Text style={styles.featuredAvatarText}>
                          {`${c.prenom[0]}${c.nom[0]}`.toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Crown size={13} color={Colors.gold} fill={Colors.gold} strokeWidth={1.5} style={{ marginTop: 6 }} />
                  {c.role === 'couvoir' && c.ferme ? (
                    <Text style={styles.featuredFerme} numberOfLines={2}>{c.ferme}</Text>
                  ) : (
                    <Text style={styles.featuredRole} numberOfLines={1}>
                      {c.role === 'veterinaire' ? 'Vétérinaire' : 'Couvoir'}
                    </Text>
                  )}
                  {c.region && <Text style={styles.featuredRegion} numberOfLines={1}>{c.region}</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Annonces récentes */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Fraîchement publiées</Text>
            <Text style={styles.sectionTitle}>Annonces récentes</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/(tabs)/marches' as any)} style={styles.seeAllBtn}>
            <Text style={styles.seeAll}>Voir tout</Text>
            <ArrowRight size={14} color={Colors.primary} strokeWidth={1.9} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={lots.slice(0, 6)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={{ marginRight: 14 }}>
              <LotCard lot={item} compact isBoosted={boostedAnnonceIds.has(item.id)} />
            </View>
          )}
          contentContainerStyle={{ paddingLeft: 22, paddingRight: 10 }}
          scrollEventThrottle={16}
          removeClippedSubviews
        />

        {/* Demandes du marché */}
        <View style={[styles.sectionRow, { marginTop: 14 }]}>
          <View>
            <Text style={styles.sectionEyebrow}>Des acheteurs cherchent</Text>
            <Text style={styles.sectionTitle}>Demandes du marché</Text>
          </View>
        </View>
        <View style={styles.besoinsWrap}>
          {allBesoins.slice(0, 5).map((b) => {
            const nom = 'acheteurNom' in b ? b.acheteurNom : (b as any).acheteur;
            const isNew = 'acheteurId' in b;
            // Les besoins de démonstration n'ont pas d'auteur en base : pas de
            // profil à ouvrir pour eux, l'icône reste alors inerte.
            const acheteurId = 'acheteurId' in b ? b.acheteurId : undefined;
            const ouvrirProfil = () =>
              acheteurId && router.push({ pathname: '/vendeur/[id]', params: { id: acheteurId } });
            return (
              <TouchableOpacity
                key={b.id}
                style={styles.besoinCard}
                onPress={() => router.push('/besoins' as any)}
                activeOpacity={0.85}
              >
                {acheteurId ? (
                  <TouchableOpacity
                    style={styles.besoinEmojiBox}
                    onPress={ouvrirProfil}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityLabel={`Voir le profil de ${nom}`}
                  >
                    <Text style={styles.besoinEmoji}>{PRODUCT_EMOJIS[b.produit]}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.besoinEmojiBox}>
                    <Text style={styles.besoinEmoji}>{PRODUCT_EMOJIS[b.produit]}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={styles.besoinNom}
                      numberOfLines={1}
                      onPress={acheteurId ? ouvrirProfil : undefined}
                      suppressHighlighting={!acheteurId}
                    >
                      {nom}
                    </Text>
                    {isNew && (
                      <View style={styles.newBadge}>
                        <Text style={styles.newBadgeText}>Nouveau</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.besoinDetail}>{b.qte.toLocaleString()} {PRODUCT_LABELS[b.produit]}s · {b.region}</Text>
                </View>
                <View style={styles.besoinPrixCol}>
                  <Text style={styles.besoinPrix}>{b.prixMax.toLocaleString()}</Text>
                  <Text style={styles.besoinPrixLbl}>F max</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bandeau chiffres — carte sombre éditoriale */}
        <View style={styles.statsShell}>
          <LinearGradient
            colors={[Colors.ink, '#2E2418']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.statsHeadline}>Le réseau grandit chaque jour</Text>
          <View style={styles.statsRow}>
            {[
              { val: '14', label: 'régions couvertes', Icon: MapPin },
              { val: '500+', label: 'éleveurs actifs', Icon: Users },
              { val: '100%', label: 'profils vérifiés', Icon: ShieldCheck },
            ].map((s) => (
              <View key={s.label} style={styles.statBox}>
                <s.Icon size={17} color={Colors.gold} strokeWidth={1.6} />
                <Text style={styles.statVal}>{s.val}</Text>
                <Text style={styles.statLbl}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Accès rapide partenaires */}
        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>Des pros de confiance</Text>
            <Text style={styles.sectionTitle}>Partenaires certifiés</Text>
          </View>
        </View>
        <View style={styles.partenaireRow}>
          <TouchableOpacity
            style={styles.partenaireCard}
            onPress={() => router.push('/couvoirs' as any)}
            activeOpacity={0.88}
          >
            <View style={[styles.partenaireIconBox, { backgroundColor: Colors.primaryTint }]}>
              <Factory size={20} color={Colors.primaryDark} strokeWidth={1.6} />
            </View>
            <Text style={styles.partenaireLabel}>Couvoirs{'\n'}certifiés</Text>
            <ArrowRight size={15} color={Colors.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.partenaireCard}
            onPress={() => router.push('/veterinaires' as any)}
            activeOpacity={0.88}
          >
            <View style={[styles.partenaireIconBox, { backgroundColor: Colors.accentLight }]}>
              <Stethoscope size={20} color={Colors.accentDark} strokeWidth={1.6} />
            </View>
            <Text style={styles.partenaireLabel}>Vétérinaires{'\n'}certifiés</Text>
            <ArrowRight size={15} color={Colors.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        <LegalFooter />
        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  greeting: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 4 },
  greetingEyebrow: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8,
  },
  greetingTitle: { fontSize: 27, fontFamily: Fonts.display, color: Colors.text, lineHeight: 34, letterSpacing: -0.3 },

  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: 22, paddingTop: 30, paddingBottom: 14,
  },
  sectionEyebrow: {
    fontSize: 10.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
  },
  sectionTitle: { fontSize: 20, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  seeAll: { fontSize: 13.5, color: Colors.primary, fontFamily: Fonts.bodyBold },

  carouselWrap: { marginHorizontal: 18, marginTop: 20 },
  slide: { borderRadius: Radius.xl, height: 210, overflow: 'hidden', justifyContent: 'center' },
  slideDeco1: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(247,242,233,0.05)', top: -70, right: -50 },
  slideDeco2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(201,154,70,0.12)', bottom: -35, left: 16 },
  slideInner: { paddingHorizontal: 26, paddingVertical: 22 },
  slidePill: {
    backgroundColor: 'rgba(247,242,233,0.12)', alignSelf: 'flex-start',
    borderRadius: Radius.pill, paddingHorizontal: 11, paddingVertical: 5, marginBottom: 12,
  },
  slidePillText: { fontSize: 9.5, fontFamily: Fonts.bodyBold, color: Colors.textOnDarkMuted, letterSpacing: 1.6, textTransform: 'uppercase' },
  slideTitle: { fontSize: 22, fontFamily: Fonts.display, color: Colors.textOnDark, letterSpacing: -0.2, marginBottom: 6 },
  slideSub: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textOnDarkMuted, lineHeight: 19 },
  slideCta: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 16,
    backgroundColor: Colors.textOnDark, alignSelf: 'flex-start',
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderRadius: Radius.pill,
  },
  slideCtaText: { fontSize: 12.5, fontFamily: Fonts.bodyBold, color: Colors.ink },
  slideCtaArrow: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(36,31,25,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },
  dots: { flexDirection: 'row', justifyContent: 'center', marginTop: 14, gap: 5 },
  dot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.separator },
  dotActive: { backgroundColor: Colors.accent, width: 20, borderRadius: 3 },

  promoPriceBadge: {
    borderRadius: 14, borderWidth: 1.5, paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.06)', minWidth: 90,
  },
  promoPriceLabel: { fontSize: 9, fontFamily: Fonts.bodyBold, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  promoPriceValue: { fontSize: 17, fontFamily: Fonts.bodyExtraBold, letterSpacing: -0.3 },

  besoinsWrap: { paddingHorizontal: 20, gap: 10 },
  besoinCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 15,
    flexDirection: 'row', alignItems: 'center', gap: 13,
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  besoinEmojiBox: { width: 46, height: 46, borderRadius: 15, backgroundColor: Colors.surfaceSecondary, justifyContent: 'center', alignItems: 'center' },
  besoinEmoji: { fontSize: 23 },
  besoinNom: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 3, flexShrink: 1 },
  besoinDetail: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted },
  besoinPrixCol: { alignItems: 'flex-end' },
  besoinPrix: { fontSize: 16, fontFamily: Fonts.bodyExtraBold, color: Colors.primary, letterSpacing: -0.2 },
  besoinPrixLbl: { fontSize: 10, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  newBadge: { backgroundColor: Colors.accentLight, borderRadius: Radius.pill, paddingHorizontal: 7, paddingVertical: 2 },
  newBadgeText: { fontSize: 8.5, fontFamily: Fonts.bodyBold, color: Colors.accentDark, textTransform: 'uppercase', letterSpacing: 0.6 },

  statsShell: {
    marginHorizontal: 18, marginTop: 34, borderRadius: Radius.xl,
    paddingVertical: 26, paddingHorizontal: 22, overflow: 'hidden',
  },
  statsHeadline: { fontSize: 17, fontFamily: Fonts.display, color: Colors.textOnDark, marginBottom: 20, letterSpacing: -0.1 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: { flex: 1, gap: 5 },
  statVal: { fontSize: 22, fontFamily: Fonts.display, color: Colors.textOnDark, letterSpacing: -0.4, marginTop: 3 },
  statLbl: { fontSize: 10.5, fontFamily: Fonts.bodyMedium, color: Colors.textOnDarkMuted, lineHeight: 14 },

  featuredCard: {
    alignItems: 'center', width: 90,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 12, borderWidth: 1, borderColor: Colors.gold + '55',
    ...(Shadows.soft as object),
  },
  featuredGoldRing: {
    width: 58, height: 58, borderRadius: 29,
    borderWidth: 2, borderColor: Colors.gold,
    justifyContent: 'center', alignItems: 'center',
  },
  featuredAvatarImg: { width: 50, height: 50, borderRadius: 25 },
  featuredAvatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center',
  },
  featuredAvatarText: { fontSize: 18, fontFamily: Fonts.bodyExtraBold, color: Colors.primaryDark },
  featuredFerme: { fontSize: 11, fontFamily: Fonts.bodyExtraBold, color: Colors.text, textAlign: 'center', marginTop: 2, lineHeight: 14 },
  featuredRole: { fontSize: 11.5, fontFamily: Fonts.bodyBold, color: Colors.text, textAlign: 'center', marginTop: 2 },
  featuredRegion: { fontSize: 10, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center', marginTop: 1 },

  partenaireRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 22 },
  partenaireCard: {
    flex: 1, borderRadius: Radius.lg, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 11,
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  partenaireIconBox: { width: 40, height: 40, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  partenaireLabel: { flex: 1, fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.text, lineHeight: 17 },
});
