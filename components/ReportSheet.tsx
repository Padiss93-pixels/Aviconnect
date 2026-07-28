import { useState } from 'react';
import {
  View, Text, Modal, Pressable, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator, Platform, Alert,
} from 'react-native';
import { Check, Flag, ShieldOff } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import {
  useModeration, MOTIF_LABELS,
  type ReportMotif, type ReportTargetType,
} from '@/hooks/ModerationContext';

// Feuille de signalement + blocage (exigence App Store 1.2 sur le contenu
// généré par les utilisateurs). Utilisée sur les annonces, les besoins et les
// profils vendeurs.

const MOTIFS = Object.keys(MOTIF_LABELS) as ReportMotif[];

type Props = {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string | number;
  targetLabel?: string;
  reportedUserId?: string;
  reportedUserName?: string;
};

export default function ReportSheet({
  visible, onClose, targetType, targetId, targetLabel, reportedUserId, reportedUserName,
}: Props) {
  const { reportContent, blockUser, isBlocked } = useModeration();
  const [motif, setMotif] = useState<ReportMotif | null>(null);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const alreadyBlocked = isBlocked(reportedUserId);

  const close = () => {
    setMotif(null); setDetails(''); setSent(false); setError(''); setSending(false);
    onClose();
  };

  const handleSend = async () => {
    if (!motif) return;
    setSending(true); setError('');
    const { error: err } = await reportContent({
      targetType, targetId, targetLabel, reportedUserId, motif, details,
    });
    setSending(false);
    if (err) { setError(err); return; }
    setSent(true);
  };

  const handleBlock = async () => {
    if (!reportedUserId) return;
    const doBlock = async () => {
      const { error: err } = await blockUser(reportedUserId);
      if (err) { setError(err); return; }
      close();
    };
    const message = `Vous ne verrez plus les annonces ni les messages de ${reportedUserName ?? 'cet utilisateur'}.`;
    if (Platform.OS === 'web') {
      if (window.confirm(`Bloquer cet utilisateur ?\n\n${message}`)) doBlock();
    } else {
      Alert.alert('Bloquer cet utilisateur ?', message, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Bloquer', style: 'destructive', onPress: doBlock },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <Pressable style={styles.backdrop} onPress={close}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.handle} />

          {sent ? (
            <View style={styles.doneBox}>
              <View style={styles.doneIcon}>
                <Check size={26} color="#fff" strokeWidth={2.2} />
              </View>
              <Text style={styles.doneTitle}>Signalement envoyé</Text>
              <Text style={styles.doneText}>
                Notre équipe de modération examine ce contenu sous 24 à 48 heures.
                Merci d’aider à garder AviConnect sain.
              </Text>
              {reportedUserId && !alreadyBlocked && (
                <TouchableOpacity style={styles.blockBtn} onPress={handleBlock} activeOpacity={0.85}>
                  <ShieldOff size={16} color={Colors.error} strokeWidth={1.9} />
                  <Text style={styles.blockBtnText}>Bloquer aussi cet utilisateur</Text>
                </TouchableOpacity>
              )}
              {!!error && <Text style={styles.error}>{error}</Text>}
              <TouchableOpacity style={styles.primaryBtn} onPress={close} activeOpacity={0.85}>
                <Text style={styles.primaryBtnText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <View style={styles.headerIcon}>
                  <Flag size={19} color={Colors.error} strokeWidth={1.9} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>Signaler ce contenu</Text>
                  {!!targetLabel && (
                    <Text style={styles.subtitle} numberOfLines={1}>{targetLabel}</Text>
                  )}
                </View>
              </View>

              <Text style={styles.sectionLabel}>Quel est le problème ?</Text>
              {MOTIFS.map((m) => {
                const active = motif === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.motifRow, active && styles.motifRowActive]}
                    onPress={() => setMotif(m)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.motifText, active && styles.motifTextActive]}>
                      {MOTIF_LABELS[m]}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              <TextInput
                style={styles.input}
                placeholder="Détails (facultatif)"
                placeholderTextColor={Colors.textPlaceholder}
                value={details}
                onChangeText={setDetails}
                multiline
                maxLength={500}
              />

              {!!error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[styles.primaryBtn, (!motif || sending) && styles.primaryBtnDisabled]}
                onPress={handleSend}
                disabled={!motif || sending}
                activeOpacity={0.85}
              >
                {sending
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.primaryBtnText}>Envoyer le signalement</Text>}
              </TouchableOpacity>

              {reportedUserId && !alreadyBlocked && (
                <TouchableOpacity style={styles.blockBtn} onPress={handleBlock} activeOpacity={0.85}>
                  <ShieldOff size={16} color={Colors.error} strokeWidth={1.9} />
                  <Text style={styles.blockBtnText}>
                    Bloquer {reportedUserName ?? 'cet utilisateur'}
                  </Text>
                </TouchableOpacity>
              )}
              {alreadyBlocked && (
                <Text style={styles.blockedHint}>
                  Cet utilisateur est déjà bloqué. Vous pouvez le débloquer depuis votre profil.
                </Text>
              )}

              <TouchableOpacity onPress={close} style={styles.cancelBtn} activeOpacity={0.7}>
                <Text style={styles.cancelText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(36,31,25,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 10, paddingBottom: 26,
    maxHeight: '92%',
  },
  handle: {
    width: 42, height: 4, borderRadius: 2,
    backgroundColor: Colors.separator, alignSelf: 'center', marginBottom: 16,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headerIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(196,67,45,0.10)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 17, fontFamily: Fonts.displayBold, color: Colors.text },
  subtitle: { fontSize: 12.5, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },

  sectionLabel: {
    fontSize: 11.5, fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary,
    textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10,
  },

  motifRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: Radius.md, marginBottom: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1, borderColor: 'transparent',
  },
  motifRowActive: { backgroundColor: Colors.primaryLight, borderColor: Colors.primary },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.6, borderColor: Colors.separator,
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  motifText: { flex: 1, fontSize: 14, fontFamily: Fonts.body, color: Colors.textSecondary },
  motifTextActive: { fontFamily: Fonts.bodySemiBold, color: Colors.text },

  input: {
    marginTop: 6, minHeight: 76, borderRadius: 14, padding: 14,
    backgroundColor: Colors.surfaceSecondary,
    fontSize: 14, fontFamily: Fonts.body, color: Colors.text,
    textAlignVertical: 'top',
  },

  error: {
    marginTop: 12, fontSize: 13, fontFamily: Fonts.bodyMedium,
    color: Colors.error, textAlign: 'center',
  },

  primaryBtn: {
    marginTop: 16, borderRadius: Radius.pill, paddingVertical: 15,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.45 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontFamily: Fonts.bodyBold },

  blockBtn: {
    marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: Radius.pill, paddingVertical: 13,
    backgroundColor: 'rgba(196,67,45,0.10)',
  },
  blockBtnText: { color: Colors.error, fontSize: 14, fontFamily: Fonts.bodyBold },
  blockedHint: {
    marginTop: 12, fontSize: 12.5, fontFamily: Fonts.body,
    color: Colors.textMuted, textAlign: 'center', lineHeight: 18,
  },

  cancelBtn: { marginTop: 12, alignItems: 'center', paddingVertical: 8 },
  cancelText: { fontSize: 14, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },

  doneBox: { alignItems: 'center', paddingVertical: 8 },
  doneIcon: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  doneTitle: { fontSize: 18, fontFamily: Fonts.displayBold, color: Colors.text },
  doneText: {
    marginTop: 8, fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, paddingHorizontal: 8,
  },
});
