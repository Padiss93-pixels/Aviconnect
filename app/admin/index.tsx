import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, Alert, TextInput, ActivityIndicator, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { type User } from '@/hooks/useAuth';

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur',
  acheteur: 'Acheteur',
  couvoir: 'Couvoir',
  veterinaire: 'Vétérinaire',
  admin: 'Admin',
};
const ROLE_EMOJIS: Record<string, string> = {
  eleveur: '🐔', acheteur: '🛒', couvoir: '🏭', veterinaire: '💉', admin: '🔐',
};
const ROLE_BG: Record<string, string> = {
  eleveur: '#dcfce7', acheteur: '#dbeafe', couvoir: '#fef9c3', veterinaire: '#ccfbf1', admin: '#f3e8ff',
};
const ROLE_COLOR: Record<string, string> = {
  eleveur: '#166534', acheteur: '#1e40af', couvoir: '#854d0e', veterinaire: '#0f766e', admin: '#6b21a8',
};

type RoleFilter = 'tous' | 'eleveur' | 'acheteur' | 'couvoir' | 'veterinaire' | 'bloques';

function ProfileModal({ u, currentUser, onClose, onBlock, onUnblock, onDelete }: {
  u: User;
  currentUser: User;
  onClose: () => void;
  onBlock: (u: User) => void;
  onUnblock: (u: User) => void;
  onDelete: (u: User) => void;
}) {
  const isMe = u.id === currentUser.id || u.role === 'admin';
  const initials = `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={modal.overlay}>
        <View style={modal.sheet}>
          {/* Handle */}
          <View style={modal.handle} />

          {/* Header */}
          <View style={modal.header}>
            <Text style={modal.headerTitle}>Profil utilisateur</Text>
            <TouchableOpacity onPress={onClose} style={modal.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Avatar + nom */}
            <View style={modal.profileTop}>
              <View style={[modal.avatar, { backgroundColor: ROLE_BG[u.role] || '#f3f4f6' }]}>
                <Text style={[modal.avatarText, { color: ROLE_COLOR[u.role] || Colors.text }]}>{initials}</Text>
              </View>
              <Text style={modal.profileName}>{u.prenom} {u.nom}</Text>
              <View style={[modal.rolePill, { backgroundColor: ROLE_BG[u.role] || '#f3f4f6' }]}>
                <Text style={[modal.rolePillText, { color: ROLE_COLOR[u.role] || Colors.text }]}>
                  {ROLE_EMOJIS[u.role]} {ROLE_LABELS[u.role] || u.role}
                </Text>
              </View>
              {u.blocked && (
                <View style={modal.blockedBanner}>
                  <Text style={modal.blockedBannerText}>🚫 Compte bloqué</Text>
                </View>
              )}
            </View>

            {/* Infos */}
            <View style={modal.infoSection}>
              <Text style={modal.infoSectionTitle}>Informations</Text>
              {[
                { icon: 'call-outline', label: 'Téléphone', val: `+221 ${u.phone}` },
                u.email ? { icon: 'mail-outline', label: 'Email', val: u.email } : null,
                { icon: 'location-outline', label: 'Région', val: u.region },
                u.ferme ? { icon: 'home-outline', label: u.role === 'veterinaire' ? 'Cabinet' : 'Ferme / Établissement', val: u.ferme } : null,
              ].filter(Boolean).map((item: any) => (
                <View key={item.label} style={modal.infoRow}>
                  <Ionicons name={item.icon as any} size={18} color={Colors.textMuted} style={{ width: 24 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={modal.infoLabel}>{item.label}</Text>
                    <Text style={modal.infoVal}>{item.val}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Statut certification */}
            {(u.role === 'couvoir' || u.role === 'veterinaire') && (
              <View style={modal.infoSection}>
                <Text style={modal.infoSectionTitle}>Certification</Text>
                <View style={modal.infoRow}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={Colors.textMuted} style={{ width: 24 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={modal.infoLabel}>Statut</Text>
                    <Text style={[modal.infoVal, {
                      color: (u.couvoirStatus || u.vetStatus) === 'certified' ? '#166534'
                        : (u.couvoirStatus || u.vetStatus) === 'rejected' ? Colors.error
                        : '#854d0e'
                    }]}>
                      {(u.couvoirStatus || u.vetStatus) === 'certified' ? '✅ Certifié'
                        : (u.couvoirStatus || u.vetStatus) === 'rejected' ? '❌ Refusé'
                        : '⏳ En attente de validation'}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ID technique */}
            <View style={modal.infoSection}>
              <Text style={modal.infoSectionTitle}>Technique</Text>
              <View style={modal.infoRow}>
                <Ionicons name="finger-print-outline" size={18} color={Colors.textMuted} style={{ width: 24 }} />
                <View style={{ flex: 1 }}>
                  <Text style={modal.infoLabel}>ID compte</Text>
                  <Text style={[modal.infoVal, { fontSize: 11, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }]}>{u.id}</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            {!isMe && (
              <View style={modal.actionsSection}>
                {u.blocked ? (
                  <TouchableOpacity style={[modal.actionBtn, modal.actionBtnGreen]} onPress={() => onUnblock(u)}>
                    <Ionicons name="checkmark-circle" size={20} color="#166534" />
                    <Text style={[modal.actionBtnText, { color: '#166534' }]}>Débloquer le compte</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[modal.actionBtn, modal.actionBtnOrange]} onPress={() => onBlock(u)}>
                    <Ionicons name="ban" size={20} color="#b45309" />
                    <Text style={[modal.actionBtnText, { color: '#b45309' }]}>Bloquer le compte</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[modal.actionBtn, modal.actionBtnRed]} onPress={() => onDelete(u)}>
                  <Ionicons name="trash" size={20} color="#be123c" />
                  <Text style={[modal.actionBtnText, { color: '#be123c' }]}>Supprimer définitivement</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AdminPanel() {
  const { user, isAdmin, isLoading: authLoading, blockUser, unblockUser, deleteUser, getAllUsers } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<RoleFilter>('tous');
  const [selected, setSelected] = useState<User | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const all = await getAllUsers();
    setUsers(all);
    setLoading(false);
  }, [getAllUsers]);

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin, loadUsers]);
  useEffect(() => { if (!authLoading && !isAdmin) router.replace('/(tabs)' as any); }, [authLoading, isAdmin]);

  if (authLoading || !user || !isAdmin) {
    return <View style={styles.denied}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  }

  const handleBlock = async (u: User) => {
    const doBlock = async () => { await blockUser(u.id); setSelected(null); await loadUsers(); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Bloquer ${u.prenom} ${u.nom} ?`)) await doBlock();
    } else {
      Alert.alert('Bloquer ?', `${u.prenom} ${u.nom} ne pourra plus se connecter.`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Bloquer', style: 'destructive', onPress: doBlock },
      ]);
    }
  };

  const handleUnblock = async (u: User) => {
    await unblockUser(u.id);
    setSelected(null);
    await loadUsers();
  };

  const handleDelete = async (u: User) => {
    const doDelete = async () => { await deleteUser(u.id); setSelected(null); await loadUsers(); };
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer définitivement ${u.prenom} ${u.nom} ? Action irréversible.`)) await doDelete();
    } else {
      Alert.alert('Supprimer ce compte ?', `Le compte de ${u.prenom} ${u.nom} sera supprimé définitivement.`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const counts = {
    total: users.length,
    eleveur: users.filter((u) => u.role === 'eleveur').length,
    acheteur: users.filter((u) => u.role === 'acheteur').length,
    couvoir: users.filter((u) => u.role === 'couvoir').length,
    veterinaire: users.filter((u) => u.role === 'veterinaire').length,
    bloques: users.filter((u) => u.blocked).length,
  };

  const STATS: { key: RoleFilter; label: string; val: number; emoji: string; color: string; bg: string }[] = [
    { key: 'tous', label: 'Total', val: counts.total, emoji: '👥', color: Colors.text, bg: '#f8fafc' },
    { key: 'eleveur', label: 'Éleveurs', val: counts.eleveur, emoji: '🐔', color: '#166534', bg: '#dcfce7' },
    { key: 'acheteur', label: 'Acheteurs', val: counts.acheteur, emoji: '🛒', color: '#1e40af', bg: '#dbeafe' },
    { key: 'couvoir', label: 'Couvoirs', val: counts.couvoir, emoji: '🏭', color: '#854d0e', bg: '#fef9c3' },
    { key: 'veterinaire', label: 'Vétérinaires', val: counts.veterinaire, emoji: '💉', color: '#0f766e', bg: '#ccfbf1' },
    { key: 'bloques', label: 'Bloqués', val: counts.bloques, emoji: '🚫', color: counts.bloques > 0 ? Colors.error : Colors.textMuted, bg: counts.bloques > 0 ? '#fee2e2' : '#f8fafc' },
  ];

  const q = search.toLowerCase().trim();
  const filtered = users.filter((u) => {
    if (filter === 'bloques' && !u.blocked) return false;
    if (filter !== 'tous' && filter !== 'bloques' && u.role !== filter) return false;
    if (q) {
      const full = `${u.prenom} ${u.nom} ${u.email || ''} ${u.phone} ${u.ferme || ''}`.toLowerCase();
      if (!full.includes(q)) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Gestion des utilisateurs</Text>
          <Text style={styles.headerSub}>{counts.total} compte{counts.total > 1 ? 's' : ''} inscrits</Text>
        </View>
        <TouchableOpacity onPress={loadUsers} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Accès rapide */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow}>
        {[
          { label: '📢 Pubs', path: '/admin/pubs', bg: Colors.primaryLight, color: Colors.primaryDark },
          { label: '📰 Actus', path: '/admin/actualites', bg: '#eff6ff', color: '#1e40af' },
          { label: '🏭 Couvoirs', path: '/admin/couvoirs', bg: '#f0fdf4', color: Colors.primaryDark },
          { label: '💉 Vétérinaires', path: '/admin/veterinaires', bg: '#ccfbf1', color: '#0f766e' },
          { label: '🚨 Modération', path: '/admin/moderation', bg: '#fff1f2', color: '#be123c' },
          { label: '⚡ Boosts', path: '/admin/boosts', bg: '#FFFBF0', color: '#92600A' },
          { label: '📊 Annonceurs', path: '/admin/annonceurs', bg: '#F5F3FF', color: '#5B21B6' },
        ].map((l) => (
          <TouchableOpacity key={l.path} style={[styles.quickChip, { backgroundColor: l.bg }]} onPress={() => router.push(l.path as any)}>
            <Text style={[styles.quickChipText, { color: l.color }]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Stats cliquables */}
      <View style={styles.statsGrid}>
        {STATS.map((s) => (
          <TouchableOpacity
            key={s.key}
            style={[styles.statCard, { backgroundColor: s.bg }, filter === s.key && styles.statCardActive]}
            onPress={() => setFilter(s.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.statEmoji}>{s.emoji}</Text>
            <Text style={[styles.statNum, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
            {filter === s.key && <View style={[styles.statActiveBar, { backgroundColor: s.color }]} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Recherche */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher par nom, email, téléphone..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')} style={styles.searchClear}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>👤</Text>
          <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
          {filter !== 'tous' && (
            <TouchableOpacity onPress={() => setFilter('tous')} style={styles.resetBtn}>
              <Text style={styles.resetBtnText}>Voir tous les utilisateurs</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.listContent}>
          <Text style={styles.resultCount}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</Text>
          <View style={styles.cardsGrid}>
            {filtered.map((u) => (
              <TouchableOpacity
                key={u.id}
                style={[styles.card, u.blocked && styles.cardBlocked]}
                onPress={() => setSelected(u)}
                activeOpacity={0.8}
              >
                <View style={styles.cardInner}>
                  <View style={[styles.avatar, { backgroundColor: ROLE_BG[u.role] || '#f3f4f6' }]}>
                    <Text style={[styles.avatarText, { color: ROLE_COLOR[u.role] || Colors.text }]}>
                      {u.prenom.charAt(0)}{u.nom.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.cardName}>{u.prenom} {u.nom}</Text>
                    <View style={[styles.rolePill, { backgroundColor: ROLE_BG[u.role] || '#f3f4f6' }]}>
                      <Text style={[styles.rolePillText, { color: ROLE_COLOR[u.role] || Colors.text }]}>
                        {ROLE_EMOJIS[u.role]} {ROLE_LABELS[u.role] || u.role}
                      </Text>
                    </View>
                    <Text style={styles.cardSub} numberOfLines={1}>📱 +221 {u.phone}</Text>
                    {u.email ? <Text style={styles.cardSub} numberOfLines={1}>✉️ {u.email}</Text> : null}
                    <Text style={styles.cardSub}>📍 {u.region}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    {u.blocked && (
                      <View style={styles.blockedDot} />
                    )}
                    <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      {selected && (
        <ProfileModal
          u={selected}
          currentUser={user}
          onClose={() => setSelected(null)}
          onBlock={handleBlock}
          onUnblock={handleUnblock}
          onDelete={handleDelete}
        />
      )}
    </View>
  );
}

const isWide = Platform.OS === 'web';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  headerTitle: { fontSize: 19, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  refreshBtn: { padding: 4 },

  quickRow: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  quickChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
  },
  quickChipText: { fontSize: 13, fontWeight: '700' },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingBottom: 12, gap: 10,
  },
  statCard: {
    borderRadius: 16, padding: 14, alignItems: 'center',
    minWidth: 90, flexGrow: 1,
    width: isWide ? 130 : '30%',
    position: 'relative', overflow: 'hidden',
  },
  statCardActive: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 6 },
      android: { elevation: 4 },
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } as any,
    }),
  },
  statActiveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: 2 },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 2, textAlign: 'center', fontWeight: '600' },

  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: Colors.text },
  searchClear: { padding: 4 },

  listContent: { padding: 16, paddingBottom: 80 },
  resultCount: { fontSize: 12, color: Colors.textMuted, marginBottom: 12, fontWeight: '600' },
  cardsGrid: {
    flexDirection: isWide ? 'row' : 'column',
    flexWrap: isWide ? 'wrap' : undefined,
    gap: 12,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    width: isWide ? 'calc(50% - 6px)' as any : '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
      web: { boxShadow: '0 1px 6px rgba(0,0,0,0.05)' } as any,
    }),
  },
  cardBlocked: { borderColor: '#fca5a5', backgroundColor: '#fff5f5' },
  cardInner: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  avatar: { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800' },
  cardName: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  rolePill: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, marginBottom: 4 },
  rolePillText: { fontSize: 11, fontWeight: '700' },
  cardSub: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
  cardRight: { alignItems: 'center', gap: 6, marginLeft: 8 },
  blockedDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.error },

  denied: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 16, color: Colors.textLight },
  resetBtn: { marginTop: 16, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 },
  resetBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    maxHeight: '90%', paddingHorizontal: 24, paddingBottom: 0,
  },
  handle: { width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  headerTitle: { fontSize: 17, fontWeight: '800', color: Colors.text },
  closeBtn: { padding: 4 },

  profileTop: { alignItems: 'center', paddingVertical: 28, gap: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 28, fontWeight: '900' },
  profileName: { fontSize: 22, fontWeight: '800', color: Colors.text },
  rolePill: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  rolePillText: { fontSize: 14, fontWeight: '700' },
  blockedBanner: { backgroundColor: '#fee2e2', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  blockedBannerText: { color: Colors.error, fontWeight: '700', fontSize: 14 },

  infoSection: { marginBottom: 20 },
  infoSectionTitle: { fontSize: 12, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', gap: 10 },
  infoLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 2 },
  infoVal: { fontSize: 15, fontWeight: '600', color: Colors.text },

  actionsSection: { gap: 12, paddingTop: 8, paddingBottom: 20 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 16, borderWidth: 1.5 },
  actionBtnGreen: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },
  actionBtnOrange: { backgroundColor: '#fffbeb', borderColor: '#fcd34d' },
  actionBtnRed: { backgroundColor: '#fff1f2', borderColor: '#fda4af' },
  actionBtnText: { fontSize: 15, fontWeight: '700', flex: 1 },
});
