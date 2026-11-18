import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import AppSafeArea from '../components/AppSafeArea';
import BackHeader from '../components/BackHeader';
import CalendarPicker from '../components/CalendarPicker';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { agendamentoService } from '../services/agendamentoService';
import { MinhaDisponibilidade } from '../types';
import { DIAS_SEMANA_LONGOS, addDiasStr, formatDataCurta, hojeStr } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Disponibilidade'>;
};

// Segunda primeiro, domingo por último
const ORDEM_DIAS = [1, 2, 3, 4, 5, 6, 0];
const MANHA = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00'];
const TARDE = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export default function DisponibilidadeScreen({ navigation }: Props) {
  const { allowed } = useRequireAuth('personal');

  const [dados, setDados] = useState<MinhaDisponibilidade | null>(null);
  const [semana, setSemana] = useState<string[][]>([[], [], [], [], [], [], []]);
  const [bloqueadas, setBloqueadas] = useState<string[]>([]);
  const [aberto, setAberto] = useState<number | null>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const aplicar = useCallback((d: MinhaDisponibilidade) => {
    const s: string[][] = [[], [], [], [], [], [], []];
    d.semana.forEach((dia) => {
      s[dia.diaSemana] = [...dia.horarios];
    });
    setDados(d);
    setSemana(s);
    setBloqueadas(d.datasBloqueadas);
    setDirty(false);
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      aplicar(await agendamentoService.getMinhaDisponibilidade());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar sua agenda');
    } finally {
      setLoading(false);
    }
  }, [aplicar]);

  useFocusEffect(
    useCallback(() => {
      if (allowed && !dirty) carregar();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowed, carregar]),
  );

  const possiveis = dados?.horariosPossiveis ?? [];
  const totalHorarios = semana.reduce((n, h) => n + h.length, 0);
  const bloqueadasSet = useMemo(() => new Set(bloqueadas), [bloqueadas]);

  function toggleHorario(dia: number, h: string) {
    setSemana((prev) => {
      const next = prev.map((x) => [...x]);
      next[dia] = next[dia].includes(h) ? next[dia].filter((x) => x !== h) : [...next[dia], h].sort();
      return next;
    });
    setDirty(true);
  }

  function setDia(dia: number, horarios: string[]) {
    setSemana((prev) => prev.map((x, i) => (i === dia ? [...horarios].sort() : x)));
    setDirty(true);
  }

  function copiarParaDiasUteis(dia: number) {
    const base = semana[dia];
    setSemana((prev) => prev.map((x, i) => (i >= 1 && i <= 5 ? [...base] : x)));
    setDirty(true);
  }

  function toggleBloqueio(data: string) {
    setBloqueadas((prev) => (prev.includes(data) ? prev.filter((d) => d !== data) : [...prev, data].sort()));
    setDirty(true);
  }

  async function salvar() {
    const enviar = async () => {
      setSaving(true);
      try {
        const res = await agendamentoService.salvarDisponibilidade({
          semana: semana.map((horarios, diaSemana) => ({ diaSemana, horarios })),
          datasBloqueadas: bloqueadas,
        });
        aplicar(res);
        Alert.alert('Disponibilidade salva', 'Os alunos já veem seus novos horários.');
      } catch (e) {
        Alert.alert('Não foi possível salvar', e instanceof Error ? e.message : 'Tente novamente.');
      } finally {
        setSaving(false);
      }
    };

    if (totalHorarios === 0) {
      Alert.alert(
        'Nenhum horário selecionado',
        'Sem horários, nenhum aluno conseguirá agendar aulas com você. Salvar mesmo assim?',
        [
          { text: 'Voltar', style: 'cancel' },
          { text: 'Salvar', style: 'destructive', onPress: enviar },
        ],
      );
      return;
    }
    enviar();
  }

  function sair() {
    if (!dirty) return navigation.goBack();
    Alert.alert('Descartar alterações?', 'Você tem alterações que ainda não foram salvas.', [
      { text: 'Continuar editando', style: 'cancel' },
      { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  }

  if (!allowed) return null;

  function renderGrupo(titulo: string, lista: string[], dia: number) {
    const itens = lista.filter((h) => possiveis.includes(h));
    if (!itens.length) return null;
    return (
      <View style={styles.grupo}>
        <Text style={styles.grupoTitle}>{titulo}</Text>
        <View style={styles.chips}>
          {itens.map((h) => {
            const on = semana[dia].includes(h);
            return (
              <TouchableOpacity
                key={h}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggleHorario(dia, h)}
                activeOpacity={0.75}
              >
                <Text style={[styles.chipText, on && styles.chipTextOn]}>{h}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <BackHeader title="Disponibilidade" subtitle="Horários em que você aceita aulas" onBack={sair} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.dark} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={theme.colors.text.muted} />
          <Text style={styles.mutedText}>{error}</Text>
          <TouchableOpacity style={styles.saveBtn} onPress={carregar} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {!dados?.configurada && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={18} color={theme.colors.text.secondary} />
                <Text style={styles.infoText}>
                  Você ainda não configurou sua agenda. Por enquanto os alunos veem os dias informados no seu
                  cadastro com horários padrão. Ajuste abaixo e salve.
                </Text>
              </View>
            )}

            {/* Semana */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Horários semanais</Text>
              <Text style={styles.sectionSub}>
                Toque em um dia e selecione os horários de início das aulas ({dados?.duracaoMin ?? 60} min cada).
              </Text>

              {ORDEM_DIAS.map((dia, idx) => {
                const horarios = semana[dia];
                const expandido = aberto === dia;
                return (
                  <View key={dia} style={[styles.dia, idx < ORDEM_DIAS.length - 1 && styles.diaBorder]}>
                    <TouchableOpacity
                      style={styles.diaHeader}
                      onPress={() => setAberto(expandido ? null : dia)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.dot, horarios.length > 0 && styles.dotOn]} />
                      <Text style={styles.diaNome}>{DIAS_SEMANA_LONGOS[dia]}</Text>
                      <Text style={styles.diaResumo}>
                        {horarios.length ? `${horarios.length} horário${horarios.length > 1 ? 's' : ''}` : 'Sem atendimento'}
                      </Text>
                      <Ionicons
                        name={expandido ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.colors.text.secondary}
                      />
                    </TouchableOpacity>

                    {expandido && (
                      <View style={styles.diaBody}>
                        {renderGrupo('Manhã', MANHA, dia)}
                        {renderGrupo('Tarde', TARDE, dia)}
                        {renderGrupo(
                          'Noite',
                          possiveis.filter((h) => !MANHA.includes(h) && !TARDE.includes(h)),
                          dia,
                        )}

                        <View style={styles.quickRow}>
                          <TouchableOpacity style={styles.quickBtn} onPress={() => setDia(dia, possiveis)} activeOpacity={0.75}>
                            <Text style={styles.quickText}>Todos</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.quickBtn} onPress={() => setDia(dia, [])} activeOpacity={0.75}>
                            <Text style={styles.quickText}>Limpar</Text>
                          </TouchableOpacity>
                          {dia >= 1 && dia <= 5 && horarios.length > 0 && (
                            <TouchableOpacity
                              style={styles.quickBtn}
                              onPress={() => copiarParaDiasUteis(dia)}
                              activeOpacity={0.75}
                            >
                              <Text style={styles.quickText}>Copiar p/ seg–sex</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Folgas */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Dias sem atendimento</Text>
              <Text style={styles.sectionSub}>
                Toque nas datas em que você não vai atender (folgas, viagens). Aulas já marcadas não são canceladas.
              </Text>

              <CalendarPicker
                selected=""
                onSelect={toggleBloqueio}
                markedDates={bloqueadasSet}
                maxDate={addDiasStr(hojeStr(), 60)}
              />

              {bloqueadas.length > 0 && (
                <View style={[styles.chips, styles.blockedList]}>
                  {bloqueadas.map((d) => (
                    <TouchableOpacity key={d} style={styles.blockedChip} onPress={() => toggleBloqueio(d)} activeOpacity={0.75}>
                      <Text style={styles.blockedText}>{formatDataCurta(d, false)}</Text>
                      <Ionicons name="close" size={13} color={theme.colors.error} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerInfo}>
              {totalHorarios} horário{totalHorarios === 1 ? '' : 's'} por semana
              {dirty ? ' · alterações não salvas' : ''}
            </Text>
            <TouchableOpacity
              style={[styles.saveBtn, (!dirty || saving) && styles.saveBtnOff]}
              onPress={salvar}
              disabled={!dirty || saving}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar disponibilidade</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: theme.spacing.xl,
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
  mutedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    lineHeight: 19,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  sectionSub: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    marginTop: 4,
    marginBottom: theme.spacing.md,
    lineHeight: 19,
  },

  dia: {
    paddingVertical: 4,
  },
  diaBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  diaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.inputBorder,
  },
  dotOn: {
    backgroundColor: theme.colors.success,
  },
  diaNome: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  diaResumo: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  diaBody: {
    paddingBottom: 12,
  },
  grupo: {
    marginBottom: 10,
  },
  grupoTitle: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.white,
  },
  chipOn: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.dark,
  },
  chipText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  chipTextOn: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semibold,
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  quickBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBg,
  },
  quickText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  blockedList: {
    marginTop: theme.spacing.md,
  },
  blockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    backgroundColor: theme.colors.errorBg,
  },
  blockedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.error,
    fontWeight: theme.fonts.weights.medium,
  },

  footer: {
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm + 4,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
    gap: theme.spacing.sm,
  },
  footerInfo: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  saveBtn: {
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
  },
  saveBtnOff: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
  },
});
