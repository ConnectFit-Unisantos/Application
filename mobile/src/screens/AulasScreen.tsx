import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';

import AppSafeArea from '../components/AppSafeArea';
import BackHeader from '../components/BackHeader';
import AulaCard from '../components/AulaCard';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useAulaActions } from '../hooks/useAulaActions';
import { useAbrirConversa } from '../hooks/useAbrirConversa';
import { useRealtimeEvent } from '../hooks/useRealtime';
import { agendamentoService } from '../services/agendamentoService';
import { Aula } from '../types';
import { formatDataCurta } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Aulas'>;
};

type Aba = 'pendentes' | 'confirmadas' | 'proximas' | 'historico';

const ATIVAS = ['pendente', 'confirmada'];

export default function AulasScreen({ navigation }: Props) {
  const { user, allowed } = useRequireAuth();
  const isPersonal = user?.tipo === 'personal';

  const abas: Array<{ key: Aba; label: string }> = isPersonal
    ? [
        { key: 'pendentes', label: 'Solicitações' },
        { key: 'confirmadas', label: 'Confirmadas' },
        { key: 'historico', label: 'Histórico' },
      ]
    : [
        { key: 'proximas', label: 'Próximas' },
        { key: 'historico', label: 'Histórico' },
      ];

  const [aba, setAba] = useState<Aba>(isPersonal ? 'pendentes' : 'proximas');
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async (modo: 'inicial' | 'refresh' | 'silencioso' = 'inicial') => {
    if (modo === 'inicial') setLoading(true);
    if (modo === 'refresh') setRefreshing(true);
    try {
      setError(null);
      setAulas(await agendamentoService.listar('todas'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as aulas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allowed) carregar(aulas.length ? 'silencioso' : 'inicial');
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowed, carregar]),
  );

  const upsert = useCallback((aula: Aula) => {
    setAulas((prev) => {
      const i = prev.findIndex((a) => a.id === aula.id);
      if (i === -1) return [...prev, aula];
      const next = [...prev];
      next[i] = aula;
      return next;
    });
  }, []);

  // Atualização em tempo real (novas solicitações, confirmações, cancelamentos)
  useRealtimeEvent<Aula>('agendamento:atualizado', upsert);

  const { busyId, confirmar, recusar, cancelar } = useAulaActions(upsert);
  const { abrir } = useAbrirConversa();

  const contagem = useMemo(
    () => ({
      pendentes: aulas.filter((a) => a.status === 'pendente').length,
      confirmadas: aulas.filter((a) => a.status === 'confirmada').length,
      proximas: aulas.filter((a) => ATIVAS.includes(a.status)).length,
      historico: aulas.filter((a) => !ATIVAS.includes(a.status)).length,
    }),
    [aulas],
  );

  // Agrupa por data (próximas: crescente; histórico: decrescente)
  const sections = useMemo(() => {
    const filtradas = aulas.filter((a) => {
      if (aba === 'pendentes') return a.status === 'pendente';
      if (aba === 'confirmadas') return a.status === 'confirmada';
      if (aba === 'proximas') return ATIVAS.includes(a.status);
      return !ATIVAS.includes(a.status);
    });
    const desc = aba === 'historico';
    filtradas.sort((a, b) => (desc ? b.inicio.localeCompare(a.inicio) : a.inicio.localeCompare(b.inicio)));

    const grupos = new Map<string, Aula[]>();
    filtradas.forEach((a) => {
      if (!grupos.has(a.data)) grupos.set(a.data, []);
      grupos.get(a.data)!.push(a);
    });
    return [...grupos.entries()].map(([data, data_]) => ({ title: data, data: data_ }));
  }, [aulas, aba]);

  if (!allowed) return null;

  const vazio: Record<Aba, string> = {
    pendentes: 'Nenhuma solicitação aguardando sua resposta.',
    confirmadas: 'Nenhuma aula confirmada por enquanto.',
    proximas: 'Você ainda não tem aulas agendadas.',
    historico: 'Nenhuma aula no histórico.',
  };

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />

      <BackHeader
        title={isPersonal ? 'Agenda' : 'Minhas Aulas'}
        subtitle={isPersonal ? 'Solicitações e aulas dos seus alunos' : 'Suas aulas com personal trainers'}
        onBack={() => navigation.goBack()}
        right={
          isPersonal ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('Disponibilidade')}
              activeOpacity={0.75}
            >
              <Ionicons name="options-outline" size={16} color={theme.colors.text.primary} />
              <Text style={styles.headerBtnText}>Horários</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Abas */}
      <View style={styles.tabs}>
        {abas.map((t) => {
          const ativo = aba === t.key;
          const n = contagem[t.key];
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, ativo && styles.tabActive]}
              onPress={() => setAba(t.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, ativo && styles.tabTextActive]}>{t.label}</Text>
              {n > 0 && t.key !== 'historico' && (
                <View style={[styles.count, ativo && styles.countActive]}>
                  <Text style={[styles.countText, ativo && styles.countTextActive]}>{n}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.dark} />
        </View>
      ) : error && aulas.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cloud-offline-outline" size={44} color={theme.colors.text.muted} />
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => carregar()} activeOpacity={0.85}>
            <Text style={styles.primaryBtnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          sections={sections}
          keyExtractor={(a) => a.id}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => carregar('refresh')} />
          }
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionTitle}>{formatDataCurta(section.title)}</Text>
          )}
          renderItem={({ item }) => {
            const outro =
              item.meuPapel === 'aluno'
                ? { id: item.personal.id, nome: item.personal.nome, tipo: 'personal' as const }
                : { id: item.aluno.id, nome: item.aluno.nome, tipo: 'aluno' as const };
            return (
              <AulaCard
                aula={item}
                busy={busyId === item.id}
                onPress={() => navigation.navigate('AulaDetalhe', { aulaId: item.id })}
                onConfirmar={() => confirmar(item)}
                onRecusar={() => recusar(item)}
                onCancelar={() => cancelar(item)}
                onMensagem={() => abrir(outro)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={44} color={theme.colors.text.muted} />
              <Text style={styles.emptyText}>{vazio[aba]}</Text>
              {!isPersonal && aba === 'proximas' && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Encontrar um personal</Text>
                </TouchableOpacity>
              )}
              {isPersonal && aba === 'pendentes' && (
                <TouchableOpacity
                  style={styles.outlineBtn}
                  onPress={() => navigation.navigate('Disponibilidade')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.outlineBtnText}>Gerenciar meus horários</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  headerBtnText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },

  tabs: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.dark,
  },
  tabText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  tabTextActive: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semibold,
  },
  count: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  countText: {
    fontSize: 10,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  countTextActive: {
    color: theme.colors.white,
  },

  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.background,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  primaryBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
  },
  primaryBtnText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  outlineBtn: {
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
  },
  outlineBtnText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
});
