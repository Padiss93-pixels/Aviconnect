import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';
import { supabase } from '@/lib/supabase';

type Period = 'jour' | 'semaine' | 'mois';

type DayStat = { date: string; count: number; unique: number };

type Stats = {
  today: { sessions: number; unique: number };
  week: { sessions: number; unique: number };
  month: { sessions: number; unique: number };
  daily: DayStat[];
  byRole: { role: string; count: number }[];
};

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur', acheteur: 'Acheteur', couvoir: 'Couvoir',
  veterinaire: 'Vétérinaire', admin: 'Admin',
};
const ROLE_EMOJIS: Record<string, string> = {
  eleveur: '🐔', acheteur: '🛒', couvoir: '🏭', veterinaire: '💉', admin: '🔐',
};

function fmt(d: string) {
  const dt = new Date(d);
  return `${dt.getDate()}/${dt.getMonth() + 1}`;
}

export default function AdminAnalytics() {
  const { user, isAdmin, isLoading } = useAuthContext();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('semaine');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(now.getDate() - 30);
    const chartStart = new Date(now);
    chartStart.setDate(now.getDate() - (period === 'jour' ? 1 : period === 'semaine' ? 7 : 30));

    const [todayRes, weekRes, monthRes, rawDaily] = await Promise.all([
      supabase.from('app_visits').select('user_id', { count: 'exact' }).gte('created_at', todayStart.toISOString()),
      supabase.from('app_visits').select('user_id', { count: 'exact' }).gte('created_at', weekStart.toISOString()),
      supabase.from('app_visits').select('user_id', { count: 'exact' }).gte('created_at', monthStart.toISOString()),
      supabase.from('app_visits').select('created_at, user_id').gte('created_at', chartStart.toISOString()).order('created_at'),
    ]);

    // Une erreur ici (table absente, RLS) donnerait sinon des compteurs à 0
    // impossibles à distinguer d'une vraie absence de trafic.
    const failed = [todayRes, weekRes, monthRes, rawDaily].find((r) => r.error);
    if (failed?.error) {
      console.error('[AviConnect] app_visits query error:', failed.error.message);
      setError(
        failed.error.code === 'PGRST205' || /schema cache|does not exist/i.test(failed.error.message)
          ? "La table app_visits n'existe pas encore dans Supabase. Exécutez supabase/add_app_visits.sql dans le SQL Editor."
          : failed.error.message,
      );
      setStats(null);
      setLoading(false);
      return;
    }

    // Unique users par période
    const uniq = (rows: { user_id: string | null }[] | null) =>
      new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)).size;

    // Grouper par jour pour le graphique
    const dayMap = new Map<string, { count: number; users: Set<string> }>();
    (rawDaily.data ?? []).forEach((r) => {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      if (!dayMap.has(key)) dayMap.set(key, { count: 0, users: new Set() });
      const d = dayMap.get(key)!;
      d.count++;
      if (r.user_id) d.users.add(r.user_id);
    });

    const daily: DayStat[] = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { count, users }]) => ({ date, count, unique: users.size }));

    // Par rôle (via join profiles)
    const { data: roleData } = await supabase
      .from('app_visits')
      .select('profiles:user_id(role)')
      .gte('created_at', monthStart.toISOString());

    const roleCounts: Record<string, number> = {};
    (roleData ?? []).forEach((r: any) => {
      const role = r.profiles?.role ?? 'inconnu';
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    });
    const byRole = Object.entries(roleCounts)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count);

    setStats({
      today: { sessions: todayRes.count ?? 0, unique: uniq(todayRes.data) },
      week: { sessions: weekRes.count ?? 0, unique: uniq(weekRes.data) },
      month: { sessions: monthRes.count ?? 0, unique: uniq(monthRes.data) },
      daily,
      byRole,
    });
    setLoading(false);
  }, [period]);

  useEffect(() => { if (!isLoading && isAdmin) load(); }, [isLoading, isAdmin, load]);

  useEffect(() => {
    if (!isLoading && !isAdmin) router.replace('/(tabs)' as any);
  }, [isLoading, isAdmin]);

  if (isLoading || !user || !isAdmin) {
    return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const maxBar = stats ? Math.max(...stats.daily.map((d) => d.count), 1) : 1;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} hitSlop={12}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Statistiques d'audience</Text>
        <TouchableOpacity onPress={load} hitSlop={12}>
          <Text style={s.refresh}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : error ? (
        <View style={s.errorBox}>
          <Text style={s.errorEmoji}>📉</Text>
          <Text style={s.errorTitle}>Statistiques indisponibles</Text>
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.errorBtn} onPress={load} activeOpacity={0.85}>
            <Text style={s.errorBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : stats ? (
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Note publicitaire */}
          <View style={s.adNote}>
            <Text style={s.adNoteIcon}>📢</Text>
            <Text style={s.adNoteText}>
              Ces chiffres peuvent être partagés avec vos partenaires publicitaires pour justifier la valeur d'une annonce sur AviConnect.
            </Text>
          </View>

          {/* KPI tiles */}
          <View style={s.kpiRow}>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Aujourd'hui</Text>
              <Text style={s.kpiValue}>{stats.today.sessions}</Text>
              <Text style={s.kpiSub}>{stats.today.unique} uniques</Text>
            </View>
            <View style={[s.kpiCard, s.kpiPrimary]}>
              <Text style={[s.kpiLabel, { color: '#a7f3d0' }]}>Cette semaine</Text>
              <Text style={[s.kpiValue, { color: '#fff' }]}>{stats.week.sessions}</Text>
              <Text style={[s.kpiSub, { color: '#a7f3d0' }]}>{stats.week.unique} uniques</Text>
            </View>
            <View style={s.kpiCard}>
              <Text style={s.kpiLabel}>Ce mois</Text>
              <Text style={s.kpiValue}>{stats.month.sessions}</Text>
              <Text style={s.kpiSub}>{stats.month.unique} uniques</Text>
            </View>
          </View>

          {/* Graphique barres */}
          <View style={s.chartCard}>
            <Text style={s.chartTitle}>Sessions par jour</Text>

            <View style={s.periodTabs}>
              {(['jour', 'semaine', 'mois'] as Period[]).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[s.periodTab, period === p && s.periodTabActive]}
                  onPress={() => setPeriod(p)}
                >
                  <Text style={[s.periodTabText, period === p && s.periodTabTextActive]}>
                    {p === 'jour' ? '24h' : p === 'semaine' ? '7 j' : '30 j'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {stats.daily.length === 0 ? (
              <Text style={s.noData}>Aucune donnée sur cette période</Text>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
                <View style={s.bars}>
                  {stats.daily.map((d) => (
                    <View key={d.date} style={s.barCol}>
                      <Text style={s.barValue}>{d.count}</Text>
                      <View style={s.barTrack}>
                        <View style={[s.barFill, { height: Math.max(4, (d.count / maxBar) * 100) }]} />
                      </View>
                      <Text style={s.barLabel}>{fmt(d.date)}</Text>
                      <Text style={s.barUniq}>{d.unique}u</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </View>

          {/* Par rôle */}
          {stats.byRole.length > 0 && (
            <View style={s.chartCard}>
              <Text style={s.chartTitle}>Audience par type d'utilisateur (30 j)</Text>
              {stats.byRole.map(({ role, count }) => {
                const pct = Math.round((count / stats.month.sessions) * 100);
                return (
                  <View key={role} style={s.roleRow}>
                    <Text style={s.roleEmoji}>{ROLE_EMOJIS[role] ?? '👤'}</Text>
                    <Text style={s.roleLabel}>{ROLE_LABELS[role] ?? role}</Text>
                    <View style={s.roleBarTrack}>
                      <View style={[s.roleBarFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={s.roleCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Résumé pour pub */}
          <View style={s.summaryCard}>
            <Text style={s.summaryTitle}>📋 Fiche audience — AviConnect Sénégal</Text>
            <Text style={s.summaryLine}>• Visites aujourd'hui : <Text style={s.summaryBold}>{stats.today.sessions} sessions ({stats.today.unique} utilisateurs)</Text></Text>
            <Text style={s.summaryLine}>• Visites 7 derniers jours : <Text style={s.summaryBold}>{stats.week.sessions} sessions ({stats.week.unique} utilisateurs)</Text></Text>
            <Text style={s.summaryLine}>• Visites 30 derniers jours : <Text style={s.summaryBold}>{stats.month.sessions} sessions ({stats.month.unique} utilisateurs)</Text></Text>
            <Text style={s.summaryLine}>• Cible : éleveurs, couvoirs, vétérinaires — filière avicole sénégalaise</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  errorBox: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  errorEmoji: { fontSize: 48 },
  errorTitle: { fontSize: 17, fontFamily: Fonts.bodyBold, color: Colors.text, marginTop: 14 },
  errorText: {
    fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, marginTop: 8,
  },
  errorBtn: {
    marginTop: 20, backgroundColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 12,
  },
  errorBtnText: { color: '#fff', fontSize: 14, fontFamily: Fonts.bodyBold },

  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '300' },
  refresh: { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bodyBold, color: '#fff' },
  scroll: { padding: 16 },

  adNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#fffbeb', borderRadius: Radius.md,
    padding: 12, marginBottom: 16,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  adNoteIcon: { fontSize: 18, marginTop: 1 },
  adNoteText: { flex: 1, fontSize: 12, color: '#92400e', lineHeight: 18, fontFamily: Fonts.body },

  kpiRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  kpiCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  kpiPrimary: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kpiLabel: { fontSize: 10, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginBottom: 4 },
  kpiValue: { fontSize: 28, fontFamily: Fonts.bodyExtraBold, color: Colors.primaryDark },
  kpiSub: { fontSize: 11, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },

  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  chartTitle: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 8 },
  noData: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', paddingVertical: 24 },

  periodTabs: { flexDirection: 'row', gap: 6 },
  periodTab: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  periodTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodTabText: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  periodTabTextActive: { color: '#fff', fontFamily: Fonts.bodyBold },

  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingBottom: 4, minHeight: 140 },
  barCol: { alignItems: 'center', width: 36 },
  barValue: { fontSize: 9, fontFamily: Fonts.bodyBold, color: Colors.textMuted, marginBottom: 2 },
  barTrack: { width: 28, height: 100, justifyContent: 'flex-end', backgroundColor: Colors.borderSoft, borderRadius: 4 },
  barFill: { width: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barLabel: { fontSize: 9, color: Colors.textMuted, marginTop: 4, fontFamily: Fonts.body },
  barUniq: { fontSize: 8, color: Colors.textMuted, fontFamily: Fonts.body },

  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  roleEmoji: { fontSize: 16, width: 22 },
  roleLabel: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.text, width: 80 },
  roleBarTrack: { flex: 1, height: 8, backgroundColor: Colors.borderSoft, borderRadius: 4, overflow: 'hidden' },
  roleBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  roleCount: { fontSize: 12, fontFamily: Fonts.bodyBold, color: Colors.text, width: 32, textAlign: 'right' },

  summaryCard: {
    backgroundColor: '#f0fdf4', borderRadius: Radius.lg,
    padding: 16, borderWidth: 1, borderColor: '#bbf7d0',
  },
  summaryTitle: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.primaryDark, marginBottom: 10 },
  summaryLine: { fontSize: 12, fontFamily: Fonts.body, color: Colors.text, marginBottom: 5, lineHeight: 18 },
  summaryBold: { fontFamily: Fonts.bodyBold },
});
