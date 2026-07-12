import { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAnnonces, type NotifType } from '@/hooks/AnnoncesContext';

const TYPE_CONFIG: Record<NotifType, { emoji: string; color: string; bg: string }> = {
  nouvelle_commande: { emoji: '🛒', color: '#92400e', bg: '#fef3c7' },
  commande_acceptee: { emoji: '✅', color: '#166534', bg: '#dcfce7' },
  commande_refusee:  { emoji: '❌', color: '#991b1b', bg: '#fee2e2' },
  paiement_recu:     { emoji: '💰', color: '#1e40af', bg: '#dbeafe' },
  couvoir_inscription: { emoji: '🏭', color: '#9a3412', bg: '#ffedd5' },
  vet_inscription:     { emoji: '💉', color: '#5b21b6', bg: '#ede9fe' },
};

async function requestPushPermission() {
  if (Platform.OS !== 'web') return;
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') {
    await Notification.requestPermission();
  }
}

export default function NotificationsScreen() {
  const { notifications, markNotifsRead } = useAnnonces();

  useEffect(() => {
    markNotifsRead();
    requestPushPermission();
  }, []);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity onPress={() => router.push('/commandes' as any)}>
          <Text style={styles.commandesLink}>📋 Commandes</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔔</Text>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySub}>
              Vous serez notifié ici pour les nouvelles commandes, acceptations, refus et paiements.
            </Text>
            {Platform.OS === 'web' && 'Notification' in window && Notification.permission !== 'granted' && (
              <TouchableOpacity style={styles.pushBtn} onPress={requestPushPermission}>
                <Text style={styles.pushBtnText}>🔔 Activer les notifications push</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {Platform.OS === 'web' && 'Notification' in window && Notification.permission !== 'granted' && (
              <TouchableOpacity style={styles.pushBanner} onPress={requestPushPermission}>
                <Text style={styles.pushBannerText}>🔔 Activer les notifications push pour ne rien rater</Text>
              </TouchableOpacity>
            )}
            {notifications.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || { emoji: '🔔', color: Colors.text, bg: '#f3f4f6' };
              return (
                <TouchableOpacity
                  key={n.id}
                  style={[styles.card, { borderLeftColor: cfg.bg }]}
                  onPress={() => n.orderId && router.push('/commandes' as any)}
                  activeOpacity={n.orderId ? 0.7 : 1}
                >
                  <View style={[styles.iconBox, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.icon}>{cfg.emoji}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{n.title}</Text>
                    <Text style={styles.cardBody}>{n.body}</Text>
                    <Text style={styles.cardDate}>{formatDate(n.date)}</Text>
                    {n.orderId && (
                      <Text style={styles.cardLink}>Voir la commande →</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  commandesLink: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10,
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    borderLeftWidth: 4,
  },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 20 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 3 },
  cardBody: { fontSize: 13, color: Colors.textLight, lineHeight: 19 },
  cardDate: { fontSize: 11, color: Colors.textMuted, marginTop: 5 },
  cardLink: { fontSize: 12, color: Colors.primary, fontWeight: '700', marginTop: 4 },
  pushBanner: {
    backgroundColor: Colors.primaryLight, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.primary,
  },
  pushBannerText: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600', textAlign: 'center' },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginTop: 16 },
  emptySub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', marginTop: 8, lineHeight: 22, paddingHorizontal: 20 },
  pushBtn: {
    marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  pushBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

