import { useState, useRef, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, User } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import type { Message } from '@/constants/mockData';
import { useRewards } from '@/hooks/RewardsContext';
import { supabase } from '@/lib/supabase';

const QUICK_REPLIES = [
  'Est-ce encore disponible ?',
  'Quel est votre meilleur prix ?',
  'Où êtes-vous situé ?',
  'La livraison est-elle possible ?',
];

const AVATAR_TINTS = [
  { bg: Colors.primaryTint, fg: Colors.primaryDark },
  { bg: Colors.accentLight, fg: Colors.accentDark },
  { bg: '#F3E8CF', fg: '#8A6A2F' },
  { bg: '#E3ECF4', fg: Colors.info },
];

type OtherUser = {
  id: string;
  prenom: string;
  nom: string;
  phone?: string;
  role: string;
};

function isUUID(s: string) {
  return /^[0-9a-f-]{36}$/.test(s);
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { completeQuest } = useRewards();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const listRef = useRef<FlatList>(null);

  const realUser = isUUID(id ?? '');

  // Chargement profil réel depuis Supabase si ID utilisateur
  useEffect(() => {
    if (!realUser || !id) return;
    supabase
      .from('profiles')
      .select('id, prenom, nom, phone, role')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (data) setOtherUser(data as OtherUser);
      });
  }, [id, realUser]);

  const participant = realUser
    ? otherUser ? `${otherUser.prenom} ${otherUser.nom}` : '…'
    : 'Conversation';

  const tint = AVATAR_TINTS[participant.charCodeAt(0) % AVATAR_TINTS.length];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/messages' as any);
  };

  const goProfile = () => {
    if (!otherUser) return;
    const role = otherUser.role;
    if (role === 'veterinaire') router.push(`/veterinaire/${otherUser.id}` as any);
    else if (role === 'couvoir') router.push(`/couvoir/${otherUser.id}` as any);
    else router.push(`/vendeur/${otherUser.id}` as any);
  };

  const callUser = () => {
    if (!otherUser?.phone) return;
    Linking.openURL(`tel:${otherUser.phone}`);
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const newMsg: Message = {
      id: messages.length + 1,
      senderId: 'me',
      text,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    completeQuest('envoie_message');
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} hitSlop={10}>
          <ArrowLeft size={21} color={Colors.text} strokeWidth={1.8} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.headerAvatar, { backgroundColor: tint.bg }]}
          onPress={realUser ? goProfile : undefined}
          activeOpacity={realUser ? 0.7 : 1}
        >
          <Text style={[styles.headerAvatarText, { color: tint.fg }]}>{participant[0]}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={realUser ? goProfile : undefined}
          activeOpacity={realUser ? 0.7 : 1}
        >
          <Text style={styles.headerName} numberOfLines={1}>{participant}</Text>
          <Text style={styles.headerSub}>
            {realUser
              ? otherUser?.role === 'veterinaire' ? 'Vétérinaire · Voir profil →'
              : otherUser?.role === 'couvoir' ? 'Couvoir · Voir profil →'
              : 'Éleveur · Voir profil →'
              : 'Marché AviConnect'}
          </Text>
        </TouchableOpacity>

        {/* Bouton appel direct */}
        {realUser && otherUser?.phone && (
          <TouchableOpacity style={styles.callBtn} onPress={callUser} hitSlop={8}>
            <Phone size={18} color={Colors.primary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}
      </View>

      {/* Bandeau profil rapide si ouvert depuis une notif */}
      {realUser && otherUser && (
        <TouchableOpacity style={styles.profileBand} onPress={goProfile} activeOpacity={0.8}>
          <User size={13} color={Colors.primary} strokeWidth={1.8} />
          <Text style={styles.profileBandText}>
            Voir le profil complet de {otherUser.prenom} — contact, WhatsApp, annonces
          </Text>
          <Text style={styles.profileBandArrow}>→</Text>
        </TouchableOpacity>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const isMe = item.senderId === 'me';
          return (
            <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
                <Text style={[styles.timestamp, isMe && styles.timestampMe]}>{item.timestamp}</Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 18, paddingBottom: 10 }}
        onLayout={() => listRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          realUser ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>
                Démarrez la conversation avec {otherUser?.prenom ?? '…'} 👋
              </Text>
            </View>
          ) : null
        }
      />

      {/* Réponses rapides */}
      {input.length === 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickScroll}
          contentContainerStyle={styles.quickContent}
          keyboardShouldPersistTaps="handled"
        >
          {QUICK_REPLIES.map((q) => (
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => setInput(q)} activeOpacity={0.85}>
              <Text style={styles.quickChipText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Saisie */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Écrire un message…"
          placeholderTextColor={Colors.textPlaceholder}
          multiline
          onSubmitEditing={send}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim()}
          activeOpacity={0.85}
        >
          <Send size={18} color="#fff" strokeWidth={1.9} style={{ marginLeft: -2, marginTop: 1 }} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    backgroundColor: Colors.surface,
    paddingTop: Platform.OS === 'ios' ? 58 : 44,
    paddingHorizontal: 14, paddingBottom: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  backBtn: { width: 38, height: 38, justifyContent: 'center', alignItems: 'center' },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { fontSize: 17, fontFamily: Fonts.display },
  headerName: { fontSize: 15.5, fontFamily: Fonts.bodyBold, color: Colors.text },
  headerSub: { fontSize: 11, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 1 },
  callBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center',
  },

  profileBand: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primaryTint,
    paddingHorizontal: 16, paddingVertical: 9,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  profileBandText: { flex: 1, fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.primaryDark },
  profileBandArrow: { fontSize: 14, color: Colors.primary, fontFamily: Fonts.bodyBold },

  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: Fonts.body, color: Colors.textMuted, textAlign: 'center' },

  msgRow: { marginBottom: 10, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 11 },
  bubbleMe: { backgroundColor: Colors.primary, borderBottomRightRadius: 6, ...(Shadows.soft as object) },
  bubbleOther: { backgroundColor: Colors.surface, borderBottomLeftRadius: 6, borderWidth: 1, borderColor: Colors.borderSoft, ...(Shadows.soft as object) },
  bubbleText: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.text, lineHeight: 21 },
  bubbleTextMe: { color: Colors.textOnDark },
  timestamp: { fontSize: 10, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 5, alignSelf: 'flex-end' },
  timestampMe: { color: 'rgba(247,242,233,0.65)' },

  quickScroll: { maxHeight: 46, flexGrow: 0 },
  quickContent: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  quickChip: { backgroundColor: Colors.surface, borderRadius: Radius.pill, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 14, paddingVertical: 8 },
  quickChipText: { fontSize: 12.5, fontFamily: Fonts.bodyMedium, color: Colors.textSecondary },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: Colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
    paddingHorizontal: 14, paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 26 : 12,
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'web' ? 12 : 10,
    fontSize: 14.5, fontFamily: Fonts.body, color: Colors.text,
    maxHeight: 110, backgroundColor: Colors.background,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', ...(Shadows.button as object) },
  sendBtnDisabled: { backgroundColor: Colors.separator },
});
