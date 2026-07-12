import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform,
  TextInput, KeyboardAvoidingView, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import {
  useActualites,
  CATEGORIE_LABELS, CATEGORIE_COLORS, CATEGORIE_EMOJIS,
  type Categorie,
} from '@/hooks/ActualitesContext';

const CATEGORIES: Categorie[] = ['sante', 'vaccin', 'virus', 'metier', 'marche', 'reglementation', 'conseil'];

export default function AdminActualites() {
  const { user, isAdmin, isLoading: authLoading } = useAuthContext();
  const { actualites, addActualite, deleteActualite } = useActualites();
  const [tab, setTab] = useState<'liste' | 'nouveau'>('liste');
  const [loading, setLoading] = useState(false);

  // Formulaire
  const [titre, setTitre] = useState('');
  const [resume, setResume] = useState('');
  const [contenu, setContenu] = useState('');
  const [categorie, setCategorie] = useState<Categorie>('sante');

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [authLoading, isAdmin]);

  if (authLoading || !user || !isAdmin) {
    return (
      <View style={styles.denied}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const handlePublier = async () => {
    if (!titre.trim() || !resume.trim() || !contenu.trim()) {
      const msg = 'Veuillez remplir le titre, le résumé et le contenu.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Champs manquants', msg);
      return;
    }
    setLoading(true);
    await addActualite({
      id: Date.now(),
      titre: titre.trim(),
      resume: resume.trim(),
      contenu: contenu.trim(),
      categorie,
      auteurId: user.id,
      auteurNom: user.prenom + ' ' + user.nom,
      createdAt: new Date().toISOString().slice(0, 10),
    });
    setLoading(false);
    setTitre(''); setResume(''); setContenu('');
    setTab('liste');
  };

  const handleDelete = (id: number, titre: string) => {
    const doDelete = async () => { await deleteActualite(id); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${titre}" ?`)) doDelete();
    } else {
      Alert.alert('Supprimer ?', titre, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Actualités</Text>
          <Text style={styles.headerSub}>{actualites.length} article{actualites.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'liste' && styles.tabActive]} onPress={() => setTab('liste')}>
          <Ionicons name="list-outline" size={16} color={tab === 'liste' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'liste' && styles.tabTextActive]}>Articles ({actualites.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'nouveau' && styles.tabActive]} onPress={() => setTab('nouveau')}>
          <Ionicons name="add-circle-outline" size={16} color={tab === 'nouveau' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'nouveau' && styles.tabTextActive]}>Nouvel article</Text>
        </TouchableOpacity>
      </View>

      {/* ── LISTE ── */}
      {tab === 'liste' && (
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {actualites.length === 0 && (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📰</Text>
              <Text style={styles.emptyTitle}>Aucun article publié</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setTab('nouveau')}>
                <Text style={styles.emptyBtnText}>Créer le premier article</Text>
              </TouchableOpacity>
            </View>
          )}
          {actualites.map((a) => {
            const cat = CATEGORIE_COLORS[a.categorie];
            const isMock = a.auteurId === 'admin' && a.id < 100;
            return (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.catBadge, { backgroundColor: cat.bg }]}>
                    <Text style={[styles.catBadgeText, { color: cat.text }]}>
                      {CATEGORIE_EMOJIS[a.categorie]} {CATEGORIE_LABELS[a.categorie]}
                    </Text>
                  </View>
                  {!isMock && (
                    <TouchableOpacity onPress={() => handleDelete(a.id, a.titre)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
                <Text style={styles.cardTitre} numberOfLines={2}>{a.titre}</Text>
                <Text style={styles.cardResume} numberOfLines={2}>{a.resume}</Text>
                <Text style={styles.cardDate}>{a.createdAt} · {a.auteurNom}</Text>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ── NOUVEAU ── */}
      {tab === 'nouveau' && (
        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Catégorie */}
          <Text style={styles.label}>Catégorie *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {CATEGORIES.map((c) => {
              const col = CATEGORIE_COLORS[c];
              const active = categorie === c;
              return (
                <TouchableOpacity
                  key={c}
                  style={[styles.catPill, { backgroundColor: active ? col.dot : Colors.surfaceSecondary, borderColor: active ? col.dot : Colors.border }]}
                  onPress={() => setCategorie(c)}
                >
                  <Text style={[styles.catPillText, { color: active ? '#fff' : Colors.textSecondary }]}>
                    {CATEGORIE_EMOJIS[c]} {CATEGORIE_LABELS[c]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Titre */}
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            value={titre}
            onChangeText={setTitre}
            placeholder="Ex: Alerte grippe aviaire dans la région de Thiès"
            placeholderTextColor={Colors.textMuted}
          />

          {/* Résumé */}
          <Text style={styles.label}>Résumé * <Text style={styles.labelHint}>(affiché dans la liste)</Text></Text>
          <TextInput
            style={[styles.input, styles.textarea2]}
            value={resume}
            onChangeText={setResume}
            placeholder="Courte description visible dans la liste d'articles (2-3 phrases)"
            placeholderTextColor={Colors.textMuted}
            multiline numberOfLines={3} textAlignVertical="top"
          />

          {/* Contenu */}
          <Text style={styles.label}>Contenu complet * <Text style={styles.labelHint}>(supporte • listes et **titres**)</Text></Text>
          <View style={styles.markdownTips}>
            <Text style={styles.markdownTip}>• Saut de ligne = nouveau paragraphe</Text>
            <Text style={styles.markdownTip}>• **Texte** = titre gras</Text>
            <Text style={styles.markdownTip}>• • Point = liste à puces</Text>
          </View>
          <TextInput
            style={[styles.input, styles.textarea]}
            value={contenu}
            onChangeText={setContenu}
            placeholder={`**Introduction**\nÉcrivez votre article ici...\n\n• Point important 1\n• Point important 2\n\n**Conclusion**\nRésumé et recommandations.`}
            placeholderTextColor={Colors.textMuted}
            multiline numberOfLines={12} textAlignVertical="top"
          />

          <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handlePublier} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="send-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.btnText}>Publier l'article</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  tabs: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 0.5, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 13,
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },

  scroll: { flex: 1, backgroundColor: Colors.background },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 16 },
  emptyBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  catBadge: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4 },
  catBadgeText: { fontSize: 11, fontWeight: '700' },
  cardTitre: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 4, lineHeight: 19 },
  cardResume: { fontSize: 12, color: Colors.textMuted, lineHeight: 17, marginBottom: 8 },
  cardDate: { fontSize: 11, color: Colors.textMuted },

  label: { fontSize: 12, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelHint: { fontSize: 11, color: Colors.textMuted, textTransform: 'none', letterSpacing: 0, fontWeight: '400' },
  catPill: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, marginRight: 8,
  },
  catPillText: { fontSize: 12, fontWeight: '600' },

  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: Colors.text,
    backgroundColor: Colors.surface, marginBottom: 16,
  },
  textarea2: { minHeight: 80 },
  textarea: { minHeight: 220, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  markdownTips: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: 10, padding: 12, marginBottom: 10, gap: 3,
  },
  markdownTip: { fontSize: 11, color: Colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

  btn: {
    backgroundColor: Colors.primary, borderRadius: 14, paddingVertical: 15,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8,
    ...Platform.select({
      ios: { shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
      android: { elevation: 4 },
    }),
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  denied: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deniedEmoji: { fontSize: 56 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16, marginBottom: 16 },
  backBtn2: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtn2Text: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

