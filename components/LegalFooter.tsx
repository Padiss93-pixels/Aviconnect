import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';

const LINKS = [
  { label: 'Support & Aide',     path: '/aide' },
  { label: 'Confidentialité',    path: '/confidentialite' },
  { label: 'CGU',                path: '/conditions' },
  { label: 'Mentions légales',   path: '/mentions-legales' },
  { label: 'Mes droits',         path: '/mes-droits' },
  { label: 'DPA',                path: '/dpa' },
  { label: 'Cookies',            path: '/cookies' },
];

export default function LegalFooter() {
  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <Text style={styles.brand}>AviConnect · Dakar, Sénégal</Text>
      <View style={styles.links}>
        {LINKS.map((l, i) => (
          <TouchableOpacity key={i} onPress={() => router.push(l.path as any)}>
            <Text style={styles.link}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.copy}>© 2025 AviConnect · Loi n°2008-12 · CDP Sénégal</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: 16 },
  brand: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textAlign: 'center', marginBottom: 12 },
  links: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 12 },
  link: {
    fontSize: 11, color: Colors.primary, fontWeight: '600',
    paddingHorizontal: 8, paddingVertical: 4,
    backgroundColor: Colors.primaryLight, borderRadius: 6,
  },
  copy: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },
});
