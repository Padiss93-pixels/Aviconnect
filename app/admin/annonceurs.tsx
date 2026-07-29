import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Share, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Colors, Fonts, Radius } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';
import { supabase } from '@/lib/supabase';

// Kit média AviConnect — tout ce qu'un annonceur demande avant d'acheter un
// espace : audience réelle, profil de cette audience, engagement, inventaire
// publicitaire disponible et tarifs. Tous les chiffres sont calculés depuis
// Supabase, aucun n'est saisi à la main : un annonceur peut les auditer.

type MediaKit = {
  users: number;
  usersByRole: { role: string; count: number }[];
  usersByRegion: { region: string; count: number }[];
  newUsers30j: number;
  notifiables: number;
  sessions7j: number;
  uniques7j: number;
  sessions30j: number;
  uniques30j: number;
  annonces: number;
  commandes30j: number;
  bannersActives: number;
  marchesActives: number;
};

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveurs', acheteur: 'Acheteurs', couvoir: 'Couvoirs',
  veterinaire: 'Vétérinaires', admin: 'Administrateurs',
};
const ROLE_EMOJIS: Record<string, string> = {
  eleveur: '🐔', acheteur: '🛒', couvoir: '🏭', veterinaire: '💉', admin: '🔐',
};

// Inventaire publicitaire réellement disponible dans l'app.
// Les emplacements correspondent aux tables `pub_banners` et `pub_marches`
// et à l'écran Actualités.
const FORMATS = [
  {
    emoji: '🎠',
    nom: 'Bannière carrousel — Accueil',
    emplacement: "Haut de l'écran d'accueil, vue par tout utilisateur à chaque ouverture",
    specs: 'Image 1200 × 600 px (ratio 2:1), JPG ou PNG, < 500 Ko. Titre 40 caractères max, sous-titre 70 caractères max. Couleur de fond et couleur d’accent personnalisables.',
    lien: 'Lien cliquable : appel téléphonique, WhatsApp ou site web',
    tarif: '25 000 F CFA / mois',
  },
  {
    emoji: '🏪',
    nom: 'Encart Marché',
    emplacement: "Intégré au flux de l'onglet Marché, entre les annonces",
    specs: 'Image 800 × 800 px (carré), JPG ou PNG, < 300 Ko. Emoji, titre 30 caractères, description 90 caractères.',
    lien: 'Lien cliquable : appel téléphonique, WhatsApp ou site web',
    tarif: '15 000 F CFA / mois',
  },
  {
    emoji: '📰',
    nom: 'Article sponsorisé — Actualités',
    emplacement: "Onglet Actualités, mis en avant en tête de liste",
    specs: 'Titre, résumé de 160 caractères, contenu libre. Mention « Contenu sponsorisé » obligatoire (règle des stores et loi n°2008-08 sur la publicité en ligne).',
    lien: 'Liens et numéros de contact intégrés au corps de l’article',
    tarif: '20 000 F CFA / publication',
  },
  {
    emoji: '🔔',
    nom: 'Notification push sponsorisée',
    emplacement: 'Notification envoyée aux utilisateurs ayant accepté les notifications',
    specs: 'Titre 50 caractères, message 120 caractères. Une seule notification sponsorisée par semaine maximum, pour ne pas provoquer de désinstallations.',
    lien: 'Ouvre une page de l’app ou un lien externe',
    tarif: '30 000 F CFA / envoi',
  },
];

// Offres destinées aux vendeurs de la plateforme (déjà en production).
const OFFRES_VENDEURS = [
  { nom: 'Boost d’annonce — 7 jours', prix: '1 000 F CFA' },
  { nom: 'Boost d’annonce — 15 jours', prix: '1 500 F CFA' },
  { nom: 'Boost d’annonce — 30 jours', prix: '2 500 F CFA' },
  { nom: 'Abonnement couvoir certifié', prix: '25 000 F CFA / an' },
];

