import { useState, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { CONVERSATIONS, type Message } from '@/constants/mockData';

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

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conv = CONVERSATIONS.find((c) => c.id === Number(id)) || CONVERSATIONS[0];
  const [messages, setMessages] = useState<Message[]>(conv?.messages || []);
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList>(null);

  const participant = conv?.participant ?? 'Conversation';
  const tint = AVATAR_TINTS[participant.charCodeAt(0) % AVATAR_TINTS.length];

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/messages' as any);
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
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const sendQuick = (text: string) => {
    setInput(text);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header custom */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} hitSlop={10}>
          <ArrowLeft size={21} color={Colors.text} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={[styles.headerAvatar, { backgroundColor: tint.bg }]}>
          <Text style={[styles.headerAvatarText, { color: tint.fg }]}>{participant[0]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>{participant}</Text>
          <Text style={styles.headerSub}>Marché AviConnect</Text>
        </View>
      </View>

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
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendQuick(q)} activeOpacity={0.85}>
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

  msgRow: { marginBottom: 10, alignItems: 'flex-start' },
  msgRowMe: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '80%', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 11,
  },
  bubbleMe: {
    backgroundColor: Colors.primary, borderBottomRightRadius: 6,
    ...(Shadows.soft as object),
  },
  bubbleOther: {
    backgroundColor: Colors.surface, borderBottomLeftRadius: 6,
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  bubbleText: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.text, lineHeight: 21 },
  bubbleTextMe: { color: Colors.textOnDark },
  timestamp: { fontSize: 10, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 5, alignSelf: 'flex-end' },
  timestampMe: { color: 'rgba(247,242,233,0.65)' },

  quickScroll: { maxHeight: 46, flexGrow: 0 },
  quickContent: { paddingHorizontal: 14, paddingBottom: 10, gap: 8 },
  quickChip: {
    backgroundColor: Colors.surface, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 14, paddingVertical: 8,
  },
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
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    ...(Shadows.button as object),
  },
  sendBtnDisabled: { backgroundColor: Colors.separator, ...(Platform.OS === 'web' ? { boxShadow: 'none' } as any : {}) },
});
