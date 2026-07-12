import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';
import Button from '@/components/ui/Button';
import { useAuthContext } from '@/hooks/AuthContext';

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { signIn } = useAuthContext();
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (val: string, idx: number) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    if (val && idx < 4) inputs.current[idx + 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < 5) {
      setError('Il manque des chiffres — le code en fait 5');
      return;
    }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));

    const isAdmin = phone === '000000000';
    await signIn({
      id: isAdmin ? 'u_admin' : `u_${phone || 'demo'}`,
      phone: phone || '',
      prenom: isAdmin ? 'Admin' : 'Utilisateur',
      nom: isAdmin ? 'AviConnect' : 'Demo',
      region: 'Dakar',
      role: isAdmin ? 'admin' : 'eleveur',
      verified: isAdmin,
    });

    setLoading(false);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)')} style={styles.back} hitSlop={10}>
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={1.8} />
          <Text style={styles.backText}>Retour</Text>
        </TouchableOpacity>

        <Animated.View entering={FadeInUp.duration(500).springify()}>
          <Text style={styles.title}>Vérifie ton numéro</Text>
          <Text style={styles.subtitle}>
            On vient d'envoyer un code à{'\n'}
            <Text style={styles.phone}>+221 {phone}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputs.current[i] = r; }}
                style={[styles.otpInput, digit && styles.otpFilled]}
                value={digit}
                onChangeText={(v) => handleChange(v, i)}
                keyboardType="number-pad"
                maxLength={1}
                onKeyPress={({ nativeEvent }) => {
                  if (nativeEvent.key === 'Backspace' && !digit && i > 0) {
                    inputs.current[i - 1]?.focus();
                  }
                }}
              />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Vérifier" onPress={handleVerify} loading={loading} showArrow fullWidth style={{ marginTop: 22 }} />

          <TouchableOpacity style={styles.resend}>
            <Text style={styles.resendText}>Je n'ai rien reçu, renvoyer le code</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: 28, paddingTop: 64, width: '100%', maxWidth: 520, alignSelf: 'center' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 36, alignSelf: 'flex-start' },
  backText: { color: Colors.primary, fontSize: 15, fontFamily: Fonts.bodySemiBold },
  title: { fontSize: 26, fontFamily: Fonts.display, color: Colors.text, marginBottom: 10 },
  subtitle: { fontSize: 14.5, fontFamily: Fonts.body, color: Colors.textMuted, lineHeight: 21, marginBottom: 34 },
  phone: { color: Colors.primary, fontFamily: Fonts.bodyBold },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  otpInput: {
    flex: 1, height: 58, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: Radius.md, textAlign: 'center', fontSize: 22, fontFamily: Fonts.bodyBold,
    color: Colors.text, backgroundColor: Colors.surface,
  },
  otpFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  error: { color: Colors.error, fontSize: 13, marginTop: 10, fontFamily: Fonts.bodyMedium },
  resend: { marginTop: 22, alignItems: 'center' },
  resendText: { color: Colors.primary, fontSize: 13.5, fontFamily: Fonts.bodySemiBold },
});
