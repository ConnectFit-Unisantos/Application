import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StatusBar,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Header from '../components/Header';
import FormInput from '../components/FormInput';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type LoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

// ─── Validação local ──────────────────────────────────────────────────────────

interface FieldErrors {
  email: string;
  senha: string;
}

function validate(email: string, senha: string): FieldErrors {
  const errors: FieldErrors = { email: '', senha: '' };

  if (!email.trim()) {
    errors.email = 'E-mail é obrigatório';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido';
  }

  if (!senha) {
    errors.senha = 'Senha é obrigatória';
  }

  return errors;
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }: LoginScreenProps) {
  const { handleLogin, isSubmitting, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manterConectado, setManterConectado] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    email: '',
    senha: '',
  });

  async function onSubmit() {
    const errors = validate(email, senha);
    setFieldErrors(errors);

    const hasError = Object.values(errors).some((e) => !!e);
    if (hasError) return;

    clearError();

    try {
      await handleLogin({ email: email.trim().toLowerCase(), senha });
      // Depois do login, navega para Home
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    } catch {
      // erro já tratado pelo hook — exibido no banner abaixo do formulário
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <Header onLogoPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* ── Título ── */}
            <Text style={styles.title}>Conecte-se</Text>

            {/* ── Email ── */}
            <FormInput
              label="Email"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (fieldErrors.email) {
                  setFieldErrors((p) => ({ ...p, email: '' }));
                }
              }}
              error={fieldErrors.email}
            />

            {/* ── Senha ── */}
            <FormInput
              label="Senha"
              placeholder="Sua senha"
              isPassword
              value={senha}
              onChangeText={(v) => {
                setSenha(v);
                if (fieldErrors.senha) {
                  setFieldErrors((p) => ({ ...p, senha: '' }));
                }
              }}
              error={fieldErrors.senha}
            />

            {/* ── Manter conectado ── */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setManterConectado((v) => !v)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  manterConectado && styles.checkboxChecked,
                ]}
              >
                {manterConectado && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.checkboxLabel}>Manter conectado</Text>
            </TouchableOpacity>

            {/* ── Banner de erro da API ── */}
            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            {/* ── Botão principal ── */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                isSubmitting && styles.submitBtnDisabled,
              ]}
              onPress={onSubmit}
              activeOpacity={0.85}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator
                  color={theme.colors.text.white}
                  size="small"
                />
              ) : (
                <Text style={styles.submitBtnText}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* ── Divisor ── */}
            <View style={styles.divider} />

            {/* ── Link de cadastro ── */}
            <Text style={styles.helperText}>Não possui uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
  },

  // Card
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    ...theme.shadows.modal,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  // Checkbox "Manter conectado"
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  checkmark: {
    color: theme.colors.text.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
    lineHeight: 13,
  },
  checkboxLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },

  // Banner de erro
  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },

  // Botão principal
  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  submitBtnText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
  },

  // Divisor + link
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginBottom: theme.spacing.lg,
  },
  helperText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.muted,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  linkText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
  },
});
