import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Linking,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send, Phone, User } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useRewards } from '@/hooks/RewardsContext';
import { useAuthContext } from '@/hooks/AuthContext';
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

type DbMessage = {
  id: number;
  sender_id: string;
  receiver_id: string;
  text: string;
  created_at: string;
  read: boolean;
};

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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthContext();
  const { completeQuest } = useRewards();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const realUser = isUUID(id ?? '');

  // Profil de l'autre utilisateur
  useEffect(() => {
    if (!realUser || !id) return;
    supabase
      .from('profiles')
      .select('id, prenom, nom, phone, role')
      .eq('id', id)
      .single()
      .then(({ data }) => { if (data) setOtherUser(data as OtherUser); });
  }, [id, realUser]);

  // Chargement des messages existants
  const loadMessages = useCallback(async () => {
    if (!realUser || !id || !user?.id) return;
    const [sent, received] = await Promise.all([
      supabase.from('messages').select('*').eq('sender_id', user.id).eq('receiver_id', id),
      supabase.from('messages').select('*').eq('sender_id', id).eq('receiver_id', user.id),
    ]);
    const all = [...(sent.data ?? []), ...(received.data ?? [])] as DbMessage[];
    all.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    setMessages(all);
  }, [id, user?.id, realUser]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Marquer les messages reçus comme lus à l'ouverture de la conversation
  useEffect(() => {
    if (!realUser || !id || !user?.id) return;
    supabase
      .from('messages')
      .update({ read: true })
      .eq('sender_id', id)
      .eq('receiver_id', user.id)
      .eq('read', false)
      .then(() => {});
  }, [id, user?.id, realUser]);

  // Abonnement temps réel
  useEffect(() => {
    if (!realUser || !id || !user?.id) return;
    const channel = supabase
      .channel(`chat-${user.id}-${id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `receiver_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new as DbMessage;
        if (msg.sender_id !== id) return;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id, user?.id, realUser]);

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
    if (otherUser.role === 'veterinaire') router.push(`/veterinaire/${otherUser.id}` as any);
    // Les couvoirs passent par /vendeur/[id] : cette page lit le vrai profil
    // Supabase et gère déjà le rôle couvoir. L'ancienne route /couvoir/[id]
    // servait des couvoirs inventés et cherchait un id numérique, alors que
    // otherUser.id est un uuid — elle ne pouvait rien trouver.
    else router.push(`/vendeur/${otherUser.id}` as any);
  };

  const callUser = () => {
    if (!otherUser?.phone) return;
    Linking.openURL(`tel:${otherUser.phone}`);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !user?.id || !id || sending) return;
    setSending(true);
    setInput('');

    const optimistic: DbMessage = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: id,
      text,
      created_at: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimistic]);
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);

    const { data, error } = await supabase
      .from('messages')
      .insert({ sender_id: user.id, receiver_id: id, text })
      .select()
      .single();

    if (error) {
      console.error('[chat] insert error:', JSON.stringify(error));
    }
    if (!error && data) {
      setMessages((prev) => prev.map((m) => m.id === optimistic.id ? data as DbMessage : m));
      notifyReceiver(text);
    }

    setSending(false);
    completeQuest('envoie_message');
  };

  const notifyReceiver = async (text: string) => {
    if (!user?.id || !id) return;
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('prenom, nom')
      .eq('id', user.id)
      .single();
    const senderName = senderProfile ? `${senderProfile.prenom} ${senderProfile.nom}` : 'Un utilisateur';

    const { data: receiverProfile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', id)
      .single();

    if (receiverProfile?.push_token) {
      fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          to: receiverProfile.push_token,
          title: `💬 ${senderName}`,
          body: text,
          data: { type: 'nouveau_message', otherUserId: user.id, url: `/chat/${user.id}` },
          sound: 'default',
          channelId: 'default',
        }),
      }).catch(() => {});
    }
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

        {realUser && otherUser?.phone && (
          <TouchableOpacity style={styles.callBtn} onPress={callUser} hitSlop={8}>
            <Phone size={18} color={Colors.primary} strokeWidth={1.8} />
          </TouchableOpacity>
        )}
      </View>

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
          const isMe = item.sender_id === user?.id;
          return (
            <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
              <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
                <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{item.text}</Text>
                <Text style={[styles.timestamp, isMe && styles.timestampMe]}>
                  {formatTime(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
        contentContainerStyle={{ padding: 18, paddingBottom: 10 }}
        onLayout={() => listRef.current?.scrollToEnd()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Démarrez la conversation avec {otherUser?.prenom ?? '…'} 👋
            </Text>
          </View>
        }
      />

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
          style={[styles.sendBtn, (!input.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!input.trim() || sending}
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
  headerAvatar: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
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
