import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Pressable,
  Platform,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import CalendarPicker from './CalendarPicker';
import StatusBadge from './StatusBadge';
import { theme } from '../styles/theme';
import { agendamentoService } from '../services/agendamentoService';
import type { ApiError } from '../services/api';
import { Aula, DiaDisponivel } from '../types';
import {
  addDiasStr,
  formatDataCurta,
  formatDataLonga,
  formatIntervalo,
  formatPreco,
  hojeStr,
  toDateStr,
} from '../utils/format';

// ─── Constantes ────────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_H = SCREEN_HEIGHT * 0.9;
const PAD = 16;
const MAX_DIAS = 60;

type Etapa = 'escolher' | 'confirmar' | 'sucesso';

interface Props {
  visible: boolean;
  trainer: { id: string; nome: string; preco: number; localizacao?: string };
  onClose: () => void;
  /** Chamado após o modal fechar pelo botão "Ver minhas aulas". */
  onVerAulas?: () => void;
}

export default function AgendamentoModal({ visible, trainer, onClose, onVerAulas }: Props) {
  const [mounted, setMounted] = useState(false);
  const [etapa, setEtapa] = useState<Etapa>('escolher');

  // Disponibilidade carregada por mês (cache local por data)
  const [dias, setDias] = useState<Record<string, DiaDisponivel>>({});
  const [configurada, setConfigurada] = useState(true);
  const [duracaoMin, setDuracaoMin] = useState(60);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const mesAtual = useRef<{ year: number; month: number } | null>(null);

  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHorario, setSelectedHorario] = useState('');
  const [observacao, setObservacao] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [aulaCriada, setAulaCriada] = useState<Aula | null>(null);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;

  const hoje = hojeStr();
  const maxDate = addDiasStr(hoje, MAX_DIAS);

  // ── Carregar disponibilidade do mês exibido ──
  const carregarMes = useCallback(
    async (year: number, month: number) => {
      mesAtual.current = { year, month };
      const primeiro = toDateStr(new Date(year, month, 1));
      const ultimo = toDateStr(new Date(year, month + 1, 0));
      const inicio = primeiro < hoje ? hoje : primeiro;
      const fim = ultimo > maxDate ? maxDate : ultimo;
      if (inicio > fim) return;

      setLoading(true);
      setLoadError(null);
      try {
        const res = await agendamentoService.getDisponibilidade(trainer.id, inicio, fim);
        setConfigurada(res.configurada);
        setDuracaoMin(res.duracaoMin);
        setDias((prev) => {
          const next = { ...prev };
          res.dias.forEach((d) => {
            next[d.data] = d;
          });
          return next;
        });
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Não foi possível carregar os horários');
      } finally {
        setLoading(false);
      }
    },
    [trainer.id, hoje, maxDate],
  );

  const recarregar = useCallback(() => {
    const m = mesAtual.current;
    if (m) carregarMes(m.year, m.month);
  }, [carregarMes]);

  // ── Animações ──
  const animIn = useCallback(() => {
    slideAnim.setValue(SHEET_H);
    overlayAnim.setValue(0);
    setMounted(true);
    Animated.parallel([
      Animated.timing(overlayAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, damping: 22, stiffness: 190, mass: 1, useNativeDriver: true }),
    ]).start();
  }, [overlayAnim, slideAnim]);

  const animOut = useCallback(
    (after?: () => void) => {
      Animated.parallel([
        Animated.timing(overlayAnim, { toValue: 0, duration: 210, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SHEET_H, duration: 250, useNativeDriver: true }),
      ]).start(() => {
        setMounted(false);
        setEtapa('escolher');
        setSelectedDate('');
        setSelectedHorario('');
        setObservacao('');
        setSubmitError(null);
        setAulaCriada(null);
        setDias({});
        onClose();
        after?.();
      });
    },
    [overlayAnim, slideAnim, onClose],
  );

  useEffect(() => {
    if (visible) animIn();
    else if (mounted) animOut();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derivados ──
  const diaSelecionado = selectedDate ? dias[selectedDate] : undefined;
  const isDayEnabled = useCallback(
    (str: string) => !!dias[str] && !dias[str].bloqueado && dias[str].horarios.some((h) => h.disponivel),
    [dias],
  );
  const temAlgumHorario = useMemo(
    () => Object.values(dias).some((d) => d.horarios.some((h) => h.disponivel)),
    [dias],
  );

  const canContinue =
    !!selectedDate &&
    !!selectedHorario &&
    !!diaSelecionado?.horarios.find((h) => h.horario === selectedHorario && h.disponivel);

  // ── Ações ──
  async function confirmar() {
    if (!canContinue || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const aula = await agendamentoService.criar({
        personalId: trainer.id,
        data: selectedDate,
        horario: selectedHorario,
        observacao: observacao.trim(),
      });
      setAulaCriada(aula);
      setEtapa('sucesso');
    } catch (e) {
      const err = e as ApiError;
      setSubmitError(err?.message || 'Não foi possível agendar. Tente novamente.');
      if (err?.statusCode === 409 || err?.statusCode === 400) {
        // Horário ficou indisponível: volta para a escolha com dados atualizados
        setSelectedHorario('');
        setEtapa('escolher');
        recarregar();
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!mounted) return null;

  // ── Conteúdo por etapa ──
  function renderEscolher() {
    return (
      <>
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <CalendarPicker
            selected={selectedDate}
            onSelect={(d) => {
              setSelectedDate(d);
              setSelectedHorario('');
              setSubmitError(null);
            }}
            isDayEnabled={isDayEnabled}
            maxDate={maxDate}
            onMonthChange={carregarMes}
          />

          {loading && (
            <View style={s.inlineLoading}>
              <ActivityIndicator size="small" color={theme.colors.dark} />
              <Text style={s.mutedText}>Carregando horários…</Text>
            </View>
          )}

          {!!loadError && !loading && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{loadError}</Text>
              <TouchableOpacity onPress={recarregar} activeOpacity={0.7}>
                <Text style={s.retryText}>Tentar novamente</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && !loadError && !configurada && (
            <View style={s.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={s.infoText}>
                Este personal ainda não definiu seus horários de atendimento. Envie uma mensagem para combinar.
              </Text>
            </View>
          )}

          {!loading && !loadError && configurada && !temAlgumHorario && (
            <View style={s.infoBox}>
              <Ionicons name="calendar-outline" size={18} color={theme.colors.text.secondary} />
              <Text style={s.infoText}>Nenhum horário livre neste mês. Tente o próximo mês.</Text>
            </View>
          )}

          {!!submitError && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{submitError}</Text>
            </View>
          )}

          {/* Horários do dia escolhido */}
          {!!selectedDate && (
            <View style={s.horariosSection}>
              <View style={s.horariosTitleRow}>
                <Text style={s.horariosTitle}>Horários · {formatDataCurta(selectedDate)}</Text>
                <Text style={s.horariosHint}>{duracaoMin} min</Text>
              </View>

              {diaSelecionado && diaSelecionado.horarios.length > 0 ? (
                <View style={s.horariosGrid}>
                  {diaSelecionado.horarios.map((h) => {
                    const active = selectedHorario === h.horario;
                    return (
                      <TouchableOpacity
                        key={h.horario}
                        style={[s.horarioBtn, active && s.horarioBtnOn, !h.disponivel && s.horarioBtnOff]}
                        onPress={() => h.disponivel && setSelectedHorario(h.horario)}
                        activeOpacity={h.disponivel ? 0.75 : 1}
                        disabled={!h.disponivel}
                      >
                        <Text
                          style={[
                            s.horarioBtnText,
                            active && s.horarioBtnTextOn,
                            !h.disponivel && s.horarioBtnTextOff,
                          ]}
                        >
                          {h.horario}
                        </Text>
                        {!h.disponivel && <Text style={s.ocupadoText}>Ocupado</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <Text style={s.mutedText}>Sem horários neste dia.</Text>
              )}
            </View>
          )}
        </ScrollView>

        <View style={s.footer}>
          <TouchableOpacity
            style={[s.confirmBtn, !canContinue && s.confirmBtnOff]}
            activeOpacity={canContinue ? 0.85 : 1}
            disabled={!canContinue}
            onPress={() => {
              setSubmitError(null);
              setEtapa('confirmar');
            }}
          >
            <Text style={[s.confirmBtnText, !canContinue && s.confirmBtnTextOff]}>
              {canContinue ? 'Revisar agendamento' : 'Selecione data e horário'}
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function renderConfirmar() {
    return (
      <>
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.summaryCard}>
            <Row icon="person-outline" label="Personal" value={trainer.nome} />
            <Row icon="calendar-outline" label="Data" value={formatDataLonga(selectedDate)} />
            <Row icon="time-outline" label="Horário" value={formatIntervalo(selectedHorario, duracaoMin)} />
            <Row icon="hourglass-outline" label="Duração" value={`${duracaoMin} minutos`} />
            <Row icon="cash-outline" label="Valor" value={formatPreco(trainer.preco)} />
            {!!trainer.localizacao && <Row icon="location-outline" label="Local" value={trainer.localizacao} last />}
          </View>

          <Text style={s.label}>Observação para o personal (opcional)</Text>
          <TextInput
            style={s.textArea}
            placeholder="Ex: objetivo da aula, local preferido, restrições…"
            placeholderTextColor={theme.colors.text.muted}
            value={observacao}
            onChangeText={setObservacao}
            multiline
            maxLength={500}
          />
          <Text style={s.counter}>{observacao.length}/500</Text>

          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={18} color={theme.colors.text.secondary} />
            <Text style={s.infoText}>
              Sua solicitação fica <Text style={s.bold}>pendente</Text> até o personal confirmar. Você pode
              cancelar enquanto estiver pendente, ou até 2h antes se já estiver confirmada.
            </Text>
          </View>

          {!!submitError && (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{submitError}</Text>
            </View>
          )}
        </ScrollView>

        <View style={[s.footer, s.footerRow]}>
          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => setEtapa('escolher')}
            activeOpacity={0.8}
            disabled={submitting}
          >
            <Text style={s.secondaryBtnText}>Voltar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.confirmBtn, s.flex1, submitting && s.confirmBtnBusy]}
            onPress={confirmar}
            activeOpacity={0.85}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={theme.colors.white} size="small" />
            ) : (
              <Text style={s.confirmBtnText}>Confirmar Agendamento</Text>
            )}
          </TouchableOpacity>
        </View>
      </>
    );
  }

  function renderSucesso() {
    if (!aulaCriada) return null;
    return (
      <>
        <ScrollView style={s.body} contentContainerStyle={[s.bodyContent, s.center]}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark" size={32} color={theme.colors.white} />
          </View>
          <Text style={s.successTitle}>Solicitação enviada!</Text>
          <Text style={s.successSub}>
            {trainer.nome} vai receber seu pedido e confirmar o horário. Acompanhe em "Minhas Aulas".
          </Text>

          <View style={[s.summaryCard, s.fullWidth]}>
            <Row icon="calendar-outline" label="Data" value={formatDataLonga(aulaCriada.data)} />
            <Row
              icon="time-outline"
              label="Horário"
              value={formatIntervalo(aulaCriada.horario, aulaCriada.duracaoMin)}
            />
            <View style={s.rowStatus}>
              <Text style={s.rowLabel}>Status</Text>
              <StatusBadge status={aulaCriada.status} />
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, s.footerRow]}>
          <TouchableOpacity style={s.secondaryBtn} onPress={() => animOut()} activeOpacity={0.8}>
            <Text style={s.secondaryBtnText}>Fechar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.confirmBtn, s.flex1]}
            onPress={() => animOut(onVerAulas)}
            activeOpacity={0.85}
          >
            <Text style={s.confirmBtnText}>Ver minhas aulas</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  const titulos: Record<Etapa, string> = {
    escolher: 'Agendar Aula',
    confirmar: 'Confirme os detalhes',
    sucesso: 'Aula solicitada',
  };

  return (
    <Modal visible transparent statusBarTranslucent animationType="none" onRequestClose={() => animOut()}>
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !submitting && animOut()} />
      </Animated.View>

      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.handle} />

          <View style={s.header}>
            <View style={s.flex1}>
              <Text style={s.headerTitle}>{titulos[etapa]}</Text>
              <Text style={s.headerSub} numberOfLines={1}>
                {trainer.nome}
                {etapa !== 'escolher' && selectedDate ? ` · ${formatDataCurta(selectedDate)} às ${selectedHorario}` : ''}
              </Text>
            </View>
            <TouchableOpacity style={s.closeBtn} onPress={() => animOut()} activeOpacity={0.7} disabled={submitting}>
              <Ionicons name="close" size={18} color={theme.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {etapa === 'escolher' && renderEscolher()}
          {etapa === 'confirmar' && renderConfirmar()}
          {etapa === 'sucesso' && renderSucesso()}
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Linha do resumo ───────────────────────────────────────────────────────────

function Row({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[s.row, !last && s.rowBorder]}>
      <Ionicons name={icon} size={16} color={theme.colors.text.secondary} />
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

// ─── Estilos ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  flex1: { flex: 1 },
  fullWidth: { alignSelf: 'stretch' },
  center: { alignItems: 'center' },
  bold: { fontWeight: theme.fonts.weights.bold },

  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_H,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 20,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.inputBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: PAD,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: PAD,
    paddingTop: 18,
    paddingBottom: 16,
  },

  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  mutedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },

  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    padding: 12,
    marginTop: 14,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 19,
  },

  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },
  retryText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    textDecorationLine: 'underline',
  },

  // horários
  horariosSection: { marginTop: 22 },
  horariosTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  horariosTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  horariosHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  horariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  horarioBtn: {
    width: '31.5%',
    paddingVertical: 11,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
  },
  horarioBtnOn: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.dark,
  },
  horarioBtnOff: {
    backgroundColor: theme.colors.inputBg,
  },
  horarioBtnText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  horarioBtnTextOn: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semibold,
  },
  horarioBtnTextOff: {
    color: theme.colors.text.muted,
    textDecorationLine: 'line-through',
  },
  ocupadoText: {
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 1,
  },

  // resumo
  summaryCard: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    marginBottom: 18,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  rowValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semibold,
  },

  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  textArea: {
    minHeight: 84,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 12,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    textAlignVertical: 'top',
  },
  counter: {
    alignSelf: 'flex-end',
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.muted,
    marginTop: 4,
  },

  // sucesso
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 14,
  },
  successTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  successSub: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },

  // rodapé
  footer: {
    paddingHorizontal: PAD,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  confirmBtn: {
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnOff: { backgroundColor: theme.colors.inputBg },
  confirmBtnBusy: { opacity: 0.7 },
  confirmBtnText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.white,
  },
  confirmBtnTextOff: { color: theme.colors.text.muted },
  secondaryBtn: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
});
