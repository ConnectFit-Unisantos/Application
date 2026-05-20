import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  /** Quando true, exibe toggle de mostrar/ocultar senha. */
  isPassword?: boolean;
}

/**
 * Campo de formulário padronizado:
 * - Label acima do input
 * - Feedback visual de foco (borda escura)
 * - Mensagem de erro inline abaixo
 * - Toggle de visibilidade para campos de senha
 */
export default function FormInput({
  label,
  error,
  isPassword = false,
  ...props
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.focused,
          !!error && styles.hasError,
        ]}
      >
        <TextInput
          style={styles.input}
          placeholderTextColor={theme.colors.text.muted}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoCorrect={false}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowPassword((v) => !v)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showPassword ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={theme.colors.text.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  focused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  hasError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 13,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  eyeBtn: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
  },
  errorText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
