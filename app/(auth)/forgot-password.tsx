import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import Logo from '@/components/ui/Logo';
import { findUserByEmailOrPhone, resetPassword } from '@/hooks/useAuth';
import { type User } from '@/hooks/useAuth';

type Step = 'identifier' | 'code' | 'newPassword' | 'success';

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<Step>('identifier');
  const [identifier, setIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Données intermédiaires
  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [sentCode, setSentCode] = useState('');
  const [inputCode, setInputCode] = useState(['', '', '', '', '', '']);
  const codeRefs = useRef<(TextInput | null)[]>([]);

  // Nouveau mot de passe
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // ── Étape 1 : identifier l'utilisateur ────────────────────────────────────
  const handleIdentify = async () => {
    const clean = identifier.trim();
    if (!clean) {
      setError('Entrez votre email ou numéro de téléphone');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const user = await findUserByEmailOrPhone(clean);
    setLoading(false);

    if (!user) {
      setError('Aucun compte trouvé avec cet email ou ce numéro.');
      return;
    }
    if (user.blocked) {
      setError('Ce compte est suspendu. Contactez le support AviConnect.');
      return;
    }

    const code = generateCode();
    setSentCode(code);
    setFoundUser(user);
    setStep('code');
  };

  // ── Étape 2 : vérifier le code ─────────────────────────────────────────────
  const handleCodeChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...inputCode];
    next[idx] = val;
    setInputCode(next);
    if (val && idx < 5) codeRefs.current[idx + 1]?.focus();
  };

  const handleVerifyCode = async () => {
    const code = inputCode.join('');
    if (code.length < 6) {
      setError('Entrez le code à 6 chiffres');
      return;
    }
    if (code !== sentCode) {
      setError('Code incorrect. Vérifiez et réessayez.');
      return;
    }
    setError('');
    setStep('newPassword');
  };

  const handleResendCode = () => {
    const code = generateCode();
    setSentCode(code);
    setInputCode(['', '', '', '', '', '']);
    setError('');
    codeRefs.current[0]?.focus();
  };

  // ── Étape 3 : nouveau mot de passe ────────────────────────────────────────
  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setError('');
    setLoading(true);
    await resetPassword(foundUser!.id, newPassword);
    setLoading(false);
    setStep('success');
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoRow}>
          <View style={styles.logoCircle}>
            <Logo size={42} variant="cream" />
          </View>
        </View>

        <View style={styles.card}>

          {/* ── Étape 1 : identifier ──────────────────────────────── */}
          {step === 'identifier' && (
            <>
              <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} style={styles.backRow}>
                <Text style={styles.backText}>← Retour</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Mot de passe oublié</Text>
              <Text style={styles.subtitle}>
                Entrez l'email ou le numéro de téléphone associé à votre compte.
                Nous vous enverrons un code de vérification.
              </Text>

              <Text style={styles.label}>Email ou numéro de téléphone</Text>
              <View style={styles.inputRow}>
                <Text style={styles.inputIcon}>
                  {identifier.includes('@') || identifier.length === 0 ? '📧' : '📱'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={identifier}
                  onChangeText={(t) => { setIdentifier(t); setError(''); }}
                  placeholder="exemple@email.com ou 77 123 45 67"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (!identifier.trim() || loading) && styles.btnDisabled]}
                onPress={handleIdentify}
                disabled={!identifier.trim() || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Envoyer le code →</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Étape 2 : code de vérification ───────────────────── */}
          {step === 'code' && (
            <>
              <TouchableOpacity onPress={() => { setStep('identifier'); setError(''); }} style={styles.backRow}>
                <Text style={styles.backText}>← Retour</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Code de vérification</Text>
              <Text style={styles.subtitle}>
                Un code a été envoyé à{'\n'}
                <Text style={styles.highlight}>
                  {foundUser?.email || `+221 ${foundUser?.phone}`}
                </Text>
              </Text>

              {/* Affichage démo du code */}
              <View style={styles.demoBox}>
                <Text style={styles.demoLabel}>Demo — code généré :</Text>
                <Text style={styles.demoCode}>{sentCode}</Text>
                <Text style={styles.demoNote}>
                  (En production ce code serait envoyé par SMS / email)
                </Text>
              </View>

              <View style={styles.codeRow}>
                {inputCode.map((digit, i) => (
                  <TextInput
                    key={i}
                    ref={(r) => { codeRefs.current[i] = r; }}
                    style={[styles.codeInput, digit && styles.codeInputFilled]}
                    value={digit}
                    onChangeText={(v) => handleCodeChange(v, i)}
                    keyboardType="number-pad"
                    maxLength={1}
                    onKeyPress={({ nativeEvent }) => {
                      if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                        codeRefs.current[i - 1]?.focus();
                      }
                    }}
                  />
                ))}
              </View>

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, inputCode.join('').length < 6 && styles.btnDisabled]}
                onPress={handleVerifyCode}
                disabled={inputCode.join('').length < 6}
              >
                <Text style={styles.btnText}>Vérifier le code →</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.resendRow} onPress={handleResendCode}>
                <Text style={styles.resendText}>Renvoyer un nouveau code</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── Étape 3 : nouveau mot de passe ───────────────────── */}
          {step === 'newPassword' && (
            <>
              <View style={styles.successIconBox}>
                <Text style={styles.successIcon}>🔓</Text>
              </View>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Choisissez un nouveau mot de passe sécurisé pour votre compte.
              </Text>

              <Text style={styles.label}>Nouveau mot de passe</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={newPassword}
                  onChangeText={(t) => { setNewPassword(t); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showNew}
                />
                <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showNew ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <View style={styles.pwdRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={(t) => { setConfirmPassword(t); setError(''); }}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showConfirm}
                />
                <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
                  <Text style={styles.eyeText}>{showConfirm ? '🙈' : '👁'}</Text>
                </TouchableOpacity>
              </View>

              {/* Indicateur force du mot de passe */}
              {newPassword.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3].map((lvl) => {
                    const strength = newPassword.length >= 10 ? 3 : newPassword.length >= 6 ? 2 : 1;
                    const colors = ['#ef4444', '#f97316', '#22c55e'];
                    return (
                      <View
                        key={lvl}
                        style={[styles.strengthBar, { backgroundColor: lvl <= strength ? colors[strength - 1] : Colors.border }]}
                      />
                    );
                  })}
                  <Text style={styles.strengthLabel}>
                    {newPassword.length < 6 ? 'Trop court' : newPassword.length < 10 ? 'Correct' : 'Fort'}
                  </Text>
                </View>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.btn, (newPassword.length < 6 || loading) && styles.btnDisabled]}
                onPress={handleResetPassword}
                disabled={newPassword.length < 6 || loading}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Réinitialiser le mot de passe →</Text>}
              </TouchableOpacity>
            </>
          )}

          {/* ── Succès ───────────────────────────────────────────── */}
          {step === 'success' && (
            <View style={styles.successBox}>
              <Text style={styles.successBigIcon}>✅</Text>
              <Text style={styles.successTitle}>Mot de passe réinitialisé !</Text>
              <Text style={styles.successSub}>
                Votre mot de passe a bien été mis à jour.
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
              <TouchableOpacity
                style={[styles.btn, { marginTop: 24 }]}
                onPress={() => router.replace('/(auth)/login')}
              >
                <Text style={styles.btnText}>Se connecter →</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Indicateur d'étapes */}
        {step !== 'success' && (
          <View style={styles.steps}>
            {(['identifier', 'code', 'newPassword'] as Step[]).map((s, i) => {
              const current = ['identifier', 'code', 'newPassword'].indexOf(step);
              const done = i < current;
              const active = i === current;
              return (
                <View key={s} style={styles.stepItem}>
                  <View style={[
                    styles.stepDot,
                    active && styles.stepDotActive,
                    done && styles.stepDotDone,
                  ]}>
                    <Text style={[styles.stepNum, (active || done) && styles.stepNumActive]}>
                      {done ? '✓' : i + 1}
                    </Text>
                  </View>
                  {i < 2 && <View style={[styles.stepLine, done && styles.stepLineDone]} />}
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingBottom: 40 },

  logoRow: { alignItems: 'center', marginBottom: 24 },
  logoCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12, shadowRadius: 12, elevation: 6,
  },

  backRow: { marginBottom: 16 },
  backText: { color: Colors.primary, fontSize: 15, fontWeight: '600' },

  title: { fontSize: 22, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textLight, lineHeight: 21, marginBottom: 20 },
  highlight: { color: Colors.primary, fontWeight: '700' },

  label: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 4 },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 12, marginBottom: 4,
  },
  inputIcon: { fontSize: 18, marginRight: 8 },
  input: {
    flex: 1, fontSize: 15, color: Colors.text,
    paddingVertical: 13,
  },

  error: { color: Colors.error, fontSize: 13, marginTop: 6, marginBottom: 4 },

  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 15, alignItems: 'center', marginTop: 16,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Démo code
  demoBox: {
    backgroundColor: '#fef9c3', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: '#fde047', alignItems: 'center',
  },
  demoLabel: { fontSize: 11, color: '#713f12', fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  demoCode: { fontSize: 32, fontWeight: '700', color: '#713f12', letterSpacing: 8, marginVertical: 6 },
  demoNote: { fontSize: 10, color: '#92400e', textAlign: 'center', lineHeight: 15 },

  // Code OTP 6 chiffres
  codeRow: { flexDirection: 'row', gap: 8, marginBottom: 8, justifyContent: 'center' },
  codeInput: {
    width: 44, height: 54, borderWidth: 2, borderColor: Colors.border,
    borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: '700',
    color: Colors.text, backgroundColor: '#fff',
  },
  codeInputFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },

  resendRow: { marginTop: 16, alignItems: 'center' },
  resendText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },

  // Mot de passe
  pwdRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    backgroundColor: '#fff', paddingHorizontal: 12, marginBottom: 4,
  },
  eyeBtn: { padding: 6 },
  eyeText: { fontSize: 18 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, marginBottom: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, color: Colors.textMuted, minWidth: 50 },

  // Succès
  successIconBox: { alignItems: 'center', marginBottom: 8 },
  successIcon: { fontSize: 48 },
  successBox: { alignItems: 'center', paddingVertical: 12 },
  successBigIcon: { fontSize: 64, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  successSub: { fontSize: 14, color: Colors.textLight, textAlign: 'center', lineHeight: 21 },

  // Indicateur d'étapes
  steps: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    marginTop: 20,
  },
  stepItem: { flexDirection: 'row', alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  stepDotActive: { backgroundColor: '#fff', borderColor: '#fff' },
  stepDotDone: { backgroundColor: Colors.primaryDark || '#14532d', borderColor: '#fff' },
  stepNum: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  stepNumActive: { color: Colors.primary },
  stepLine: { width: 40, height: 2, backgroundColor: 'rgba(255,255,255,0.3)', marginHorizontal: 4 },
  stepLineDone: { backgroundColor: '#fff' },
});

