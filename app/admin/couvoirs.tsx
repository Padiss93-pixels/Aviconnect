import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { getAllUsers, type User } from '@/hooks/useAuth';

type CouvoirStatus = 'pending' | 'certified' | 'rejected';

const STATUS_CONFIG: Record<CouvoirStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:   { label: 'En attente',  color: '#92400e', bg: '#fef3c7', icon: 'time-outline' },
  certified: { label: 'Certifié',    color: '#166534', bg: '#dcfce7', icon: 'shield-checkmark' },
  rejected:  { label: 'Refusé',      color: '#991b1b', bg: '#fee2e2', icon: 'close-circle' },
};

const FILTRES: Array<{ key: 'tous' | CouvoirStatus; label: string }> = [
  { key: 'tous',      label: 'Tous' },
  { key: 'pending',   label: '⏳ En attente' },
  { key: 'certified', label: '✅ Certifiés' },
  { key: 'rejected',  label: '❌ Refusés' },
];

export default function AdminCouvoirs() {
  const { user, isAdmin, isLoading: authLoading, updateCouvoirStatus } = useAuthContext();
  const [couvoirs, setCouvoirs] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtre, setFiltre] = useState<'tous' | CouvoirStatus>('pending');
  const [updating, setUpdating] = useState<string | null>(null);

  const loadCouvoirs = useCallback(async () => {
    setLoading(true);
    const users = await getAllUsers();
    setCouvoirs(users.filter((u) => u.role === 'couvoir'));
    setLoading(false);
  }, []);

  useEffect(() => { if (isAdmin) loadCouvoirs(); }, [isAdmin, loadCouvoirs]);

  // Redirection automatique si pas admin (après chargement)
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

  const handleSetStatus = (c: User, newStatus: CouvoirStatus) => {
    const cfg = STATUS_CONFIG[newStatus];
    const doUpdate = async () => {
      setUpdating(c.id);
      await updateCouvoirStatus(c.id, newStatus);
      await loadCouvoirs();
      setUpdating(null);
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Mettre "${c.prenom} ${c.nom}" en statut "${cfg.label}" ?`)) doUpdate();
    } else {
      Alert.alert(
        `Changer le statut`,
        `Mettre ${c.prenom} ${c.nom} en "${cfg.label}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: cfg.label, onPress: doUpdate },
        ]
      );
    }
  };

  const filtered = couvoirs.filter((c) => {
    if (filtre === 'tous') return true;
    const s = c.couvoirStatus || 'pending';
    return s === filtre;
  });

  const pendingCount = couvoirs.filter((c) => (c.couvoirStatus || 'pending') === 'pending').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Certification Couvoirs</Text>
          <Text style={styles.headerSub}>{couvoirs.length} couvoir{couvoirs.length !== 1 ? 's' : ''} · {pendingCount} en attente</Text>
        </View>
        <TouchableOpacity onPress={loadCouvoirs} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="refresh-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Alerte si en attente */}
      {pendingCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="alert-circle" size={18} color="#92400e" />
          <Text style={styles.alertText}>{pendingCount} couvoir{pendingCount > 1 ? 's' : ''} en attente de validation</Text>
        </View>
      )}

      {/* Filtres */}
      <View style={styles.filtresWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {FILTRES.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filtrePill, filtre === f.key && styles.filtrePillActive]}
              onPress={() => setFiltre(f.key)}
            >
              <Text style={[styles.filtrePillText, filtre === f.key && styles.filtrePillTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 60 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={{ fontSize: 48 }}>🏭</Text>
          <Text style={styles.emptyText}>Aucun couvoir dans cette catégorie</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {filtered.map((c) => {
            const status = (c.couvoirStatus || 'pending') as CouvoirStatus;
            const cfg = STATUS_CONFIG[status];
            const initiales = `${c.prenom.charAt(0)}${c.nom.charAt(0)}`.toUpperCase();
            const isUpdating = updating === c.id;

            return (
              <View key={c.id} style={styles.card}>
                {/* En-tête */}
                <View style={styles.cardTop}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initiales}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{c.prenom} {c.nom}</Text>
                    {c.ferme && <Text style={styles.cardFerme}>{c.ferme}</Text>}
                    <Text style={styles.cardRegion}>📍 {c.region}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                    <Ionicons name={cfg.icon as any} size={13} color={cfg.color} />
                    <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                </View>

                {/* Infos */}
                {(c.email || c.phone) && (
                  <View style={styles.infoBlock}>
                    {c.email && <Text style={styles.infoLine}>✉️ {c.email}</Text>}
                    {c.phone && <Text style={styles.infoLine}>📱 +221 {c.phone}</Text>}
                  </View>
                )}

                {/* Actions */}
                {isUpdating ? (
                  <ActivityIndicator color={Colors.primary} style={{ marginTop: 10 }} />
                ) : (
                  <View style={styles.actionsGrid}>
                    {status !== 'certified' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionCertify]}
                        onPress={() => handleSetStatus(c, 'certified')}
                      >
                        <Ionicons name="shield-checkmark" size={15} color="#fff" />
                        <Text style={styles.actionBtnTextWhite}>Certifier</Text>
                      </TouchableOpacity>
                    )}
                    {status !== 'pending' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionPending]}
                        onPress={() => handleSetStatus(c, 'pending')}
                      >
                        <Ionicons name="time-outline" size={15} color="#92400e" />
                        <Text style={[styles.actionBtnText, { color: '#92400e' }]}>En attente</Text>
                      </TouchableOpacity>
                    )}
                    {status !== 'rejected' && (
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.actionReject]}
                        onPress={() => handleSetStatus(c, 'rejected')}
                      >
                        <Ionicons name="close-circle-outline" size={15} color={Colors.error} />
                        <Text style={[styles.actionBtnText, { color: Colors.error }]}>Refuser</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#fef9c3', paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#fde68a',
  },
  alertText: { fontSize: 13, fontWeight: '600', color: '#92400e' },

  filtresWrap: { backgroundColor: Colors.surface, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: Colors.border },
  filtrePill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: Colors.surfaceSecondary, borderWidth: 1.5, borderColor: Colors.border,
  },
  filtrePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtrePillText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filtrePillTextActive: { color: '#fff' },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 15, color: Colors.textMuted, marginTop: 16 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 18, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: {
    width: 48, height: 48, borderRadius: 15,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800', color: Colors.primaryDark },
  cardName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  cardFerme: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  cardRegion: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },

  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  infoBlock: { gap: 3, marginBottom: 12, paddingLeft: 4 },
  infoLine: { fontSize: 12, color: Colors.textSecondary },

  actionsGrid: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5,
  },
  actionCertify: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  actionPending: { backgroundColor: '#fef9c3', borderColor: '#fde68a' },
  actionReject: { backgroundColor: '#fff5f5', borderColor: '#fecaca' },
  actionBtnText: { fontSize: 13, fontWeight: '700' },
  actionBtnTextWhite: { fontSize: 13, fontWeight: '700', color: '#fff' },

  denied: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  deniedTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  btn: { backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