export default function AdminAnnonceurs() {
  const { user, isAdmin, isLoading } = useAuthContext();
  const [kit, setKit] = useState<MediaKit | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const now = new Date();
    const j7 = new Date(now); j7.setDate(now.getDate() - 7);
    const j30 = new Date(now); j30.setDate(now.getDate() - 30);

    const [profilesRes, visits7Res, visits30Res, annoncesRes, ordersRes, bannersRes, marchesRes] =
      await Promise.all([
        supabase.from('profiles').select('role, region, created_at, push_token'),
        supabase.from('app_visits').select('user_id', { count: 'exact' }).gte('created_at', j7.toISOString()),
        supabase.from('app_visits').select('user_id', { count: 'exact' }).gte('created_at', j30.toISOString()),
        supabase.from('annonces').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', j30.toISOString()),
        supabase.from('pub_banners').select('id, actif'),
        supabase.from('pub_marches').select('id, actif'),
      ]);

    // Même source que les statistiques d'audience : si app_visits manque, les
    // compteurs de visites tombent à 0 sans rien dire.
    const visitsErr = visits7Res.error ?? visits30Res.error;
    if (visitsErr) console.error('[AviConnect] app_visits query error:', visitsErr.message);

    const profiles = profilesRes.data ?? [];
    const tally = (rows: any[], key: string) => {
      const m: Record<string, number> = {};
      rows.forEach((r) => {
        const v = r[key] ?? 'Non renseigné';
        m[v] = (m[v] ?? 0) + 1;
      });
      return Object.entries(m).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count);
    };
    const uniq = (rows: { user_id: string | null }[] | null) =>
      new Set((rows ?? []).map((r) => r.user_id).filter(Boolean)).size;

    setKit({
      users: profiles.length,
      usersByRole: tally(profiles, 'role').map(({ k, count }) => ({ role: k, count })),
      usersByRegion: tally(profiles, 'region').map(({ k, count }) => ({ region: k, count })),
      newUsers30j: profiles.filter((p: any) => p.created_at && new Date(p.created_at) >= j30).length,
      notifiables: profiles.filter((p: any) => !!p.push_token).length,
      sessions7j: visits7Res.count ?? 0,
      uniques7j: uniq(visits7Res.data),
      sessions30j: visits30Res.count ?? 0,
      uniques30j: uniq(visits30Res.data),
      annonces: annoncesRes.count ?? 0,
      commandes30j: ordersRes.count ?? 0,
      bannersActives: (bannersRes.data ?? []).filter((b: any) => b.actif).length,
      marchesActives: (marchesRes.data ?? []).filter((m: any) => m.actif).length,
    });
    setLoading(false);
  }, []);

  useEffect(() => { if (!isLoading && isAdmin) load(); }, [isLoading, isAdmin, load]);
  useEffect(() => { if (!isLoading && !isAdmin) router.replace('/(tabs)' as any); }, [isLoading, isAdmin]);

  if (isLoading || !user || !isAdmin) {
    return <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  // Texte prêt à envoyer par WhatsApp ou e-mail à un annonceur.
  const buildKitText = (k: MediaKit) => {
    const date = new Date().toLocaleDateString('fr-FR');
    const roles = k.usersByRole
      .filter((r) => r.role !== 'admin')
      .map((r) => `   - ${ROLE_LABELS[r.role] ?? r.role} : ${r.count}`)
      .join('\n');
    const regions = k.usersByRegion.slice(0, 5)
      .map((r) => `   - ${r.region} : ${r.count}`)
      .join('\n');
    const formats = FORMATS
      .map((f) => `${f.emoji} ${f.nom} — ${f.tarif}\n   Emplacement : ${f.emplacement}\n   Format : ${f.specs}`)
      .join('\n\n');

    return [
      `KIT MÉDIA — AVICONNECT SÉNÉGAL`,
      `Données arrêtées au ${date}`,
      ``,
      `AviConnect est la marketplace de la filière avicole sénégalaise : elle met en relation éleveurs, acheteurs, couvoirs et vétérinaires dans les 14 régions du pays.`,
      ``,
      `AUDIENCE`,
      `- Comptes inscrits : ${k.users}`,
      `- Nouveaux comptes sur 30 jours : ${k.newUsers30j}`,
      `- Visiteurs uniques sur 30 jours : ${k.uniques30j} (${k.sessions30j} sessions)`,
      `- Visiteurs uniques sur 7 jours : ${k.uniques7j} (${k.sessions7j} sessions)`,
      `- Utilisateurs joignables par notification : ${k.notifiables}`,
      ``,
      `PROFIL DE L'AUDIENCE`,
      roles,
      ``,
      `PRINCIPALES RÉGIONS`,
      regions,
      ``,
      `ACTIVITÉ SUR LA PLATEFORME`,
      `- Annonces publiées : ${k.annonces}`,
      `- Commandes passées sur 30 jours : ${k.commandes30j}`,
      ``,
      `ESPACES PUBLICITAIRES`,
      ``,
      formats,
      ``,
      `CONTACT`,
      `contact@aviconnect.sn`,
    ].join('\n');
  };

  const shareKit = async () => {
    if (!kit) return;
    const text = buildKitText(kit);
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        window.alert('Kit média copié dans le presse-papiers.');
      } catch {
        window.alert(text);
      }
      return;
    }
    try {
      await Share.share({ message: text, title: 'Kit média AviConnect' });
    } catch {
      Alert.alert('Partage impossible', 'Réessayez depuis un autre canal.');
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin' as any)} hitSlop={12}>
          <Text style={s.back}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerTitle}>Espace annonceurs</Text>
          <Text style={s.headerSub}>Kit média</Text>
        </View>
        <TouchableOpacity onPress={load} hitSlop={12}>
          <Text style={s.refresh}>↻</Text>
        </TouchableOpacity>
      </View>

      {loading || !kit ? (
        <View style={s.center}><ActivityIndicator color={Colors.primary} size="large" /></View>
      ) : (
        <ScrollView contentContainerStyle={s.scroll}>

          <View style={s.intro}>
            <Text style={s.introText}>
              Toutes les données ci-dessous sont calculées en direct depuis la base AviConnect.
              Elles peuvent être communiquées telles quelles à un annonceur : aucun chiffre n’est estimé.
            </Text>
          </View>

          {/* ── Audience ── */}
          <Text style={s.sectionTitle}>Audience</Text>
          <View style={s.kpiGrid}>
            <Kpi label="Comptes inscrits" value={kit.users} />
            <Kpi label="Nouveaux (30 j)" value={kit.newUsers30j} accent />
            <Kpi label="Uniques (30 j)" value={kit.uniques30j} />
            <Kpi label="Uniques (7 j)" value={kit.uniques7j} />
            <Kpi label="Sessions (30 j)" value={kit.sessions30j} />
            <Kpi label="Joignables par push" value={kit.notifiables} />
          </View>

          {/* ── Profil de l'audience ── */}
          <Text style={s.sectionTitle}>Profil de l’audience</Text>
          <View style={s.card}>
            {kit.usersByRole.filter((r) => r.role !== 'admin').map(({ role, count }) => {
              const pct = kit.users > 0 ? Math.round((count / kit.users) * 100) : 0;
              return (
                <View key={role} style={s.row}>
                  <Text style={s.rowEmoji}>{ROLE_EMOJIS[role] ?? '👤'}</Text>
                  <Text style={s.rowLabel}>{ROLE_LABELS[role] ?? role}</Text>
                  <View style={s.barTrack}><View style={[s.barFill, { width: `${pct}%` }]} /></View>
                  <Text style={s.rowValue}>{count}</Text>
                  <Text style={s.rowPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>

          {/* ── Régions ── */}
          <Text style={s.sectionTitle}>Couverture géographique</Text>
          <View style={s.card}>
            {kit.usersByRegion.slice(0, 8).map(({ region, count }) => {
              const pct = kit.users > 0 ? Math.round((count / kit.users) * 100) : 0;
              return (
                <View key={region} style={s.row}>
                  <Text style={s.rowEmoji}>📍</Text>
                  <Text style={s.rowLabel}>{region}</Text>
                  <View style={s.barTrack}><View style={[s.barFill, { width: `${pct}%` }]} /></View>
                  <Text style={s.rowValue}>{count}</Text>
                  <Text style={s.rowPct}>{pct}%</Text>
                </View>
              );
            })}
          </View>

          {/* ── Activité ── */}
          <Text style={s.sectionTitle}>Activité de la plateforme</Text>
          <View style={s.kpiGrid}>
            <Kpi label="Annonces publiées" value={kit.annonces} />
            <Kpi label="Commandes (30 j)" value={kit.commandes30j} />
            <Kpi label="Bannières actives" value={kit.bannersActives} />
            <Kpi label="Encarts marché actifs" value={kit.marchesActives} />
          </View>

          {/* ── Inventaire publicitaire ── */}
          <Text style={s.sectionTitle}>Espaces publicitaires disponibles</Text>
          {FORMATS.map((f) => (
            <View key={f.nom} style={s.formatCard}>
              <View style={s.formatTop}>
                <Text style={s.formatEmoji}>{f.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.formatNom}>{f.nom}</Text>
                  <Text style={s.formatEmplacement}>{f.emplacement}</Text>
                </View>
                <View style={s.tarifChip}><Text style={s.tarifText}>{f.tarif}</Text></View>
              </View>
              <Text style={s.formatSpecs}>{f.specs}</Text>
              <Text style={s.formatLien}>{f.lien}</Text>
            </View>
          ))}

          {/* ── Offres vendeurs ── */}
          <Text style={s.sectionTitle}>Offres payantes destinées aux vendeurs</Text>
          <View style={s.card}>
            {OFFRES_VENDEURS.map((o) => (
              <View key={o.nom} style={s.offreRow}>
                <Text style={s.offreNom}>{o.nom}</Text>
                <Text style={s.offrePrix}>{o.prix}</Text>
              </View>
            ))}
          </View>

          {/* ── Règles à respecter ── */}
          <Text style={s.sectionTitle}>Règles à respecter</Text>
          <View style={s.warnCard}>
            <Text style={s.warnLine}>
              • Tout contenu sponsorisé doit être identifié comme tel (loi n°2008-08 sur les transactions
              électroniques, et règles Apple 3.2.2 / Google Play sur la publicité trompeuse).
            </Text>
            <Text style={s.warnLine}>
              • Aucune publicité pour des produits vétérinaires soumis à ordonnance sans justificatif d’autorisation.
            </Text>
            <Text style={s.warnLine}>
              • Les données personnelles des utilisateurs ne sont jamais transmises à l’annonceur :
              seules les statistiques agrégées de cette page sont communicables (loi n°2008-12, CDP).
            </Text>
          </View>

          <TouchableOpacity style={s.shareBtn} onPress={shareKit} activeOpacity={0.85}>
            <Text style={s.shareBtnText}>
              {Platform.OS === 'web' ? 'Copier le kit média' : 'Partager le kit média'}
            </Text>
          </TouchableOpacity>
          <Text style={s.shareHint}>
            Génère un document texte prêt à envoyer par WhatsApp ou e-mail à un annonceur.
          </Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

function Kpi({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={[s.kpi, accent && s.kpiAccent]}>
      <Text style={[s.kpiValue, accent && { color: '#fff' }]}>{value.toLocaleString('fr-FR')}</Text>
      <Text style={[s.kpiLabel, accent && { color: '#d1fae5' }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
  },
  back: { color: '#fff', fontSize: 24, fontWeight: '300' },
  refresh: { color: '#fff', fontSize: 22, fontWeight: '300' },
  headerTitle: { fontSize: 17, fontFamily: Fonts.bodyBold, color: '#fff' },
  headerSub: { fontSize: 11.5, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { padding: 16 },

  intro: {
    backgroundColor: '#f0fdf4', borderRadius: Radius.md, padding: 13, marginBottom: 18,
    borderLeftWidth: 3, borderLeftColor: Colors.primary,
  },
  introText: { fontSize: 12.5, fontFamily: Fonts.body, color: Colors.primaryDark, lineHeight: 19 },

  sectionTitle: {
    fontSize: 11.5, fontFamily: Fonts.bodyBold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10, marginTop: 6,
  },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  kpi: {
    width: '31.5%', backgroundColor: Colors.surface, borderRadius: Radius.md,
    paddingVertical: 14, paddingHorizontal: 8, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  kpiAccent: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  kpiValue: { fontSize: 21, fontFamily: Fonts.bodyExtraBold, color: Colors.primaryDark },
  kpiLabel: { fontSize: 10, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 3, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  rowEmoji: { fontSize: 15, width: 20 },
  rowLabel: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.text, width: 92 },
  barTrack: { flex: 1, height: 8, backgroundColor: Colors.borderSoft, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  rowValue: { fontSize: 12.5, fontFamily: Fonts.bodyBold, color: Colors.text, width: 34, textAlign: 'right' },
  rowPct: { fontSize: 11, fontFamily: Fonts.body, color: Colors.textMuted, width: 34, textAlign: 'right' },

  formatCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.borderSoft,
  },
  formatTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, marginBottom: 10 },
  formatEmoji: { fontSize: 24 },
  formatNom: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.text },
  formatEmplacement: { fontSize: 11.5, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 3, lineHeight: 17 },
  tarifChip: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.sm,
    paddingHorizontal: 9, paddingVertical: 5,
  },
  tarifText: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },
  formatSpecs: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textSecondary, lineHeight: 18 },
  formatLien: { fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textTertiary, marginTop: 6 },

  offreRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 9,
  },
  offreNom: { fontSize: 13, fontFamily: Fonts.body, color: Colors.text, flex: 1 },
  offrePrix: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.primaryDark },

  warnCard: {
    backgroundColor: '#fffbeb', borderRadius: Radius.md, padding: 13, marginBottom: 22,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  warnLine: { fontSize: 12, fontFamily: Fonts.body, color: '#92400e', lineHeight: 18, marginBottom: 7 },

  shareBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 15, alignItems: 'center',
  },
  shareBtnText: { color: '#fff', fontSize: 15, fontFamily: Fonts.bodyBold },
  shareHint: {
    fontSize: 11.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 10, lineHeight: 17,
  },
});
