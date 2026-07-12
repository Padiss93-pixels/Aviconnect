import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  FlatList, Linking, Platform, StatusBar,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight, Factory, MapPin, ShieldCheck, Stethoscope, Users } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { BESOINS, PRODUCT_EMOJIS, PRODUCT_LABELS } from '@/constants/mockData';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBesoins } from '@/hooks/BesoinContext';
import { useAuthContext } from '@/hooks/AuthContext';
import { usePubs } from '@/hooks/PubContext';
import { useDrawer } from '@/hooks/DrawerContext';
import LotCard from '@/components/LotCard';
import LegalFooter from '@/components/LegalFooter';
import ScreenHeader from '@/components/ui/ScreenHeader';

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { toggle: toggleDrawer } = useDrawer();
  const [slideIndex, setSlideIndex] = useState(0);
  const { annonces: lots, unreadCount } = useAnnonces();
  const { banners } = usePubs();
  const { besoins: userBesoins } = useBesoins();
  // Merge user besoins (most recent first) with mock besoins, dedup by id
  const allBesoins = (() => {
    const mockIds = new Set(BESOINS.map((b) => b.id));
    const uniqueUser = userBesoins.filter((b) => !mockIds.has(b.id));
    return [...uniqueUser, ...BESOINS];
  })();
  const activeSlides = banners.filter((b) => b.actif);

  useEffect(() => {
    if (activeSlides.length === 0) return;
    const timer = setInterval(() => {
      setSlideIndex((i) => (i + 1) % activeSlides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeSlides.length]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScreenHeader showLogo onMenuPress={toggleDrawer} unreadCount={unreadCount} />

      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Salutation */}
        <View style={styles.greeting}>
          <Text style={styles.greetingEyebrow}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <Text style={styles.greetingTitle}>
            {user?.prenom ? `Bonjour ${user.prenom},` : 'Bonjour,'}{'\n'}le marché t'attend.
          </Text>
        </View>

        {/* Carousel bannières */}
        {activeSlides.length > 0 && (() => {
          const slide = activeSlides[slideIndex % activeSlides.length];
          const hasLien = !!slide.lien;
          const openSlide = () => {
            if (!slide.lien) return;
            if (Platform.OS === 'web') window.open(slide.lien, '_blank', 'noopener,noreferrer');
            else Linking.openURL(slide.lien).catch(() => {});
          };
          return (
            <View style={styles.carouselWrap}>
              <TouchableOpacity
                activeOpacity={hasLien ? 0.9 : 1}
                onPress={hasLien ? openSlide : undefined}
                style={styles.slide}
              >
                <LinearGradient
                  colors={[Colors.ink, Colors.primaryDark]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <View style={styles.slideDeco1} />
                <View style={styles.slideDeco2} />
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
              </TouchableOpacity>
              {activeSlides.length > 1 && (
                <View style={styles.dots}>
                  {activeSlides.map((_, i) => (
                    <View key={i} style={[styles.dot, i === slideIndex % activeSlides.length && styles.dotActive]} />
                  ))}
                </View>
              )}
            </View>
          );
        })()}

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
              <LotCard lot={item} compact />
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
            return (
              <View key={b.id} style={styles.besoinCard}>
                <View style={styles.besoinEmojiBox}>
                  <Text style={styles.besoinEmoji}>{PRODUCT_EMOJIS[b.produit]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.besoinNom} numberOfLines={1}>{nom}</Text>
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
              </View>
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
