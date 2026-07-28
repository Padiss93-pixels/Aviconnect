import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, TextInput, Linking, Image } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { getAllUsers, type User } from '@/hooks/useAuth';

export default function CouvoirsScreen() {
  const [couvoirs, setCouvoirs] = useState<User[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllUsers().then((users) => {
      setCouvoirs(users.filter((u) => u.role === 'couvoir' && u.couvoirStatus === 'certified'));
    });
  }, []);

  const filtered = couvoirs.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      `${c.prenom} ${c.nom}`.toLowerCase().includes(q) ||
      (c.ferme || '').toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q)
    );
  });

  const openWa = (c: User) => {
    const url = `https://wa.me/221${c.phone}?text=${encodeURIComponent(`Bonjour ${c.prenom}, j'ai trouvé votre couvoir sur AviConnect.`)}`;
    if (Platform.OS === 'web') window.open(url, '_blank', 'noopener,noreferrer');
    else Linking.openURL(url).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Couvoirs Certifiés</Text>
          <Text style={styles.headerSub}>{couvoirs.length} couvoir{couvoirs.length !== 1 ? 's' : ''} validé{couvoirs.length !== 1 ? 's' : ''} par AviConnect</Text>
        </View>
      </View>

      <View style={styles.infoBanner}>
        <Ionicons name="shield-checkmark" size={20} color={Colors.primary} />
        <Text style={styles.infoBannerText}>Ces couvoirs ont été vérifiés et certifiés par l'équipe AviConnect.</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Nom, ferme ou région..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🏭</Text>
            <Text style={styles.emptyTitle}>{search ? 'Aucun résultat' : "Aucun couvoir certifié pour l'instant"}</Text>
            <Text style={styles.emptySub}>{search ? 'Essayez un autre terme.' : 'Les couvoirs validés apparaîtront ici.'}</Text>
          </View>
        ) : filtered.map((c) => {
          const initiales = `${c.prenom.charAt(0)}${c.nom.charAt(0)}`.toUpperCase();
          return (
            <View key={c.id} style={styles.card}>
              <View style={styles.cardTop}>
                {c.photo ? (
                  <Image source={{ uri: c.photo }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initiales}</Text>
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <View style={styles.nameRow}>
                    <Text style={styles.cardName}>{c.prenom} {c.nom}</Text>
                    <View style={styles.certBadge}>
                      <Ionicons name="shield-checkmark" size={11} color="#166534" />
                      <Text style={styles.certBadgeText}>Certifié</Text>
                    </View>
                  </View>
                  {c.ferme && <Text style={styles.cardFerme}>{c.ferme}</Text>}
                </View>
              </View>

              <View style={styles.chipsRow}>
                <View style={styles.chip}>
                  <Ionicons name="location-outline" size={13} color={Colors.primary} />
                  <Text style={styles.chipText}>{c.region}</Text>
                </View>
                <View style={styles.chip}>
                  <Ionicons name="egg-outline" size={13} color={Colors.primary} />
                  <Text style={styles.chipText}>Poussins & Aliment</Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                {c.phone ? (
                  <TouchableOpacity style={styles.waBtn} onPress={() => openWa(c)} activeOpacity={0.85}>
                    <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                    <Text style={styles.waBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.annoncesBtn}
                  onPress={() => router.push('/(tabs)/marches' as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bag-outline" size={16} color={Colors.primary} />
                  <Text style={styles.annoncesBtnText}>Voir les annonces</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
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
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.primaryLight, paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.primaryTint,
  },
  infoBannerText: { flex: 1, fontSize: 13, color: Colors.primaryDark, lineHeight: 18, fontWeight: '500' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: 16, marginVertical: 12,
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text },

  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: Colors.surface, borderRadius: 20, padding: 16, marginBottom: 12,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
      web: { boxShadow: '0 3px 12px rgba(0,0,0,0.07)' } as any,
    }),
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  avatarImg: { width: 54, height: 54, borderRadius: 17 },
  avatar: {
    width: 54, height: 54, borderRadius: 17,
    backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: Colors.primaryTint,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: Colors.primaryDark },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '800', color: Colors.text, letterSpacing: -0.2 },
  cardFerme: { fontSize: 12, color: Colors.textMuted },
  certBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#dcfce7', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  certBadgeText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 14, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryLight, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: Colors.primaryDark },
  actionsRow: { flexDirection: 'row', gap: 10 },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 11,
  },
  waBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  annoncesBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 14, paddingVertical: 11,
    borderWidth: 1.5, borderColor: Colors.primaryTint,
  },
  annoncesBtnText: { fontSize: 13, fontWeight: '700', color: Colors.primary },
});

