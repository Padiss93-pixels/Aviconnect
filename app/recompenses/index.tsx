// Écran Récompenses — gamification façon Duolingo, direction « éditorial chaleureux ».
// Badges en architecture double-bezel, coins dorés, entrées en cascade (transform/opacity).
import { ReactNode, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Animated, Easing,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Check, Flame, Lock, Medal, Sparkles, Target, TrendingUp, UserRound,
} from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';
import {
  useRewards, getLevel, LEVELS, QUESTS, BADGES,
} from '@/hooks/RewardsContext';

// ── Entrée en cascade : fade-up avec ressort, transform + opacity uniquement ──
function FadeUp({ delay = 0, children, style }: { delay?: number; children: ReactNode; style?: any }) {
  const translateY = useRef(new Animated.Value(28)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0, delay, damping: 17, stiffness: 130, mass: 0.9, useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1, delay, duration: 520, easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[style, { transform: [{ translateY }], opacity }]}>
      {children}
    </Animated.View>
  );
}

export default function RecompensesScreen() {
  const { user } = useAuthContext();
  const { data, questsDoneToday } = useRewards();

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  };

  // Barre de progression : one-shot, jamais re-déclenchée au re-render
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { level, index: levelIndex, next, progress } = getLevel(data.xp);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress, duration: 900, delay: 350,
      easing: Easing.bezier(0.32, 0.72, 0, 1), useNativeDriver: false,
    }).start();
  }, [progress]);

  if (!user) {
    return (
      <View style={styles.authWall}>
        <View style={styles.authIconBox}>
          <UserRound size={30} color={Colors.primaryDark} strokeWidth={1.6} />
        </View>
        <Text style={styles.authTitle}>Tes récompenses{'\n'}t'attendent</Text>
        <Text style={styles.authSub}>
          Connecte-toi pour gagner des XP, entretenir ta série et débloquer des badges.
        </Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
          <Text style={styles.authBtnText}>Se connecter</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const unlockedCount = data.badges.length;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

        {/* En-tête éditorial */}
        <View style={styles.pageHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={goBack} hitSlop={10}>
            <ArrowLeft size={20} color={Colors.text} strokeWidth={1.7} />
          </TouchableOpacity>
          <Text style={styles.eyebrow}>Ta progression</Text>
          <Text style={styles.pageTitle}>Récompenses</Text>
        </View>

        {/* Carte héro — niveau & XP */}
        <FadeUp delay={0}>
          <View style={styles.heroShell}>
            <View style={styles.heroCard}>
              <LinearGradient
                colors={[Colors.ink, Colors.primaryDark]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.heroDeco1} />
              <View style={styles.heroDeco2} />

              <View style={styles.heroTop}>
                <View style={styles.levelCoinShell}>
                  <LinearGradient
                    colors={['#E8C078', '#C99A46']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.levelCoin}
                  >
                    <Text style={styles.levelCoinEmoji}>{level.emoji}</Text>
                  </LinearGradient>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.levelEyebrow}>Niveau {levelIndex + 1} / {LEVELS.length}</Text>
                  <Text style={styles.levelName}>{level.name}</Text>
                  <Text style={styles.xpTotal}>{data.xp.toLocaleString()} XP</Text>
                </View>
              </View>

              {/* Progression vers le prochain niveau */}
              <View style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, {
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['2%', '100%'] }),
                }]} />
              </View>
              <Text style={styles.progressHint}>
                {next
                  ? `Encore ${(next.minXp - data.xp).toLocaleString()} XP avant « ${next.name} » ${next.emoji}`
                  : 'Niveau maximum atteint — chapeau bas !'}
              </Text>
            </View>
          </View>
        </FadeUp>

        {/* Série & stats */}
        <FadeUp delay={90}>
          <View style={styles.statsRow}>
            <View style={styles.statShell}>
              <View style={styles.statCore}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(193,102,59,0.12)' }]}>
                  <Flame size={18} color={Colors.accent} strokeWidth={1.7} />
                </View>
                <Text style={styles.statValue}>{data.streak}</Text>
                <Text style={styles.statLabel}>jours de série</Text>
              </View>
            </View>
            <View style={styles.statShell}>
              <View style={styles.statCore}>
                <View style={[styles.statIconBox, { backgroundColor: Colors.primaryTint }]}>
                  <TrendingUp size={18} color={Colors.primaryDark} strokeWidth={1.7} />
                </View>
                <Text style={styles.statValue}>{data.bestStreak}</Text>
                <Text style={styles.statLabel}>record</Text>
              </View>
            </View>
            <View style={styles.statShell}>
              <View style={styles.statCore}>
                <View style={[styles.statIconBox, { backgroundColor: 'rgba(201,154,70,0.16)' }]}>
                  <Medal size={18} color={Colors.gold} strokeWidth={1.7} />
                </View>
                <Text style={styles.statValue}>{unlockedCount}</Text>
                <Text style={styles.statLabel}>badges</Text>
              </View>
            </View>
          </View>
        </FadeUp>

        {/* Défis du jour */}
        <FadeUp delay={180}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Chaque jour compte</Text>
            <Text style={styles.sectionTitle}>Défis du jour</Text>
          </View>
          <View style={styles.questShell}>
            <View style={styles.questCore}>
              {QUESTS.map((q, i) => {
                const done = questsDoneToday.includes(q.id);
                return (
                  <View key={q.id} style={[styles.questRow, i < QUESTS.length - 1 && styles.rowDivider]}>
                    <View style={[styles.questIconBox, done ? styles.questIconDone : null]}>
                      {done
                        ? <Check size={15} color="#fff" strokeWidth={2.4} />
                        : <Target size={15} color={Colors.textTertiary} strokeWidth={1.7} />}
                    </View>
                    <Text style={[styles.questLabel, done && styles.questLabelDone]}>{q.label}</Text>
                    <View style={[styles.xpChip, done && styles.xpChipDone]}>
                      <Sparkles size={10} color={done ? Colors.primaryDark : Colors.gold} strokeWidth={2} />
                      <Text style={[styles.xpChipText, done && styles.xpChipTextDone]}>+{q.xp} XP</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </FadeUp>

        {/* Collection de badges — double-bezel, cascade */}
        <FadeUp delay={260}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Ta collection</Text>
            <Text style={styles.sectionTitle}>Badges ({unlockedCount}/{BADGES.length})</Text>
          </View>
        </FadeUp>

        <View style={styles.badgeGrid}>
          {BADGES.map((b, i) => {
            const unlocked = data.badges.includes(b.id);
            return (
              <FadeUp key={b.id} delay={320 + i * 70} style={styles.badgeCell}>
                <View style={[styles.badgeShell, unlocked && styles.badgeShellUnlocked]}>
                  <View style={[styles.badgeCore, unlocked && styles.badgeCoreUnlocked]}>
                    {unlocked ? (
                      <View style={styles.badgeCoinShell}>
                        <LinearGradient
                          colors={['#F2D9A4', '#C99A46']}
                          start={{ x: 0.2, y: 0 }} end={{ x: 0.8, y: 1 }}
                          style={styles.badgeCoin}
                        >
                          <Text style={styles.badgeEmoji}>{b.emoji}</Text>
                        </LinearGradient>
                      </View>
                    ) : (
                      <View style={styles.badgeCoinLocked}>
                        <Lock size={17} color={Colors.textPlaceholder} strokeWidth={1.6} />
                      </View>
                    )}
                    <Text style={[styles.badgeLabel, !unlocked && styles.badgeLabelLocked]} numberOfLines={1}>
                      {b.label}
                    </Text>
                    <Text style={styles.badgeDesc} numberOfLines={2}>{b.desc}</Text>
                  </View>
                </View>
              </FadeUp>
            );
          })}
        </View>

        {/* Comment gagner des XP */}
        <FadeUp delay={420}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionEyebrow}>Le principe</Text>
            <Text style={styles.sectionTitle}>Comment gagner des XP</Text>
          </View>
          <View style={styles.questShell}>
            <View style={styles.questCore}>
              {[
                { label: 'Ouvrir AviConnect chaque jour', xp: 10 },
                { label: 'Publier une annonce', xp: 25 },
                { label: 'Publier un besoin', xp: 20 },
                { label: 'Passer une commande', xp: 40 },
                { label: 'Débloquer un badge', xp: 20 },
              ].map((r, i, arr) => (
                <View key={r.label} style={[styles.questRow, i < arr.length - 1 && styles.rowDivider]}>
                  <Text style={[styles.questLabel, { marginLeft: 2 }]}>{r.label}</Text>
                  <View style={styles.xpChip}>
                    <Sparkles size={10} color={Colors.gold} strokeWidth={2} />
                    <Text style={styles.xpChipText}>+{r.xp} XP</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </FadeUp>
      </ScrollView>
    </View>
  );
}

const OUTER = 26;
const SHELL_PAD = 5;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 62 : 48,
    paddingHorizontal: 22, paddingBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft, marginBottom: 18,
    ...(Shadows.soft as object),
  },
  eyebrow: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8,
  },
  pageTitle: { fontSize: 27, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.3 },

  // Héro — coque crème + noyau encre (double-bezel)
  heroShell: {
    marginHorizontal: 18, backgroundColor: Colors.surfaceTertiary,
    borderRadius: OUTER + SHELL_PAD, padding: SHELL_PAD,
    ...(Shadows.card as object),
  },
  heroCard: {
    borderRadius: OUTER, overflow: 'hidden',
    paddingHorizontal: 22, paddingVertical: 24,
  },
  heroDeco1: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(247,242,233,0.05)', top: -60, right: -45 },
  heroDeco2: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(201,154,70,0.13)', bottom: -46, left: 6 },

  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  levelCoinShell: {
    padding: 4, borderRadius: 30,
    backgroundColor: 'rgba(247,242,233,0.12)',
    borderWidth: 1, borderColor: 'rgba(247,242,233,0.2)',
  },
  levelCoin: {
    width: 62, height: 62, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  levelCoinEmoji: { fontSize: 28 },
  levelEyebrow: {
    fontSize: 10, fontFamily: Fonts.bodyBold, color: 'rgba(232,192,120,0.95)',
    textTransform: 'uppercase', letterSpacing: 1.4,
  },
  levelName: { fontSize: 22, fontFamily: Fonts.display, color: Colors.textOnDark, letterSpacing: -0.2, marginTop: 3 },
  xpTotal: { fontSize: 13, fontFamily: Fonts.bodySemiBold, color: Colors.textOnDarkMuted, marginTop: 3 },

  progressTrack: {
    height: 10, borderRadius: 5, marginTop: 20,
    backgroundColor: 'rgba(247,242,233,0.14)', overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 5,
    backgroundColor: '#E8C078',
  },
  progressHint: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textOnDarkMuted, marginTop: 10 },

  // Stats — trois tuiles double-bezel
  statsRow: { flexDirection: 'row', marginHorizontal: 18, gap: 10, marginTop: 14 },
  statShell: {
    flex: 1, backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg + 4, padding: 4,
    ...(Shadows.soft as object),
  },
  statCore: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  statIconBox: {
    width: 34, height: 34, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 20, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.4 },
  statLabel: { fontSize: 10.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 2 },

  sectionHeader: { paddingHorizontal: 22, paddingTop: 30, paddingBottom: 12 },
  sectionEyebrow: {
    fontSize: 10.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
  },
  sectionTitle: { fontSize: 19, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },

  // Défis du jour
  questShell: {
    marginHorizontal: 18, backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg + 4, padding: 4,
    ...(Shadows.soft as object),
  },
  questCore: { backgroundColor: Colors.surface, borderRadius: Radius.lg, overflow: 'hidden' },
  questRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  questIconBox: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  questIconDone: { backgroundColor: Colors.primary },
  questLabel: { flex: 1, fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.text },
  questLabelDone: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  xpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(201,154,70,0.13)', borderRadius: Radius.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  xpChipDone: { backgroundColor: Colors.primaryTint },
  xpChipText: { fontSize: 11, fontFamily: Fonts.bodyBold, color: '#8A6A2F' },
  xpChipTextDone: { color: Colors.primaryDark },

  // Badges — grille 2 colonnes, tuiles double-bezel
  badgeGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    marginHorizontal: 18, gap: 10,
  },
  badgeCell: { width: '48.4%', flexGrow: 1 },
  badgeShell: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg + 4, padding: 4,
    ...(Shadows.soft as object),
  },
  badgeShellUnlocked: { backgroundColor: 'rgba(201,154,70,0.22)' },
  badgeCore: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingVertical: 18, paddingHorizontal: 12, alignItems: 'center',
  },
  badgeCoreUnlocked: {
    borderWidth: 1, borderColor: 'rgba(201,154,70,0.35)',
  },
  badgeCoinShell: {
    padding: 3, borderRadius: 26,
    backgroundColor: 'rgba(201,154,70,0.16)', marginBottom: 10,
  },
  badgeCoin: {
    width: 50, height: 50, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeEmoji: { fontSize: 24 },
  badgeCoinLocked: {
    width: 56, height: 56, borderRadius: 25, marginBottom: 10,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  badgeLabel: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.text, textAlign: 'center' },
  badgeLabelLocked: { color: Colors.textMuted },
  badgeDesc: {
    fontSize: 11, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 4, lineHeight: 15,
  },

  // Mur d'authentification
  authWall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, backgroundColor: Colors.background },
  authIconBox: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  authTitle: {
    fontSize: 23, fontFamily: Fonts.display, color: Colors.text,
    textAlign: 'center', lineHeight: 30, letterSpacing: -0.3,
  },
  authSub: {
    fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 10, lineHeight: 20, marginBottom: 26,
  },
  authBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 34, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center',
    ...(Shadows.button as object),
  },
  authBtnText: { color: Colors.textOnDark, fontSize: 15, fontFamily: Fonts.bodyBold },
});
