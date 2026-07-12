import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Colors, Radius, Shadows } from '@/constants/theme';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
};

// "Double-bezel" — coque extérieure crème + noyau blanc, comme une plaque de verre montée sur un plateau.
export default function Card({ children, style, innerStyle, padded = true }: Props) {
  return (
    <View style={[styles.shell, Shadows.card, style]}>
      <View style={[styles.core, padded && styles.padded, innerStyle]}>
        {children}
      </View>
    </View>
  );
}

const OUTER_RADIUS = Radius.xl;
const SHELL_PAD = 5;

const styles = StyleSheet.create({
  shell: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: OUTER_RADIUS,
    padding: SHELL_PAD,
  },
  core: {
    backgroundColor: Colors.surface,
    borderRadius: OUTER_RADIUS - SHELL_PAD,
    overflow: 'hidden',
  },
  padded: { padding: 18 },
});
