import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { Colors, Fonts, Radius } from '@/constants/theme';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  hint?: string;
  leftAdornment?: React.ReactNode;
};

export default function TextField({ label, error, hint, leftAdornment, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={[styles.inputRow, focused && styles.inputRowFocused, error && styles.inputRowError]}>
        {leftAdornment}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.textPlaceholder}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          {...rest}
        />
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 4 },
  label: { fontSize: 12.5, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 7, marginTop: 12, letterSpacing: 0.1 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.md,
    paddingHorizontal: 15, backgroundColor: Colors.surface,
  },
  inputRowFocused: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  inputRowError: { borderColor: Colors.error },
  input: {
    flex: 1, paddingVertical: 14, fontSize: 15.5,
    color: Colors.text, fontFamily: Fonts.bodyMedium,
  },
  error: { color: Colors.error, fontSize: 12.5, marginTop: 6, fontFamily: Fonts.bodyMedium },
  hint: { color: Colors.textMuted, fontSize: 12, marginTop: 6, fontFamily: Fonts.body },
});
