import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

import AppSafeArea from '../components/AppSafeArea';
import BackHeader from '../components/BackHeader';
import StatusBadge from '../components/StatusBadge';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAulaActions } from '../hooks/useAulaActions';
import { useAbrirConversa } from '../hooks/useAbrirConversa';
import { useRealtimeEvent } from '../hooks/useRealtime';
import { agendamentoService } from '../services/agendamentoService';
import { Aula } from '../types';
import { formatDataHora, formatDataLonga, formatIntervalo, formatPreco } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AulaDetalhe'>;
  route: RouteProp<RootStackParamList, 'AulaDetalhe'>;
};

const QUEM_CANCELOU: Record<string, string> = {
  aluno: 'pelo aluno',
  personal: 'pelo personal',
  sistema: 'automaticamente',
};

export default function AulaDetalheScreen({ navigation, route }: Props) {
  const { aulaId } = route.params;
  const { allowed } = useRequireAuth();

  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState('');

  const carregar = useCallback(async () => {
    try {
      setError(null);
      setAula(await agendamentoService.obter(aulaId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a aula');
    } finally {
      setLoading(false);
    }
  }, [aulaId]);

  useFocusEffect(
    useCallback(() => {
      if (allowed) carregar();
    }, [allowed, carregar]),
  );

  useRealtimeEvent<Aula>('agendamento:atualizado', (a) => {
    if (a.id === aulaId) setAula(a);
  });

  const { busyId, confirmar, recusar, cancelar } = useAulaActions((a) => {
    setAula(a);
    setMotivo('');
  });
  const { abrir, abrindo } = useAbrirConversa();

  if (!allowed) return null;

  const outro = aula ? (aula.meuPapel === 'aluno' ? aula.personal : aula.aluno) : null;
  const busy = !!aula && busyId === aula.id;
  const podeAgir = !!aula && (aula.podeResponder || aula.podeCancelar);

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <BackHeader title="Detalhes da aula" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.dark} />
        </View>
      ) : !aula || !outro ? (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={44} color={theme.colors.text.muted} />
          <Text style={styles.mutedText}>{error ?? 'Aula não encontrada'}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={carregar} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Resumo */}
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <StatusBadge status={aula.status} size="md" />
                <Text style={styles.price}>{formatPreco(aula.preco)}</Text>
              </View>
              <Text style={styles.date}>{formatDataLonga(aula.data)}</Text>
              <Text style={styles.time}>{formatIntervalo(aula.horario, aula.duracaoMin)}</Text>
              <Text style={styles.mutedText}>Duração de {aula.duracaoMin} minutos</Text>
            </View>

            {/* Participante */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{aula.meuPapel === 'aluno' ? 'Personal' : 'Aluno'}</Text>
              <View style={styles.person}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={18} color={theme.colors.white} />
                </View>
                <View style={styles.flex1}>
                  <Text style={styles.personName}>{outro.nome}</Text>
                  <Text style={styles.mutedText}>{outro.email}</Text>
                  {!!outro.localizacao && (
                    <View style={styles.locRow}>
                      <Ionicons name="location-outline" size={13} color={theme.colors.text.secondary} />
                      <Text style={styles.mutedText}>{outro.localizacao}</Text>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() =>
                  abrir({ id: outro.id, nome: outro.nome, tipo: aula.meuPapel === 'aluno' ? 'personal' : 'aluno' })
                }
                activeOpacity={0.85}
                disabled={abrindo}
              >
                {abrindo ? (
                  <ActivityIndicator size="small" color={theme.colors.dark} />
                ) : (
                  <>
                    <Ionicons name="chatbubble-outline" size={16} color={theme.colors.text.primary} />
                    <Text style={styles.outlineBtnText}>Enviar mensagem</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Informações */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Informações</Text>
              {!!aula.observacao && <InfoRow label="Observação do aluno" value={aula.observacao} />}
              {!!aula.criadoEm && <InfoRow label="Solicitada em" value={formatDataHora(aula.criadoEm)} />}
              {!!aula.respondidoEm && aula.status !== 'recusada' && (
                <InfoRow label="Confirmada em" value={formatDataHora(aula.respondidoEm)} />
              )}
              {(aula.status === 'cancelada' || aula.status === 'recusada') && (
                <InfoRow
                  label={aula.status === 'recusada' ? 'Recusada' : 'Cancelada'}
                  value={`${aula.canceladoEm ? formatDataHora(aula.canceladoEm) : ''} ${
                    QUEM_CANCELOU[aula.canceladoPor] ?? ''
                  }`.trim()}
                />
              )}
              {!!aula.motivoCancelamento && <InfoRow label="Motivo" value={aula.motivoCancelamento} />}
              {aula.status === 'pendente' && (
                <Text style={styles.note}>
                  {aula.meuPapel === 'aluno'
                    ? 'Aguardando o personal confirmar este horário.'
                    : 'Este aluno está aguardando sua resposta.'}
                </Text>
              )}
              {aula.status === 'confirmada' && aula.meuPapel === 'aluno' && (
                <Text style={styles.note}>Cancelamento permitido até 2h antes do início.</Text>
              )}
            </View>

            {/* Ações */}
            {podeAgir && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>
                  {aula.podeResponder ? 'Responder solicitação' : 'Cancelar aula'}
                </Text>
                {(aula.podeCancelar || aula.podeResponder) && (
                  <TextInput
                    style={styles.input}
                    placeholder={aula.podeResponder ? 'Motivo da recusa (opcional)' : 'Motivo do cancelamento (opcional)'}
                    placeholderTextColor={theme.colors.text.muted}
                    value={motivo}
                    onChangeText={setMotivo}
                    maxLength={300}
                  />
                )}

                {busy ? (
                  <ActivityIndicator size="small" color={theme.colors.dark} style={styles.busy} />
                ) : (
                  <View style={styles.actionsRow}>
                    {aula.podeResponder && (
                      <>
                        <TouchableOpacity
                          style={[styles.dangerBtn, styles.flex1]}
                          onPress={() => recusar(aula, motivo.trim())}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.dangerBtnText}>Recusar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.primaryBtn, styles.flex1, styles.noMargin]}
                          onPress={() => confirmar(aula)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.primaryBtnText}>Confirmar aula</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {aula.podeCancelar && (
                      <TouchableOpacity
                        style={[styles.dangerBtn, styles.flex1]}
                        onPress={() => cancelar(aula, motivo.trim())}
                        activeOpacity={0.85}
                      >
                        <Text style={styles.dangerBtnText}>Cancelar aula</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            )}

            {!podeAgir && !!aula.motivoNaoCancela && ['pendente', 'confirmada'].includes(aula.status) && (
              <Text style={[styles.note, styles.center2]}>{aula.motivoNaoCancela}</Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      )}
    </AppSafeArea>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  noMargin: { marginTop: 0 },
  center2: { textAlign: 'center' },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  price: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  date: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  time: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginVertical: 4,
  },
  mutedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  person: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  infoRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.muted,
    fontWeight: theme.fonts.weights.medium,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  note: {
    marginTop: theme.spacing.sm,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  busy: {
    paddingVertical: 14,
  },
  primaryBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
  },
  outlineBtnText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  dangerBtn: {
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerBtnText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
});
