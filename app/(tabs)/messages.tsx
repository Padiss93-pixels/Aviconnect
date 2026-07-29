import { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, TextInput, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { LogIn, MessageCircle, Search, X } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';


export default function MessagesScreen() {
  const { user } = useAuthContext();
  const [query, setQuery] = useState('');

  // Les conversations réelles seront chargées depuis Supabase quand la table
  // messages sera créée. Pour l'instant on affiche un état vide propre.
  const conversations: never[] = [];
  const unreadTotal = 0;

  return (
    <View style={styles.container}>

      {/* En-tête éditorial */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Boîte de réception</Text>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.subtitle}>Discutez directement avec les vendeurs</Text>
      </View>

      {!user ? (
        /* État non connecté */
        <View style={styles.authWall}>
          <View style={styles.authIconBox}>
            <MessageCircle size={30} color={Colors.primaryDark} strokeWidth={1.6} />
          </View>
          <Text style={styles.authTitle}>Vos conversations{'\n'}vous attendent</Text>
          <Text style={styles.authSub}>
            Connectez-vous pour échanger avec les éleveurs, couvoirs et acheteurs du réseau.
          </Text>
          <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
            <LogIn size={17} color={Colors.textOnDark} strokeWidth={1.9} />
            <Text style={styles.authBtnText}>Se connecter</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} hitSlop={8}>
            <Text style={styles.authLink}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {/* Recherche */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBox}>
              <Search size={17} color={Colors.textMuted} strokeWidth={1.8} />
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Rechercher une conversation…"
                placeholderTextColor={Colors.textPlaceholder}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
                  <X size={16} color={Colors.textMuted} strokeWidth={1.9} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <FlatList
            data={conversations}
            keyExtractor={() => ''}
            showsVerticalScrollIndicator={false}
            renderItem={() => null}
            ListEmptyComponent={
              query.trim() ? (
                <View style={styles.empty}>
                  <View style={styles.emptyIconBox}>
                    <Search size={26} color={Colors.textMuted} strokeWidth={1.6} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucun résultat</Text>
                  <Text style={styles.emptySub}>Aucune conversation ne correspond à « {query.trim()} »</Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <View style={styles.emptyIconBox}>
                    <MessageCircle size={26} color={Colors.primaryDark} strokeWidth={1.6} />
                  </View>
                  <Text style={styles.emptyTitle}>Aucune conversation</Text>
                  <Text style={styles.emptySub}>
                    Contactez un éleveur depuis une annonce pour démarrer une discussion.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => router.push('/(tabs)/marches' as any)}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.emptyBtnText}>Explorer le marché</Text>
                  </TouchableOpacity>
                </View>
              )
            }
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 4, paddingBottom: 120, gap: 10 }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    paddingTop: Platform.OS === 'ios' ? 66 : 52,
    paddingHorizontal: 22, paddingBottom: 18,
  },
  eyebrow: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8,
  },
  title: { fontSize: 27, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.3 },
  subtitle: { fontSize: 13, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 6 },

  searchWrap: { paddingHorizontal: 20, paddingBottom: 14 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.borderSoft,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'web' ? 12 : 10,
    ...(Shadows.soft as object),
  },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: Fonts.body, color: Colors.text,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },

  convCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderSoft,
    paddingHorizontal: 15, paddingVertical: 14,
    ...(Shadows.soft as object),
  },
  avatar: {
    width: 50, height: 50, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 20, fontFamily: Fonts.display },
  convInfo: { flex: 1 },
  convTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  convName: { flex: 1, fontSize: 15, fontFamily: Fonts.bodyBold, color: Colors.text },
  convTime: { fontSize: 11.5, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  convTimeUnread: { color: Colors.accent, fontFamily: Fonts.bodyBold },
  convBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  convLast: { flex: 1, fontSize: 13, fontFamily: Fonts.body, color: Colors.textTertiary },
  convLastUnread: { fontFamily: Fonts.bodySemiBold, color: Colors.text },
  unreadBadge: {
    backgroundColor: Colors.accent, borderRadius: Radius.pill,
    minWidth: 20, height: 20, paddingHorizontal: 6,
    justifyContent: 'center', alignItems: 'center',
  },
  unreadText: { color: '#fff', fontSize: 10.5, fontFamily: Fonts.bodyBold },

  empty: { alignItems: 'center', paddingTop: 64, paddingHorizontal: 36 },
  emptyIconBox: {
    width: 64, height: 64, borderRadius: 22, backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 18,
  },
  emptyTitle: { fontSize: 19, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },
  emptySub: {
    fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 8, lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 20, backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 24, paddingVertical: 12,
    ...(Shadows.button as object),
  },
  emptyBtnText: { color: '#fff', fontSize: 13.5, fontFamily: Fonts.bodyBold },

  authWall: { flex: 1, alignItems: 'center', paddingTop: 48, paddingHorizontal: 36 },
  authIconBox: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  authTitle: {
    fontSize: 23, fontFamily: Fonts.display, color: Colors.text,
    textAlign: 'center', lineHeight: 30, letterSpacing: -0.3,
  },
  authSub: {
    fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 10, lineHeight: 20, marginBottom: 26,
  },
  authBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 28, paddingVertical: 14,
    ...(Shadows.button as object),
  },
  authBtnText: { color: Colors.textOnDark, fontSize: 15, fontFamily: Fonts.bodyBold },
  authLink: { marginTop: 16, fontSize: 13.5, fontFamily: Fonts.bodyBold, color: Colors.primary },
});
