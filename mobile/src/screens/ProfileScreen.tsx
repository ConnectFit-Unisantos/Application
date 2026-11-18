import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { formatPreco, parsePreco } from '../utils/format';
import { chatService } from '../services/chatService';
import { useRealtimeEvent } from '../hooks/useRealtime';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

function formatDate(value: unknown): string {
  if (!value) return '-';

  try {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '-';
  }
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, logout, validateSession } = useAuth();

  // Sempre que a tela ganha foco, confirma no backend que o usuário ainda existe.
  // Se foi apagado (401), o contexto faz logout e o efeito abaixo redireciona.
  const [naoLidas, setNaoLidas] = useState(0);

  const atualizarNaoLidas = useCallback(() => {
    chatService
      .naoLidas()
      .then(setNaoLidas)
      .catch(() => {});
  }, []);

  useFocusEffect(
    useCallback(() => {
      validateSession();
      atualizarNaoLidas();
    }, [validateSession, atualizarNaoLidas]),
  );

  // Contador de mensagens não lidas em tempo real
  useRealtimeEvent('conversa:atualizada', atualizarNaoLidas);

  // Redireciona fora do render (chamar navigation durante o render gera warning)
  useEffect(() => {
    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    }
  }, [user, navigation]);

  const tipoLabel = useMemo(() => {
    if (!user) return '-';
    return user.tipo === 'personal' ? 'Personal' : 'Aluno';
  }, [user]);

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />
      <Header onLogoPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={22} color={theme.colors.white} />
          </View>

          <Text style={styles.name}>{user.nome}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Ionicons
                name={user.tipo === 'personal' ? 'fitness' : 'school'}
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.badgeText}>{tipoLabel}</Text>
            </View>

            <View style={styles.badge}>
              <Ionicons
                name="id-card-outline"
                size={14}
                color={theme.colors.text.secondary}
              />
              <Text style={styles.badgeText} numberOfLines={1}>
                {user.id}
              </Text>
            </View>
          </View>
        </View>

        {/* Dados */}
        <View style={styles.section}>
          {user.tipo === 'aluno' && (
            <TouchableOpacity
              style={styles.personalBtn}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('PersonalOnboarding')
              }
            >
              <Ionicons name="fitness-outline" size={18} color={theme.colors.white} />
              <Text style={styles.personalBtnText}>Sou Personal</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.sectionTitle}>
            {user.tipo === 'personal' ? 'Área do personal' : 'Minha área'}
          </Text>

          <View style={styles.menu}>
            <MenuItem
              icon="calendar-outline"
              label={user.tipo === 'personal' ? 'Agenda' : 'Minhas Aulas'}
              hint={user.tipo === 'personal' ? 'Solicitações e aulas dos alunos' : 'Aulas agendadas e histórico'}
              onPress={() => navigation.navigate('Aulas')}
            />
            {user.tipo === 'personal' && (
              <MenuItem
                icon="options-outline"
                label="Disponibilidade"
                hint="Dias e horários de atendimento"
                onPress={() => navigation.navigate('Disponibilidade')}
              />
            )}
            <MenuItem
              icon="chatbubbles-outline"
              label="Mensagens"
              hint={user.tipo === 'personal' ? 'Conversas com alunos' : 'Conversas com personal trainers'}
              badge={naoLidas}
              onPress={() => navigation.navigate('Conversas')}
              last
            />
          </View>

          <Text style={styles.sectionTitle}>Detalhes</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tipo</Text>
            <Text style={styles.rowValue}>{tipoLabel}</Text>
          </View>

          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>E-mail</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>

          <View style={[styles.row, user.tipo === 'personal' && styles.rowBorder]}>
            <Text style={styles.rowLabel}>Criado em</Text>
            <Text style={styles.rowValue}>{formatDate(user.criadoEm)}</Text>
          </View>

          {user.tipo === 'personal' && (
            <>
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Localização</Text>
                <Text style={styles.rowValue}>
                  {user.cidade && user.uf ? `${user.cidade} - ${user.uf}` : '-'}
                </Text>
              </View>
              <View style={[styles.row, styles.rowBorder]}>
                <Text style={styles.rowLabel}>Especialidades</Text>
                <Text style={styles.rowValue}>
                  {user.especializacao?.length ? user.especializacao.join(', ') : '-'}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Preço/hora</Text>
                <Text style={styles.rowValue}>{formatPreco(parsePreco(user.precoHora ?? ''))}</Text>
              </View>
            </>
          )}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={theme.colors.white} />
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({
  icon,
  label,
  hint,
  badge = 0,
  onPress,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint: string;
  badge?: number;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.menuItem, !last && styles.rowBorder]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={18} color={theme.colors.text.primary} />
      </View>
      <View style={styles.menuInfo}>
        <Text style={styles.menuLabel}>{label}</Text>
        <Text style={styles.menuHint}>{hint}</Text>
      </View>
      {badge > 0 && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
      <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  menu: {
    marginBottom: theme.spacing.lg,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuInfo: {
    flex: 1,
  },
  menuLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  menuHint: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  menuBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuBadgeText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: theme.fonts.weights.bold,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark,
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },

  hero: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    ...theme.shadows.modal,
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  name: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  email: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.lg,
  },

  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  badgeText: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    maxWidth: 180,
  },

  section: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    ...theme.shadows.card,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  rowLabel: {
    color: theme.colors.text.muted,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
  },
  rowValue: {
    color: theme.colors.text.primary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },

  logoutBtn: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.dark,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
  },
  logoutText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
  },

  personalBtn: {
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.borderRadius.xl,
  },
  personalBtnText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
  },
});


