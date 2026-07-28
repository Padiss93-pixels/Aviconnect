import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBesoins } from '@/hooks/BesoinContext';
import { MOTIF_LABELS, type ReportMotif } from '@/hooks/ModerationContext';
import { supabase } from '@/lib/supabase';
import { PRODUCT_LABELS, PRODUCT_EMOJIS } from '@/constants/mockData';

// Signalements remontés par les utilisateurs (table `reports`, voir
// supabase/add_moderation.sql). Le traitement de ces signalements est
// l'exigence de modération d'Apple 1.2 et de Google Play.
type Report = {
  id: number;
  target_type: string;
  target_id: string;
  target_label: string | null;
  motif: ReportMotif;
  details: string | null;
  statut: 'ouvert' | 'traite' | 'rejete';
  created_at: string;
  reported_user_id: string | null;
  reporter: { prenom: string; nom: string } | null;
  reported: { prenom: string; nom: string } | null;
};

export default function AdminModeration() {
  const { user, isAdmin, isLoading: authLoading } = useAuthContext();
  const { annonces, deleteAnnonce } = useAnnonces();
  const { besoins, deleteBesoin } = useBesoins();
  const [tab, setTab] = useState<'signalements' | 'annonces' | 'besoins'>('signalements');
  const [reports, setReports] = useState<Report[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [authLoading, isAdmin]);

  const loadReports = async () => {
    setReportsLoading(true);
    const { data, error } = await supabase
      .from('reports')
      .select('*, reporter:reporter_id(prenom, nom), reported:reported_user_id(prenom, nom)')
      .order('created_at', { ascending: false });
    if (error) console.error('[AviConnect] fetch reports error:', error.message);
    setReports((data as unknown as Report[]) ?? []);
    setReportsLoading(false);
  };

  useEffect(() => { if (isAdmin) loadReports(); }, [isAdmin]);

  const setReportStatut = async (id: number, statut: 'traite' | 'rejete') => {
    const { error } = await supabase
      .from('reports')
      .update({ statut, handled_at: new Date().toISOString(), handled_by: user?.id })
      .eq('id', id);
    if (error) { console.error('[AviConnect] update report error:', error.message); return; }
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, statut } : r)));
  };

  const openReports = reports.filter((r) => r.statut === 'ouvert');

  if (authLoading || !user || !isAdmin) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const handleDeleteAnnonce = (id: number, titre: string) => {
    const doDelete = async () => { await deleteAnnonce(id); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer l'annonce "${titre}" ?`)) doDelete();
    } else {
      Alert.alert('Supprimer cette annonce ?', titre, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const handleDeleteBesoin = (id: number, produit: string, nom: string) => {
    const doDelete = async () => { await deleteBesoin(id); };
    const label = `Besoin de ${produit} — ${nom}`;
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${label}" ?`)) doDelete();
    } else {
      Alert.alert('Supprimer ce besoin ?', label, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Modération</Text>
          <Text style={styles.headerSub}>
            {annonces.length} annonce{annonces.length !== 1 ? 's' : ''} · {besoins.length} besoin{besoins.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'signalements' && styles.tabActive]}
          onPress={() => setTab('signalements')}
        >
          <Ionicons name="flag-outline" size={16} color={tab === 'signalements' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'signalements' && styles.tabTextActive]}>
            Signalements{openReports.length > 0 ? ` (${openReports.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'annonces' && styles.tabActive]}
          onPress={() => setTab('annonces')}
        >
          <Ionicons name="pricetag-outline" size={16} color={tab === 'annonces' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'annonces' && styles.tabTextActive]}>
            Annonces ({annonces.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'besoins' && styles.tabActive]}
          onPress={() => setTab('besoins')}
        >
          <Ionicons name="clipboard-outline" size={16} color={tab === 'besoins' ? Colors.primary : Colors.textMuted} />
          <Text style={[styles.tabText, tab === 'besoins' && styles.tabTextActive]}>
            Besoins ({besoins.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── SIGNALEMENTS ── */}
      {tab === 'signalements' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {reportsLoading ? (
            <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
          ) : reports.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🚩</Text>
              <Text style={styles.emptyText}>Aucun signalement</Text>
            </View>
          ) : (
            reports.map((r) => (
              <View key={r.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>🚩</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitre} numberOfLines={2}>
                      {MOTIF_LABELS[r.motif] ?? r.motif}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {r.target_type} · {r.target_label ?? `#${r.target_id}`}
                    </Text>
                    <Text style={styles.cardAuteur}>
                      signalé par {r.reporter ? `${r.reporter.prenom} ${r.reporter.nom}` : 'un utilisateur'}
                      {r.reported ? ` · auteur : ${r.reported.prenom} ${r.reported.nom}` : ''}
                    </Text>
                  </View>
                  <View style={[styles.statutChip, r.statut !== 'ouvert' && styles.statutChipDone]}>
                    <Text style={[styles.statutText, r.statut !== 'ouvert' && styles.statutTextDone]}>
                      {r.statut === 'ouvert' ? 'à traiter' : r.statut === 'traite' ? 'traité' : 'rejeté'}
                    </Text>
                  </View>
                </View>

                {r.details ? <Text style={styles.detail}>« {r.details} »</Text> : null}

                <View style={styles.infoRow}>
                  {r.target_type === 'annonce' && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push({ pathname: '/lot/[id]', params: { id: r.target_id } })}
                    >
                      <Text style={styles.actionBtnText}>Voir l'annonce</Text>
                    </TouchableOpacity>
                  )}
                  {r.reported_user_id && (
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={() => router.push({ pathname: '/vendeur/[id]', params: { id: r.reported_user_id! } })}
                    >
                      <Text style={styles.actionBtnText}>Voir le profil</Text>
                    </TouchableOpacity>
                  )}
                  {r.statut === 'ouvert' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionBtnPrimary]}
                        onPress={() => setReportStatut(r.id, 'traite')}
                      >
                        <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Marquer traité</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setReportStatut(r.id, 'rejete')}>
                        <Text style={styles.actionBtnText}>Rejeter</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── ANNONCES ── */}
      {tab === 'annonces' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {annonces.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>Aucune annonce publiée</Text>
            </View>
          ) : (
            annonces.map((a) => (
              <View key={a.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{PRODUCT_EMOJIS[a.produit]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitre} numberOfLines={1}>{a.titre}</Text>
                    <Text style={styles.cardMeta}>
                      {PRODUCT_LABELS[a.produit]} · {a.region}
                    </Text>
                    <Text style={styles.cardAuteur}>par {a.eleveur}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteAnnonce(a.id, a.titre)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{a.qte} unités</Text>
                  </View>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{a.prix} FCFA</Text>
                  </View>
                  {a.dispo && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>{a.dispo}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* ── BESOINS ── */}
      {tab === 'besoins' && (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {besoins.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyText}>Aucun besoin publié</Text>
            </View>
          ) : (
            besoins.map((b) => (
              <View key={b.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardEmoji}>{PRODUCT_EMOJIS[b.produit]}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitre} numberOfLines={1}>
                      Besoin : {PRODUCT_LABELS[b.produit]}
                    </Text>
                    <Text style={styles.cardMeta}>{b.region}</Text>
                    <Text style={styles.cardAuteur}>par {b.acheteurNom}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDeleteBesoin(b.id, PRODUCT_LABELS[b.produit], b.acheteurNom)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color={Colors.error} />
                  </TouchableOpacity>
                </View>
                <View style={styles.infoRow}>
                  <View style={styles.chip}>
                    <Text style={styles.chipText}>{b.qte} unités</Text>
                  </View>
                  {b.prixMax && (
                    <View style={styles.chip}>
                      <Text style={styles.chipText}>Max {b.prixMax} FCFA</Text>
                    </View>
                  )}
                  {b.detail && (
                    <Text style={styles.detail} numberOfLines={2}>{b.detail}</Text>
                  )}
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },

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

  scroll: { flex: 1 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 52 },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 16 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 14, marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  cardEmoji: { fontSize: 30 },
  cardTitre: { fontSize: 14, fontWeight: '700', color: Colors.text },
  cardMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardAuteur: { fontSize: 11, color: Colors.textLight, marginTop: 2 },

  deleteBtn: {
    width: 38, height: 38, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff5f5', borderRadius: 12, borderWidth: 1, borderColor: '#fecaca',
  },

  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: Colors.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  detail: { fontSize: 12, color: Colors.textMuted, marginTop: 4, marginBottom: 8, width: '100%', fontStyle: 'italic' },

  statutChip: {
    borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4,
    backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#fecaca',
  },
  statutChipDone: { backgroundColor: Colors.primaryLight, borderColor: Colors.primaryTint },
  statutText: { fontSize: 11, fontWeight: '700', color: Colors.error },
  statutTextDone: { color: Colors.primaryDark },

  actionBtn: {
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
    backgroundColor: Colors.surfaceSecondary,
  },
  actionBtnPrimary: { backgroundColor: Colors.primary },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  actionBtnTextPrimary: { color: '#fff' },
});

