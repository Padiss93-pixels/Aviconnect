import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import {
  useActualites,
  CATEGORIE_LABELS, CATEGORIE_COLORS, CATEGORIE_EMOJIS,
  type Categorie,
} from '@/hooks/ActualitesContext';

const FILTRES: Array<{ key: 'toutes' | Categorie; label: string }> = [
  { key: 'toutes', label: 'Toutes' },
  { key: 'virus', label: '🦠 Maladies' },
  { key: 'vaccin', label: '💉 Vaccins' },
  { key: 'sante', label: '🩺 Santé' },
  { key: 'marche', label: '📈 Marché' },
  { key: 'metier', label: '👨‍🌾 Métier' },
  { key: 'conseil', label: '💡 Conseils' },
  { key: 'reglementation', label: '📋 Règles' },
];

export default function ActualitesScreen() {
  const { actualites } = useActualites();
  const [filtre, setFiltre] = useState<'toutes' | Categorie>('toutes');

  const filtered = filtre === 'toutes' ? actualites : actualites.filter((a) => a.categorie === filtre);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Actualités</Text>
          <Text style={styles.headerSub}>Infos santé, marché & métier</Text>
        </View>
      </View>

      {/* Filtres catégories */}
      <View style={styles.filtresWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTRES.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filtrePill, filtre === f.key && styles.filtrePillActive]}
              onPress={() => setFiltre(f.key)}
            >
              <Text style={[styles.filtrePillText, filtre === f.key && styles.filtrePillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Liste articles */}
      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📰</Text>
            <Text style={styles.emptyTitle}>Aucune actualité</Text>
            <Text style={styles.emptySub}>Revenez bientôt pour les dernières infos.</Text>
          </View>
        ) : (
          filtered.map((actu, index) => {
            const cat = CATEGORIE_COLORS[actu.categorie];
            const isFirst = index === 0 && filtre === 'toutes';
            return (
              <TouchableOpacity
                key={actu.id}
                style={[styles.card, isFirst && styles.cardFeatured]}
                onPress={() => router.push({ pathname: '/actualites/[id]', params: { id: actu.id } } as any)}
                activeOpacity={0.88}
              >
                {/* Badge catégorie */}
                <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                  <View style={[styles.catDot, { backgroundColor: cat.dot }]} />
                  <Text style={[styles.catBadgeText, { color: cat.text }]}>
                    {CATEGORIE_EMOJIS[actu.categorie]} {CATEGORIE_LABELS[actu.categorie]}
                  </Text>
                </View>

                <Text style={[styles.titre, isFirst && styles.titreFeatured]} numberOfLines={isFirst ? 3 : 2}>
                  {actu.titre}
                </Text>

                <Text style={styles.resume} numberOfLines={isFirst ? 3 : 2}>
                  {actu.resume}
                </Text>

                <View style={styles.cardFooter}>
                  <Text style={styles.date}>{formatDate(actu.createdAt)}</Text>
                  <View style={styles.lireMore}>
                    <Text style={styles.lireMoreText}>Lire</Text>
                    <Ionicons name="arrow-forward" size={13} color={Colors.primary} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
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
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  filtresWrap: { backgroundColor: Colors.surface, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  filtrePill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1.5, borderColor: Colors.border,
  },
  filtrePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtrePillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filtrePillTextActive: { color: '#fff' },

  scroll: { flex: 1 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 14, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.07)' } as any,
    }),
  },
  cardFeatured: {
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
    ...Platform.select({
      ios: { shadowOpacity: 0.12 },
      android: { elevation: 5 },
    }),
  },

  catBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4,
    marginBottom: 10,
  },
  catDot: { width: 6, height: 6, borderRadius: 3 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },

  titre: { fontSize: 15, fontWeight: '800', color: Colors.text, letterSpacing: -0.2, lineHeight: 21, marginBottom: 6 },
  titreFeatured: { fontSize: 17 },

  resume: { fontSize: 13, color: Colors.textSecondary, lineHeight: 19, marginBottom: 12 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  date: { fontSize: 11, color: Colors.textMuted },
  lireMore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lireMoreText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
});

