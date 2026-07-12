import { Text, View, StyleSheet } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

type Tone = 'primary' | 'accent' | 'dark' | 'light';

export default function Badge({ label, tone = 'primary' }: { label: string; tone?: Tone }) {
  return (
    <View style={[styles.base, TONES[tone].wrap]}>
      <Text style={[styles.text, TONES[tone].text]}>{label}</Text>
    </View>
  );
}

const TONES: Record<Tone, { wrap: object; text: object }> = {
  primary: { wrap: { backgroundColor: Colors.primaryTint }, text: { color: Colors.primaryDark } },
  accent:  { wrap: { backgroundColor: Colors.accentLight }, text: { color: Colors.accentDark } },
  dark:    { wrap: { backgroundColor: 'rgba(247,242,233,0.14)' }, text: { color: Colors.textOnDark } },
  light:   { wrap: { backgroundColor: 'rgba(255,255,255,0.9)' }, text: { color: Colors.text } },
};

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: Radius.pill,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  text: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10.5,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
});
