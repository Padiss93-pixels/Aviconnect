// Logo AviConnect « Le Crieur » — coq dont la crête est faite d'ondes d'annonce.
// Même géométrie que assets/icon.png (générés depuis ce tracé).
import Svg, { Circle, Path, G } from 'react-native-svg';
import { Colors } from '@/constants/theme';

type Variant = 'color' | 'cream' | 'mono';

type Props = {
  size?: number;
  /** color : vert/terracotta (fonds clairs) · cream : crème/doré (fonds sombres ou verts) · mono : une seule couleur */
  variant?: Variant;
  /** Couleur unique utilisée par la variante mono */
  tint?: string;
};

const PALETTES: Record<Variant, { head: string; accent: string; eye: string }> = {
  color: { head: Colors.primary, accent: Colors.accent, eye: Colors.background },
  cream: { head: Colors.background, accent: Colors.gold, eye: Colors.primary },
  mono: { head: '#000', accent: '#000', eye: '#fff' },
};

export default function Logo({ size = 32, variant = 'color', tint }: Props) {
  let { head, accent, eye } = PALETTES[variant];
  if (variant === 'mono' && tint) {
    head = tint;
    accent = tint;
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Circle cx={48} cy={60} r={21} fill={head} />
      <Path d="M68,54 L83,60 L68,66 Z" fill={accent} />
      <Circle cx={65} cy={73} r={4.2} fill={accent} />
      <Circle cx={54} cy={55} r={3.1} fill={eye} />
      <G fill="none" stroke={accent} strokeLinecap="round" strokeWidth={5}>
        <Path d="M41,34 A8,8 0 0 1 55,34" />
        <Path d="M35.8,30 A14,14 0 0 1 60.2,30" />
        <Path d="M30.6,26 A20,20 0 0 1 65.4,26" />
      </G>
    </Svg>
  );
}
