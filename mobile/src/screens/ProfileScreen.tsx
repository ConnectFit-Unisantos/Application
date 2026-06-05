import React, { useMemo } from 'react';
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

import Header from '../components/Header';
import { useAuth } from '../hooks/useAuth';
import { theme } from '../styles/theme';
import { RootStackParamList } from '../navigation/AppNavigator';

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
  const { user, logout } = useAuth();

  const tipoLabel = useMemo(() => {
    if (!user) return '-';
    return user.tipo === 'personal' ? 'Personal' : 'Aluno';
  }, [user]);

  async function handleLogout() {
    await logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  if (!user) {
    // Como não temos um fluxo real de auth guard aqui,
    // redirecionamos para manter consistência de UX.
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
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

          <Text style={styles.sectionTitle}>Detalhes</Text>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tipo</Text>
            <Text style={styles.rowValue}>{tipoLabel}</Text>
          </View>

          <View style={[styles.row, styles.rowBorder]}>
            <Text style={styles.rowLabel}>E-mail</Text>
            <Text style={styles.rowValue}>{user.email}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Criado em</Text>
            <Text style={styles.rowValue}>{formatDate(user.criadoEm)}</Text>
          </View>
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


