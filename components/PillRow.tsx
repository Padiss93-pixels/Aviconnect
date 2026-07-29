import { useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import {
  View, ScrollView, Pressable, StyleSheet, Platform,
  type StyleProp, type ViewStyle,
} from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Colors, Radius } from '@/constants/theme';

// Rangée de pastilles défilante (régions, disponibilités…).
//
// Au doigt, le défilement horizontal va de soi. À la souris il n'existe pas :
// sur ordinateur, les régions au-delà du bord droit étaient tout simplement
// inatteignables — impossible de choisir Ziguinchor à l'inscription. D'où les
// deux flèches, rendues uniquement sur le web et seulement si le contenu
// dépasse réellement. Sur mobile, le comportement est strictement inchangé.
//
// Les mesures viennent du nœud DOM et non de onLayout / onContentSizeChange :
// dans cette app, ces deux callbacks ne se déclenchent jamais sur un ScrollView
// horizontal imbriqué dans le ScrollView vertical de la page (vérifié sur
// l'écran d'inscription, les deux restaient à 0). Comme les flèches sont de
// toute façon web-only, mesurer le DOM est à la fois plus simple et fiable.

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
};

type Metrics = { scrollLeft: number; clientWidth: number; scrollWidth: number };
const ZERO: Metrics = { scrollLeft: 0, clientWidth: 0, scrollWidth: 0 };

export default function PillRow({ children, style, contentContainerStyle }: Props) {
  const ref = useRef<ScrollView>(null);
  const [m, setM] = useState<Metrics>(ZERO);

  // react-native-web expose tantôt le nœud, tantôt l'instance ScrollView.
  const getNode = useCallback((): HTMLElement | null => {
    const r = ref.current as any;
    if (!r) return null;
    return typeof r.getScrollableNode === 'function' ? r.getScrollableNode() : r;
  }, []);

  const measure = useCallback(() => {
    const node = getNode();
    if (!node) return;
    const next: Metrics = {
      scrollLeft: node.scrollLeft,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    };
    setM((prev) =>
      prev.scrollLeft === next.scrollLeft &&
      prev.clientWidth === next.clientWidth &&
      prev.scrollWidth === next.scrollWidth
        ? prev
        : next,
    );
  }, [getNode]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    measure();
    const node = getNode();
    if (!node || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    // Le conteneur peut garder sa taille pendant que son contenu change.
    if (node.firstElementChild) ro.observe(node.firstElementChild);
    return () => ro.disconnect();
  }, [measure, getNode]);

  const maxOffset = Math.max(0, m.scrollWidth - m.clientWidth);
  const showArrows = Platform.OS === 'web' && maxOffset > 1;
  const atStart = m.scrollLeft <= 1;
  const atEnd = m.scrollLeft >= maxOffset - 1;

  const scrollBy = (direction: 1 | -1) => {
    const node = getNode();
    if (!node) return;
    // Position lue sur le nœud, pas dans l'état React : deux clics rapprochés
    // sont groupés par React et calculeraient sinon la même cible, si bien que
    // le second clic ne ferait rien.
    const current = node.scrollLeft;
    const limit = Math.max(0, node.scrollWidth - node.clientWidth);
    // Un peu moins qu'un écran, pour garder une pastille de repère visible.
    const step = Math.max(140, node.clientWidth * 0.7);
    const target = Math.min(limit, Math.max(0, current + direction * step));
    // Affectation directe et instantanée : sur ce ScrollView, `scrollTo({...})`
    // est sans effet et `scroll-behavior: smooth` voit sa position ramenée à 0
    // avant la fin de l'animation. Seul `scrollLeft` tient. Vérifié en place.
    node.scrollLeft = target;
    measure();
  };

  const Arrow = ({ side }: { side: 'left' | 'right' }) => {
    const disabled = side === 'left' ? atStart : atEnd;
    const Icon = side === 'left' ? ChevronLeft : ChevronRight;
    return (
      <Pressable
        onPress={() => scrollBy(side === 'left' ? -1 : 1)}
        disabled={disabled}
        style={[styles.arrow, disabled && styles.arrowDisabled]}
        accessibilityRole="button"
        accessibilityLabel={side === 'left' ? 'Voir les choix précédents' : 'Voir les choix suivants'}
      >
        <Icon
          size={17}
          color={disabled ? Colors.textMuted : Colors.primaryDark}
          strokeWidth={2.4}
        />
      </Pressable>
    );
  };

  return (
    <View style={[styles.row, style]}>
      {showArrows && <Arrow side="left" />}
      <ScrollView
        ref={ref}
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={measure}
        contentContainerStyle={contentContainerStyle}
        style={styles.scroll}
      >
        {children}
      </ScrollView>
      {showArrows && <Arrow side="right" />}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  scroll: { flex: 1 },
  arrow: {
    width: 30, height: 30, borderRadius: Radius.pill,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1, borderColor: Colors.border,
  },
  arrowDisabled: { opacity: 0.35 },
});
