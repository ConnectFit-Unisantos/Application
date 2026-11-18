import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
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
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useRealtimeEvent } from '../hooks/useRealtime';
import { chatService } from '../services/chatService';
import { Conversa } from '../types';
import { formatQuando, iniciais } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Conversas'>;
};

export default function ConversasScreen({ navigation }: Props) {
  const { user, allowed } = useRequireAuth();

  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    try {
      setError(null);
      setConversas(await chatService.listarConversas());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar as conversas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allowed) carregar();
    }, [allowed, carregar]),
  );

  // Nova mensagem / leitura: atualiza a conversa e reordena
  useRealtimeEvent<Conversa>('conversa:atualizada', (c) => {
    setConversas((prev) => [c, ...prev.filter((x) => x.id !== c.id)]);
  });

  // Mais recente primeiro; esconde conversas abertas sem nenhuma mensagem
  const lista = useMemo(
    () =>
      conversas
        .filter((c) => !!c.ultimaMensagem)
        .sort((a, b) => (b.ultimaAtividade ?? '').localeCompare(a.ultimaAtividade ?? '')),
    [conversas],
  );

  if (!allowed) return null;

  const isPersonal = user?.tipo === 'personal';

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <BackHeader
        title="Mensagens"
        subtitle={isPersonal ? 'Conversas com seus alunos' : 'Conversas com personal trainers'}
        onBack={() => navigation.goBack()}
      />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.dark} />
        </View>
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          data={lista}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => carregar(true)} />}
          ListHeaderComponent={
            error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const minha = item.ultimaMensagem?.remetenteId === user?.id;
            const naoLida = item.naoLidas > 0;
            return (
              <TouchableOpacity
                style={styles.item}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('Chat', { conversaId: item.id, nome: item.outro.nome })}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{iniciais(item.outro.nome)}</Text>
                </View>

                <View style={styles.info}>
                  <View style={styles.row}>
                    <Text style={[styles.nome, naoLida && styles.bold]} numberOfLines={1}>
                      {item.outro.nome}
                    </Text>
                    {!!item.ultimaMensagem && (
                      <Text style={[styles.time, naoLida && styles.timeUnread]}>
                        {formatQuando(item.ultimaMensagem.criadaEm)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.row}>
                    <Text style={[styles.preview, naoLida && styles.previewUnread]} numberOfLines={1}>
                      {minha ? 'Você: ' : ''}
                      {item.ultimaMensagem?.texto}
                    </Text>
                    {naoLida && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.naoLidas > 99 ? '99+' : item.naoLidas}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.tipo}>{item.outro.tipo === 'personal' ? 'Personal trainer' : 'Aluno'}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={48} color={theme.colors.text.muted} />
              <Text style={styles.emptyTitle}>Nenhuma conversa ainda</Text>
              <Text style={styles.emptyText}>
                {isPersonal
                  ? 'Quando um aluno enviar uma mensagem, ela aparece aqui. Você também pode falar com alunos pela sua Agenda.'
                  : 'Abra o perfil de um personal e toque em "Enviar Mensagem" para começar.'}
              </Text>
              {!isPersonal && (
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>Encontrar um personal</Text>
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
  bold: { fontWeight: theme.fonts.weights.bold },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.md,
    paddingBottom: theme.spacing.xxl,
    flexGrow: 1,
  },
  errorBanner: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: theme.fonts.sizes.sm,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.bold,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nome: {
    flex: 1,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  time: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.muted,
  },
  timeUnread: {
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.semibold,
  },
  preview: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
  },
  previewUnread: {
    color: theme.colors.text.primary,
    fontWeight: theme.fonts.weights.medium,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
  },
  tipo: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.muted,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  emptyTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 21,
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
});
