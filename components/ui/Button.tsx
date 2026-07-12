import { ReactNode } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, StyleProp } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRight } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';

type Variant = 'primary' | 'accent' | 'outline' | 'ghost' | 'dark';
type Size = 'md' | 'lg';

type Props = {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  showArrow?: boolean;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function Button({
  title, onPress, variant = 'primary', size = 'lg', icon, showArrow,
  loading, disabled, fullWidth, style,
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => { scale.value = withSpring(0.97, { damping: 16, stiffness: 260 }); };
  const onPressOut = () => { scale.value = withSpring(1, { damping: 14, stiffness: 220 }); };

  const isDark = variant === 'dark';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const textColor = isOutline || isGhost ? Colors.text : '#fff';

  const content = (
    <>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <>
          {icon}
          <Text style={[styles.text, size === 'md' && styles.textMd, { color: textColor }]}>{title}</Text>
          {showArrow && (
            <Animated.View style={[styles.arrowCircle, isOutline || isGhost ? styles.arrowCircleLight : styles.arrowCircleOnColor]}>
              <ArrowRight size={14} color={textColor} strokeWidth={2} />
            </Animated.View>
          )}
        </>
      )}
    </>
  );

  const gradientColors: [string, string] =
    variant === 'accent' ? [Colors.accent, Colors.accentDark] : [Colors.primaryMid, Colors.primaryDark];

  return (
    <AnimatedPressable
      onPress={disabled || loading ? undefined : onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        animStyle,
        styles.base,
        size === 'md' && styles.baseMd,
        fullWidth && styles.fullWidth,
        isOutline && styles.outline,
        isGhost && styles.ghost,
        isDark && styles.dark,
        (variant === 'primary' || variant === 'accent') && Shadows.button,
        disabled && styles.disabled,
        style,
      ]}
    >
      {variant === 'primary' || variant === 'accent' ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      ) : null}
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingHorizontal: 24, paddingVertical: 16,
    borderRadius: Radius.pill, overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  baseMd: { paddingHorizontal: 18, paddingVertical: 12 },
  fullWidth: { alignSelf: 'stretch' },
  outline: { borderWidth: 1.5, borderColor: Colors.border, backgroundColor: 'transparent' },
  ghost: { backgroundColor: 'transparent', paddingHorizontal: 8 },
  dark: { backgroundColor: Colors.ink },
  disabled: { opacity: 0.5 },
  text: { fontFamily: Fonts.bodyBold, fontSize: 15.5, letterSpacing: 0.1 },
  textMd: { fontSize: 14 },
  arrowCircle: {
    width: 26, height: 26, borderRadius: 13,
    justifyContent: 'center', alignItems: 'center', marginLeft: 2,
  },
  arrowCircleOnColor: { backgroundColor: 'rgba(255,255,255,0.22)' },
  arrowCircleLight: { backgroundColor: Colors.surfaceSecondary },
});
