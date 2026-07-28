// Toast global de récompense (XP, badge, niveau, série) — façon Duolingo.
// Rendu dans app/_layout.tsx au-dessus du Stack, piloté par RewardsContext.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View, Platform } from 'react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useRewards, RewardToast as ToastData } from '@/hooks/RewardsContext';

const KIND_COLORS: Record<ToastData['kind'], { bg: string; border: string }> = {
  xp:     { bg: Colors.ink,         border: 'rgba(201,154,70,0.55)' },
  badge:  { bg: Colors.primaryDark, border: 'rgba(159,216,180,0.5)' },
  level:  { bg: Colors.accentDark,  border: 'rgba(251,238,229,0.5)' },
  streak: { bg: Colors.ink,         border: 'rgba(201,154,70,0.55)' },
};

export default function RewardToast() {
  const { toast } = useRewards();
  const translateY = useRef(new Animated.Value(-90)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -90, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
      return;
    }
    translateY.setValue(-90);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 180, mass: 0.8, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start();
  }, [toast?.key]);

  if (!toast) return null;
  const palette = KIND_COLORS[toast.kind];

  return (
    <View pointerEvents="none" style={styles.wrapper}>
      <Animated.View style={[
        styles.toast,
        { backgroundColor: palette.bg, borderColor: palette.border, transform: [{ translateY }], opacity },
      ]}>
        {toast.emoji ? <Text style={styles.emoji}>{toast.emoji}</Text> : null}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title} numberOfLines={1}>{toast.title}</Text>
          {toast.subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{toast.subtitle}</Text> : null}
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 58 : 44,
    left: 0, right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  toast: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 18, paddingVertical: 12,
    borderRadius: Radius.pill, borderWidth: 1,
    maxWidth: '88%',
    ...(Shadows.floating as object),
  },
  emoji: { fontSize: 20 },
  title: { fontSize: 13.5, fontFamily: Fonts.bodyBold, color: Colors.textOnDark },
  subtitle: { fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textOnDarkMuted, marginTop: 1 },
});
