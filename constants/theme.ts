// Design system AviConnect — direction "éditorial chaleureux"
// Crème, terracotta, vert profond. Serif Fraunces pour les titres, Plus Jakarta Sans pour le reste.
import { Platform } from 'react-native';

export const Fonts = {
  display: 'Fraunces_600SemiBold',
  displayBold: 'Fraunces_700Bold',
  displayItalic: 'Fraunces_500Medium_Italic',
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemiBold: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  bodyExtraBold: 'PlusJakartaSans_800ExtraBold',
};

export const Colors = {
  // ── Brand ──────────────────────────────────────────────────────────────
  primary:      '#1E7A45',   // vert forêt profond
  primaryDark:  '#0E4A28',
  primaryMid:   '#279653',
  primaryLight: '#F0F7F0',
  primaryTint:  '#DCEEDF',

  // ── Accent chaleureux ─────────────────────────────────────────────────
  accent:       '#C1663B',   // terracotta
  accentDark:   '#9A4E2A',
  accentLight:  '#FBEEE5',
  gold:         '#C99A46',   // sable doré, pour highlights discrets

  // ── Fonds ─────────────────────────────────────────────────────────────
  background:        '#FBF7F0',  // crème chaud
  backgroundAlt:      '#F5EEE1',
  surface:            '#FFFEFB',
  surfaceSecondary:   '#F3ECE0',
  surfaceTertiary:    '#EBE1D0',
  surfaceElevated:    '#FFFFFF',
  ink:                '#211C16',  // fond sombre pour sections contrastées

  // ── Textes ────────────────────────────────────────────────────────────
  // Contrastes calibrés pour lecture en extérieur (plein soleil, écrans bas de gamme)
  text:            '#241F19',
  textSecondary:   '#4A4236',
  textTertiary:    '#6E6555',
  textLight:       '#6E6555',
  textMuted:       '#7E7565',
  textPlaceholder: '#A89D89',
  textOnDark:      '#F7F2E9',
  textOnDarkMuted: 'rgba(247,242,233,0.68)',

  // ── Bordures ──────────────────────────────────────────────────────────
  border:     '#E7DCC8',
  borderSoft: 'rgba(36,31,25,0.06)',
  separator:  '#DACBAE',

  // ── Sémantique ────────────────────────────────────────────────────────
  error:   '#C4432D',
  warning: '#C1663B',
  success: '#1E7A45',
  info:    '#3B6FA0',

  // ── Utilitaires ───────────────────────────────────────────────────────
  white:   '#FFFFFF',
  black:   '#000000',
  cardBg:  '#FFFEFB',
  tabBar:  '#FFFEFB',
  shadow:  '#241F19',
};

export const Spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
};

// Ombres douces et diffuses — jamais dures/noires
export const Shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    android: { elevation: 3 },
    web: { boxShadow: '0 8px 24px rgba(36,31,25,0.07)' } as any,
    default: {},
  }),
  card: Platform.select({
    ios: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
    },
    android: { elevation: 3 },
    web: { boxShadow: '0 4px 18px rgba(36,31,25,0.08)' } as any,
    default: {},
  }),
  floating: Platform.select({
    ios: {
      shadowColor: Colors.shadow,
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.14,
      shadowRadius: 28,
    },
    android: { elevation: 10 },
    web: { boxShadow: '0 14px 36px rgba(36,31,25,0.18)' } as any,
    default: {},
  }),
  button: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.24,
      shadowRadius: 14,
    },
    android: { elevation: 5 },
    web: { boxShadow: '0 6px 18px rgba(30,122,69,0.26)' } as any,
    default: {},
  }),
};

export const Motion = {
  spring: { damping: 16, stiffness: 180, mass: 0.9 },
  springSoft: { damping: 18, stiffness: 140, mass: 1 },
  press: { duration: 120 },
};
