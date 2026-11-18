import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';

import AppSafeArea from '../components/AppSafeArea';
import BackHeader from '../components/BackHeader';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useRealtimeEvent, useRealtimeStatus } from '../hooks/useRealtime';
import { chatService } from '../services/chatService';
import { Conversa, Mensagem } from '../types';
import { formatDiaChat, formatHora, toDateStr } from '../utils/format';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'>;
  route: RouteProp<RootStackParamList, 'Chat'>;
};

const MAX = 2000;
const POLL_MS = 8000; // só quando o tempo real estiver desconectado

function mesclar(atual: Mensagem[], novas: Mensagem[]) {
  const map = new Map(atual.map((m) => [m.id, m]));
  novas.forEach((m) => map.set(m.id, m));
  return [...map.values()].sort((a, b) => a.criadaEm.localeCompare(b.criadaEm));
}

export default function ChatScreen({ navigation, route }: Props) {
  const { conversaId, nome } = route.params;
  const { user, allowed } = useRequireAuth();
  const conectado = useRealtimeStatus();

  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [temMais, setTemMais] = useState(false);
  const [loading, setLoading] = useState(true);
  const [carregandoAntigas, setCarregandoAntigas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const focado = useRef(false);

  // Carrega as mensagens mais recentes (também marca como lida no backend)
  const carregarRecentes = useCallback(async () => {
    try {
      const [c, res] = await Promise.all([chatService.obter(conversaId), chatService.mensagens(conversaId)]);
      setConversa(c);
      setMensagens((prev) => mesclar(prev, res.mensagens));
      setTemMais((prev) => (prev ? prev : res.temMais));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível carregar a conversa');
    } finally {
      setLoading(false);
    }
  }, [conversaId]);

  useFocusEffect(
    useCallback(() => {
      focado.current = true;
      if (allowed) carregarRecentes();
      return () => {
        focado.current = false;
      };
    }, [allowed, carregarRecentes]),
  );

  // Tempo real: nova mensagem nesta conversa
  useRealtimeEvent<{ conversaId: string; mensagem: Mensagem }>('mensagem:nova', ({ conversaId: id, mensagem }) => {
    if (id !== conversaId) return;
    setMensagens((prev) => mesclar(prev, [mensagem]));
    if (focado.current && mensagem.remetenteId !== user?.id) {
      chatService.marcarLida(conversaId).catch(() => {});
    }
  });

  // Fallback: sem socket, atualiza periodicamente; e ao voltar para o app
  useEffect(() => {
    if (!allowed || conectado) return;
    const t = setInterval(() => {
      if (focado.current) carregarRecentes();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [allowed, conectado, carregarRecentes]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active' && focado.current) carregarRecentes();
    });
    return () => sub.remove();
  }, [carregarRecentes]);

  async function carregarAntigas() {
    if (!temMais || carregandoAntigas || !mensagens.length) return;
    setCarregandoAntigas(true);
    try {
      const res = await chatService.mensagens(conversaId, mensagens[0].criadaEm);
      setMensagens((prev) => mesclar(prev, res.mensagens));
      setTemMais(res.temMais);
    } catch {
      // silencioso: o usuário pode rolar de novo
    } finally {
      setCarregandoAntigas(false);
    }
  }

  async function enviar() {
    const t = texto.trim();
    if (!t || enviando) return;
    if (t.length > MAX) {
      Alert.alert('Mensagem muito longa', `Use no máximo ${MAX} caracteres.`);
      return;
    }
    setEnviando(true);
    try {
      const m = await chatService.enviar(conversaId, t);
      setMensagens((prev) => mesclar(prev, [m]));
      setTexto('');
    } catch (e) {
      Alert.alert('Mensagem não enviada', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setEnviando(false);
    }
  }

  // Lista invertida: mais recente primeiro
  const invertidas = useMemo(() => [...mensagens].reverse(), [mensagens]);

  if (!allowed) return null;

  const titulo = conversa?.outro.nome ?? nome ?? 'Conversa';
  const subtitulo = conversa
    ? `${conversa.outro.tipo === 'personal' ? 'Personal trainer' : 'Aluno'}${conectado ? '' : ' · reconectando…'}`
    : undefined;

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <BackHeader title={titulo} subtitle={subtitulo} onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={theme.colors.dark} />
          </View>
        ) : error && !mensagens.length ? (
          <View style={styles.center}>
            <Ionicons name="alert-circle-outline" size={44} color={theme.colors.text.muted} />
            <Text style={styles.mutedText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={carregarRecentes} activeOpacity={0.85}>
              <Text style={styles.retryText}>Tentar novamente</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            data={invertidas}
            inverted
            keyExtractor={(m) => m.id}
            onEndReached={carregarAntigas}
            onEndReachedThreshold={0.3}
            keyboardShouldPersistTaps="handled"
            ListFooterComponent={
              carregandoAntigas ? <ActivityIndicator style={styles.older} color={theme.colors.dark} /> : null
            }
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubble-ellipses-outline" size={40} color={theme.colors.text.muted} />
                <Text style={styles.mutedText}>Nenhuma mensagem ainda. Diga olá!</Text>
              </View>
            }
            renderItem={({ item, index }) => {
              const minha = item.remetenteId === user?.id;
              // Em lista invertida, o "próximo" índice é a mensagem anterior no tempo
              const anterior = invertidas[index + 1];
              const novoDia = !anterior || toDateStr(new Date(anterior.criadaEm)) !== toDateStr(new Date(item.criadaEm));
              return (
                <View>
                  {novoDia && (
                    <View style={styles.dayWrap}>
                      <Text style={styles.dayText}>{formatDiaChat(item.criadaEm)}</Text>
                    </View>
                  )}
                  <View style={[styles.bubbleRow, minha ? styles.rowMine : styles.rowTheirs]}>
                    <View style={[styles.bubble, minha ? styles.bubbleMine : styles.bubbleTheirs]}>
                      {!minha && <Text style={styles.sender}>{conversa?.outro.nome ?? nome}</Text>}
                      <Text style={[styles.msgText, minha && styles.msgTextMine]}>{item.texto}</Text>
                      <Text style={[styles.msgTime, minha && styles.msgTimeMine]}>
                        {minha ? 'Você · ' : ''}
                        {formatHora(item.criadaEm)}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        {/* Campo de mensagem */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder="Escreva uma mensagem…"
            placeholderTextColor={theme.colors.text.muted}
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={MAX}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnOff]}
            onPress={enviar}
            disabled={!texto.trim() || enviando}
            activeOpacity={0.85}
          >
            {enviando ? (
              <ActivityIndicator size="small" color={theme.colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={theme.colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </AppSafeArea>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1, backgroundColor: theme.colors.background },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    padding: theme.spacing.xl,
  },
  mutedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 12,
    paddingHorizontal: theme.spacing.lg,
  },
  retryText: {
    color: theme.colors.white,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    flexGrow: 1,
  },
  older: {
    paddingVertical: theme.spacing.md,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xxl,
  },
  dayWrap: {
    alignSelf: 'center',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginVertical: theme.spacing.sm,
  },
  dayText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    fontWeight: theme.fonts.weights.medium,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  rowMine: {
    justifyContent: 'flex-end',
  },
  rowTheirs: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMine: {
    backgroundColor: theme.colors.dark,
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderBottomLeftRadius: 4,
  },
  sender: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.secondary,
    marginBottom: 2,
  },
  msgText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    lineHeight: 20,
  },
  msgTextMine: {
    color: theme.colors.white,
  },
  msgTime: {
    alignSelf: 'flex-end',
    fontSize: 10,
    color: theme.colors.text.muted,
    marginTop: 3,
  },
  msgTimeMine: {
    color: 'rgba(255,255,255,0.65)',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 42,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.md,
    paddingTop: 11,
    paddingBottom: 11,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnOff: {
    opacity: 0.4,
  },
});
