import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useAuthContext } from '@/hooks/AuthContext';

type PendingBoost = {
  id: number;
  annonce_id: number;
  eleveur_id: string;
  duration_days: number;
  amount: number;
  payment_method: string;
  payment_ref: string;
  created_at: string;
  annonce_titre?: string;
  eleveur_nom?: string;
  status?: string;
  end_date?: string | null;
};

type PendingSub = {
  id: number;
  user_id: string;
  amount: number;
  payment_method: string;
  payment_ref: string;
  created_at: string;
  user_nom?: string;
  status?: string;
  end_date?: string | null;
};

export default function AdminBoostsScreen() {
  const { user, isAdmin, isLoading: authLoading } = useAuthContext();
  const [boosts, setBoosts] = useState<PendingBoost[]>([]);
  const [subs, setSubs] = useState<PendingSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'boosts' | 'subs'>('boosts');

  const load = useCallback(async () => {
    setLoading(true);

    const [{ data: bData }, { data: sData }] = await Promise.all([
      supabase.from('boosts').select('*').in('status', ['pending', 'active']).order('created_at', { ascending: false }),
      supabase.from('couvoir_subscriptions').select('*').in('status', ['pending', 'active']).order('created_at', { ascending: false }),
    ]);

    // Récupérer les noms des profils séparément
    const eleveurIds = (bData ?? []).map((b: any) => b.eleveur_id);
    const subUserIds = (sData ?? []).map((s: any) => s.user_id);
    const allIds = [...new Set([...eleveurIds, ...subUserIds])].filter(Boolean);

    let profileMap: Record<string, string> = {};
    if (allIds.length > 0) {
      const { data: profiles } = await supabase
        .rpc('get_profiles_by_ids', { ids: allIds });
      if (profiles) {
        profiles.forEach((p: any) => { profileMap[p.id] = `${p.prenom} ${p.nom}`; });
      }
    }

    if (bData) {
      setBoosts(bData.map((r: any) => ({
        ...r,
        annonce_titre: `Annonce #${r.annonce_id}`,
        eleveur_nom: profileMap[r.eleveur_id] ?? r.eleveur_id,
      })));
    }
    if (sData) {
      setSubs(sData.map((r: any) => ({
        ...r,
        user_nom: profileMap[r.user_id] ?? r.user_id,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) load(); }, [isAdmin, load]);
  useEffect(() => { if (!authLoading && !isAdmin) router.replace('/(tabs)' as any); }, [authLoading, isAdmin]);

  if (authLoading || !user || !isAdmin) {
    return <View style={styles.container}><ActivityIndicator color={Colors.primary} style={{ marginTop: 100 }} /></View>;
  }

  const approveBoost = async (b: PendingBoost) => {
    const now = new Date();
    const end = new Date(now);
    end.setDate(end.getDate() + b.duration_days);
    await supabase.from('boosts').update({
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
    }).eq('id', b.id);
    load();
  };

  const rejectBoost = async (id: number) => {
    await supabase.from('boosts').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  const cancelBoost = async (id: number) => {
    await supabase.from('boosts').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  const approveSub = async (s: PendingSub) => {
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    await supabase.from('couvoir_subscriptions').update({
      status: 'active',
      start_date: now.toISOString(),
      end_date: end.toISOString(),
    }).eq('id', s.id);
    load();
  };

  const rejectSub = async (id: number) => {
    await supabase.from('couvoir_subscriptions').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  const cancelSub = async (id: number) => {
    await supabase.from('couvoir_subscriptions').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  const confirm = (action: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(action)) onYes();
    } else {
      Alert.alert('Confirmer', action, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Oui', onPress: onYes },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin')} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validation paiements</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, tab === 'boosts' && styles.tabActive]} onPress={() => setTab('boosts')}>
          <Text style={[styles.tabText, tab === 'boosts' && styles.tabTextActive]}>
            Boosts éleveurs {boosts.length > 0 ? `(${boosts.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'subs' && styles.tabActive]} onPress={() => setTab('subs')}>
          <Text style={[styles.tabText, tab === 'subs' && styles.tabTextActive]}>
            Abonnements {subs.length > 0 ? `(${subs.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.primary} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          {tab === 'boosts' && (
            boosts.length === 0 ? (
              <View style={styles.empty}>
                <Clock size={40} color={Colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyText}>Aucun boost en attente</Text>
              </View>
            ) : (
              boosts.map((b) => (
                <View key={b.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{b.eleveur_nom}</Text>
                    {b.status === 'active' ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>✅ Actif</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>En attente</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardSub} numberOfLines={1}>
                    📢 {b.annonce_titre ?? `Annonce #${b.annonce_id}`}
                  </Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoItem}>⏱ {b.duration_days} jours</Text>
                    <Text style={styles.infoItem}>💰 {b.amount.toLocaleString()} F</Text>
                    <Text style={styles.infoItem}>{b.payment_method === 'wave' ? '🌊' : '🟠'} {b.payment_method}</Text>
                  </View>
                  <View style={styles.refBox}>
                    <Text style={styles.refLabel}>Référence :</Text>
                    <Text style={styles.refVal}>{b.payment_ref}</Text>
                  </View>
                  <View style={styles.actions}>
                    {b.status === 'active' ? (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => confirm('Annuler ce boost actif ?', () => cancelBoost(b.id))}
                      >
                        <XCircle size={16} color="#fff" strokeWidth={1.8} />
                        <Text style={styles.cancelBtnText}>Annuler le boost</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => confirm('Rejeter ce boost ?', () => rejectBoost(b.id))}
                        >
                          <XCircle size={16} color={Colors.error} strokeWidth={1.8} />
                          <Text style={styles.rejectBtnText}>Rejeter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => confirm(`Activer le boost ${b.duration_days}j pour ${b.eleveur_nom} ?`, () => approveBoost(b))}
                        >
                          <CheckCircle size={16} color="#fff" strokeWidth={1.8} />
                          <Text style={styles.approveBtnText}>Valider</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            )
          )}

          {tab === 'subs' && (
            subs.length === 0 ? (
              <View style={styles.empty}>
                <Clock size={40} color={Colors.textMuted} strokeWidth={1.5} />
                <Text style={styles.emptyText}>Aucun abonnement en attente</Text>
              </View>
            ) : (
              subs.map((s) => (
                <View key={s.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName}>{s.user_nom}</Text>
                    {s.status === 'active' ? (
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>✅ Actif</Text>
                      </View>
                    ) : (
                      <View style={styles.pendingBadge}>
                        <Text style={styles.pendingBadgeText}>En attente</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.cardSub}>Abonnement partenaire certifié</Text>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoItem}>💰 {s.amount.toLocaleString()} F/mois</Text>
                    <Text style={styles.infoItem}>{s.payment_method === 'wave' ? '🌊' : '🟠'} {s.payment_method}</Text>
                  </View>
                  <View style={styles.refBox}>
                    <Text style={styles.refLabel}>Référence :</Text>
                    <Text style={styles.refVal}>{s.payment_ref}</Text>
                  </View>
                  <View style={styles.actions}>
                    {s.status === 'active' ? (
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => confirm(`Annuler l'abonnement de ${s.user_nom} ?`, () => cancelSub(s.id))}
                      >
                        <XCircle size={16} color="#fff" strokeWidth={1.8} />
                        <Text style={styles.cancelBtnText}>Annuler l'abonnement</Text>
                      </TouchableOpacity>
                    ) : (
                      <>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => confirm('Rejeter cet abonnement ?', () => rejectSub(s.id))}
                        >
                          <XCircle size={16} color={Colors.error} strokeWidth={1.8} />
                          <Text style={styles.rejectBtnText}>Rejeter</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => confirm(`Activer l'abonnement pour ${s.user_nom} (30 jours) ?`, () => approveSub(s))}
                        >
                          <CheckCircle size={16} color="#fff" strokeWidth={1.8} />
                          <Text style={styles.approveBtnText}>Valider</Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            )
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', gap: 12,
  },
  backBtn: { marginBottom: 2 },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 20, fontFamily: Fonts.bodyBold, color: '#fff' },

  tabRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  tabText: { fontSize: 13.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  tabTextActive: { fontFamily: Fonts.bodyBold, color: Colors.primary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 14 },
  emptyText: { fontSize: 15, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardName: { fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  pendingBadge: {
    backgroundColor: '#FFF3CD', borderRadius: Radius.pill,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  pendingBadgeText: { fontSize: 10.5, fontFamily: Fonts.bodyBold, color: '#856404' },
  cardSub: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 10 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  infoItem: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },
  refBox: {
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.sm, padding: 10,
    marginBottom: 12,
  },
  refLabel: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.textMuted, marginBottom: 2 },
  refVal: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.text },
  actions: { flexDirection: 'row', gap: 10 },
  rejectBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderColor: Colors.error, borderRadius: Radius.pill, paddingVertical: 11,
  },
  rejectBtnText: { color: Colors.error, fontSize: 13.5, fontFamily: Fonts.bodyBold },
  approveBtn: {
    flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.pill, paddingVertical: 11,
    ...(Shadows.button as object),
  },
  approveBtnText: { color: '#fff', fontSize: 13.5, fontFamily: Fonts.bodyBold },
  activeBadge: {
    backgroundColor: '#D1FAE5', borderRadius: Radius.pill,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  activeBadgeText: { fontSize: 10.5, fontFamily: Fonts.bodyBold, color: '#065F46' },
  cancelBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.error, borderRadius: Radius.pill, paddingVertical: 11,
  },
  cancelBtnText: { color: '#fff', fontSize: 13.5, fontFamily: Fonts.bodyBold },
});
