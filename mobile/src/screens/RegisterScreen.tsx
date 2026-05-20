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
  SafeAreaView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import Header from '../components/Header';
import FormInput from '../components/FormInput';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type RegisterScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

// ─── Validação local ──────────────────────────────────────────────────────────

interface FieldErrors {
  nome: string;
  email: string;
  senha: string;
  confirmarSenha: string;
}

function validate(
  nome: string,
  email: string,
  senha: string,
  confirmarSenha: string,
): FieldErrors {
  const errors: FieldErrors = {
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  };

  if (!nome.trim() || nome.trim().length < 2) {
    errors.nome = 'Nome deve ter pelo menos 2 caracteres';
  }

  if (!email.trim()) {
    errors.email = 'E-mail é obrigatório';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Informe um e-mail válido';
  }

  if (!senha) {
    errors.senha = 'Senha é obrigatória';
  } else if (senha.length < 6) {
    errors.senha = 'Senha deve ter pelo menos 6 caracteres';
  }

  if (!confirmarSenha) {
    errors.confirmarSenha = 'Confirme sua senha';
  } else if (senha !== confirmarSenha) {
    errors.confirmarSenha = 'As senhas não coincidem';
  }

  return errors;
}

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const { handleRegister, isSubmitting, error, clearError } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({
    nome: '',
    email: '',
    senha: '',
    confirmarSenha: '',
  });

  function clearFieldError(field: keyof FieldErrors) {
    if (fieldErrors[field]) {
      setFieldErrors((p) => ({ ...p, [field]: '' }));
    }
  }

  async function onSubmit() {
    const errors = validate(nome, email, senha, confirmarSenha);
    setFieldErrors(errors);

    const hasError = Object.values(errors).some((e) => !!e);
    if (hasError) return;

    clearError();

    try {
      await handleRegister({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
      });
      navigation.navigate('Home');
    } catch {
      // erro já tratado pelo hook — exibido no banner abaixo do formulário
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <Header />

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
            <Text style={styles.title}>Criar Conta</Text>

            {/* ── Nome Completo ── */}
            <FormInput
              label="Nome Completo"
              placeholder="Seu nome completo"
              autoCapitalize="words"
              value={nome}
              onChangeText={(v) => {
                setNome(v);
                clearFieldError('nome');
              }}
              error={fieldErrors.nome}
            />

            {/* ── Email ── */}
            <FormInput
              label="Email"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                clearFieldError('email');
              }}
              error={fieldErrors.email}
            />

            {/* ── Senha ── */}
            <FormInput
              label="Senha"
              placeholder="Crie uma senha"
              isPassword
              value={senha}
              onChangeText={(v) => {
                setSenha(v);
                clearFieldError('senha');
              }}
              error={fieldErrors.senha}
            />

            {/* ── Confirmação de Senha ── */}
            <FormInput
              label="Confirmação de Senha"
              placeholder="Confirme sua senha"
              isPassword
              value={confirmarSenha}
              onChangeText={(v) => {
                setConfirmarSenha(v);
                clearFieldError('confirmarSenha');
              }}
              error={fieldErrors.confirmarSenha}
            />

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
                <Text style={styles.submitBtnText}>Cadastrar</Text>
              )}
            </TouchableOpacity>

            {/* ── Divisor ── */}
            <View style={styles.divider} />

            {/* ── Link de login ── */}
            <Text style={styles.helperText}>Já possui uma conta?</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Faça login</Text>
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
    backgroundColor: theme.colors.dark,
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
