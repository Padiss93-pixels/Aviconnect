import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useActualites, CATEGORIE_LABELS, CATEGORIE_COLORS, CATEGORIE_EMOJIS } from '@/hooks/ActualitesContext';
import { useAuthContext } from '@/hooks/AuthContext';

export default function ActualiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { actualites, deleteActualite } = useActualites();
  const { isAdmin } = useAuthContext();

  const actu = actualites.find((a) => String(a.id) === id);

  if (!actu) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundEmoji}>📰</Text>
        <Text style={styles.notFoundText}>Article introuvable</Text>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.backBtn2}>
          <Text style={styles.backBtn2Text}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const cat = CATEGORIE_COLORS[actu.categorie];

  const handleDelete = () => {
    const doDelete = async () => {
      await deleteActualite(actu.id);
      router.canGoBack() ? router.back() : router.replace('/(tabs)');
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cet article ?')) doDelete();
    } else {
      Alert.alert('Supprimer ?', 'Cette action est irréversible.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // Rend le contenu avec les titres gras (**texte**)
  const renderContenu = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <Text key={i} style={styles.contentBold}>{line.slice(2, -2)}</Text>;
      }
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <View key={i} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{line.slice(2)}</Text>
          </View>
        );
      }
      if (line.trim() === '') return <View key={i} style={{ height: 8 }} />;
      return <Text key={i} style={styles.contentText}>{line}</Text>;
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: Colors.primary }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Actualité</Text>
        {isAdmin && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="trash-outline" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Catégorie badge */}
        <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
          <View style={[styles.catDot, { backgroundColor: cat.dot }]} />
          <Text style={[styles.catBadgeText, { color: cat.text }]}>
            {CATEGORIE_EMOJIS[actu.categorie]} {CATEGORIE_LABELS[actu.categorie]}
          </Text>
        </View>

        {/* Titre */}
        <Text style={styles.titre}>{actu.titre}</Text>

        {/* Meta */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{actu.auteurNom}</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(actu.createdAt)}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Résumé */}
        <Text style={styles.resume}>{actu.resume}</Text>

        <View style={styles.divider} />

        {/* Contenu */}
        <View style={styles.contenuBlock}>
          {renderContenu(actu.contenu)}
        </View>
      </ScrollView>
    </View>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  deleteBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },

  scroll: { flex: 1 },

  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
    marginBottom: 14,
  },
  catDot: { width: 7, height: 7, borderRadius: 3.5 },
  catBadgeText: { fontSize: 12, fontWeight: '700' },

  titre: { fontSize: 22, fontWeight: '900', color: Colors.text, letterSpacing: -0.5, lineHeight: 30, marginBottom: 14 },

  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontSize: 12, color: Colors.textMuted },

  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 16 },

  resume: { fontSize: 15, color: Colors.textSecondary, lineHeight: 23, fontStyle: 'italic', fontWeight: '500' },

  contenuBlock: { gap: 4 },
  contentText: { fontSize: 14, color: Colors.text, lineHeight: 22 },
  contentBold: { fontSize: 15, fontWeight: '800', color: Colors.text, marginTop: 8, marginBottom: 2 },
  bulletRow: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  bullet: { fontSize: 14, color: Colors.primary, fontWeight: '700', marginTop: 2 },
  bulletText: { fontSize: 14, color: Colors.text, lineHeight: 22, flex: 1 },

  notFound: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFoundEmoji: { fontSize: 56 },
  notFoundText: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  backBtn2: { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtn2Text: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
