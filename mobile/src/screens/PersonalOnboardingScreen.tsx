import React, { useMemo, useState } from 'react';
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
import LocalidadeModal, { LocalidadeSelecionada } from '../components/LocalidadeModal';
import { useAuth } from '../hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { api } from '../services/api';
import { API_CONFIG } from '../configs/api.config';
import { storage } from '../utils/storage';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PersonalOnboarding'>;
};

function splitCsv(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PersonalOnboardingScreen({ navigation }: Props) {
  const { user, refreshSession } = useAuth();

  


  const [formacao, setFormacao] = useState('');
  const [servicos, setServicos] = useState('');
  const [especializacao, setEspecializacao] = useState('');
  const [precoHora, setPrecoHora] = useState('');
  const [disponibilidade, setDisponibilidade] = useState('');
  const [bio, setBio] = useState('');
  const [certificacoes, setCertificacoes] = useState('');

  // Localização (UF + Cidade)
  const [uf, setUf] = useState('');
  const [cidade, setCidade] = useState('');

  const [showLocModal, setShowLocModal] = useState(false);

  function handleLocationSelect(loc: LocalidadeSelecionada) {

    setUf(loc.uf);
    setCidade(loc.cidade ?? '');
  }




  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      !!bio.trim() &&
      !!formacao.trim() &&
      !!servicos.trim() &&
      !!especializacao.trim() &&
      !!certificacoes.trim() &&
      !!uf.trim() &&
      !!cidade.trim()
    );
  }, [bio, formacao, servicos, especializacao, certificacoes, uf, cidade]);


  async function handleSubmit() {
    if (!user) return;
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const token = await storage.getToken();
      if (!token) throw new Error('Sessão expirada. Faça login novamente.');

      const endpoint = API_CONFIG.ENDPOINTS.PERSONAL_ACTIVATE;

      const payload = {
        formacao: splitCsv(formacao),
        servicos: splitCsv(servicos),
        especializacao: splitCsv(especializacao),
        precoHora: precoHora.trim(),
        disponibilidade: disponibilidade.trim(),
        bio: bio.trim(),
        certificacoes: splitCsv(certificacoes),
        uf: uf.trim(),
        cidade: cidade.trim(),
      };


      const res = (await api.post<{ token: string; user: any }>(
        endpoint,
        payload,
        true, // authenticated
      )) as { token: string; user: any };

      // Backend retorna user atualizado
      // IMPORTANTE: o endpoint /personal/activate atualmente retorna somente user (sem token)
      // então tratamos a resposta de forma tolerante.
      const returnedUser = (res as any)?.user ?? (res as any);

      if (!returnedUser) {
        throw new Error('Resposta inválida do servidor (user ausente).');
      }


      // O endpoint pode (ou não) retornar token novo. Se vier, persistimos.
      if (res?.token) {
        await storage.saveToken(res.token);
      }

      // Persistência tolerante: backend pode retornar { user } ou o próprio user
      if (returnedUser) {
        await storage.saveUser(returnedUser as any);
      }

      // Atualiza o AuthContext em memória para refletir imediatamente nas telas atuais
      await refreshSession();

      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });

    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Erro ao cadastrar personal';
      setError(message);
    } finally {
      setIsSubmitting(false);
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
        <LocalidadeModal
          visible={showLocModal}
          onClose={() => setShowLocModal(false)}
        onSelect={(loc: any) => {
          handleLocationSelect(loc);
          // garante que UF/cidade estejam preenchidos antes de fechar
        }}
        />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>Seja um Personal</Text>

            <FormInput
              label="Formação (separe por vírgula)"
              placeholder="Ex: 2021 - Pós em ... , 2019 - Graduação ..."
              value={formacao}
              onChangeText={setFormacao}
            />

            <FormInput
              label="Serviços prestados (separe por vírgula)"
              placeholder="Ex: Avaliação física, Personal 1:1"
              value={servicos}
              onChangeText={setServicos}
            />

            <FormInput
              label="Especialização (separe por vírgula)"
              placeholder="Ex: Emagrecimento, Hipertrofia"
              value={especializacao}
              onChangeText={setEspecializacao}
            />

            <FormInput
              label="Preço/hora"
              placeholder="Ex: 120"
              value={precoHora}
              onChangeText={setPrecoHora}
              keyboardType="numeric"
            />

            <FormInput
              label="Disponibilidade"
              placeholder="Ex: Segunda, Quarta, Sexta"
              value={disponibilidade}
              onChangeText={setDisponibilidade}
            />

            <FormInput
              label="Bio"
              placeholder="Conte sobre você"
              value={bio}
              onChangeText={setBio}
            />

            <FormInput
              label="Certificações (separe por vírgula)"
              placeholder="Ex: CREF, Curso X"
              value={certificacoes}
              onChangeText={setCertificacoes}
            />

            {/* Localização (UF + Cidade) */}
            <TouchableOpacity
              style={styles.locationBtn}
              activeOpacity={0.8}
              onPress={() => {
                // abre o seletor de localidade reutilizando a mesma tecnologia da Home
                setShowLocModal(true);
              }}
            >
              <Text style={styles.locationBtnText} numberOfLines={1}>
                {uf && cidade
                  ? `${cidade} - ${uf}`
                  : 'Selecione Estado e Cidade'}
              </Text>
              <Ionicons name="chevron-down" size={16} color={theme.colors.text.secondary} />
            </TouchableOpacity>


            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.submitBtn, (!canSubmit || isSubmitting) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              activeOpacity={0.85}
              disabled={!canSubmit || isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color={theme.colors.text.white} size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Cadastrar como Personal</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

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

  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    ...theme.shadows.modal,
    gap: theme.spacing.md,
  },

  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },

  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  errorBannerText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },

  submitBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  submitBtnDisabled: {
    opacity: 0.65,
  },
  locationBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  locationBtnText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },

  submitBtnText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
  },

});

