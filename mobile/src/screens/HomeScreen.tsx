import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
} from 'react-native';

import AppSafeArea from '../components/AppSafeArea';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import StatCard from '../components/StatCard';
import TrainerCard from '../components/TrainerCard';
import { theme } from '../styles/theme';
import { Trainer } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
};

// ─── Dados de exemplo (substituir por chamada à API quando endpoint existir) ──

const MOCK_TRAINERS: Trainer[] = [
  {
    id: '1',
    nome: 'Ana Silva',
    localizacao: 'São Paulo - SP',
    especialidades: ['Musculação', 'Emagrecimento', 'Hipertrofia'],
    avaliacao: 4.9,
    avaliacoes: 127,
    preco: 120,
    certificado: true,
    foto: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&fit=crop',
  },
  {
    id: '2',
    nome: 'Carlos Mendes',
    localizacao: 'Rio de Janeiro - RJ',
    especialidades: ['CrossFit', 'Funcional', 'Performance'],
    avaliacao: 4.8,
    avaliacoes: 98,
    preco: 150,
    certificado: true,
    foto: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&fit=crop',
  },
  {
    id: '3',
    nome: 'Mariana Costa',
    localizacao: 'Belo Horizonte - MG',
    especialidades: ['Yoga', 'Pilates', 'Bem-estar'],
    avaliacao: 5.0,
    avaliacoes: 156,
    preco: 100,
    certificado: true,
    foto: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600&fit=crop',
  },
];

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [search, setSearch] = useState('');
  const { user } = useAuth();

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />

      <Header
        showConnectButton={!user}
        onConnectPress={() => {
          if (user) navigation.navigate('Profile');
          else navigation.navigate('Login');
        }}
        onLogoPress={() => navigation.replace('Home')}

      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Encontre seu Personal Trainer ideal
          </Text>
          <Text style={styles.heroSubtitle}>
            Conectamos você a profissionais qualificados para transformar sua
            jornada fitness
          </Text>
        </View>

        {/* ── Métricas ─────────────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            icon={
              <Ionicons
                name="people-outline"
                size={22}
                color={theme.colors.text.primary}
              />
            }
            value="500+"
            label="Personal Trainers"
          />
          <StatCard
            icon={
              <Ionicons
                name="trending-up-outline"
                size={22}
                color={theme.colors.text.primary}
              />
            }
            value="10.000+"
            label="Alunos Satisfeitos"
          />
          <StatCard
            icon={
              <Ionicons
                name="ribbon-outline"
                size={22}
                color={theme.colors.text.primary}
              />
            }
            value="98%"
            label="Taxa de Satisfação"
          />
        </View>

        {/* ── Busca e Filtros ───────────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          {/* Barra de busca */}
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.colors.text.muted}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar personal trainers..."
              placeholderTextColor={theme.colors.text.muted}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
            />
          </View>

          {/* Filtros */}
          <View style={styles.filtersRow}>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
              <Text style={styles.filterBtnText} numberOfLines={1}>
                Todas especialidades
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.7}>
              <Text style={styles.filterBtnText} numberOfLines={1}>
                Todas localizações
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Limpar filtros */}
          <TouchableOpacity style={styles.clearBtn} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>Limpar Filtros</Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista de Personals ────────────────────────────────────────────── */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            {MOCK_TRAINERS.length} Personals Disponíveis
          </Text>

          {MOCK_TRAINERS.map((trainer) => (
            <TrainerCard key={trainer.id} trainer={trainer} />
          ))}
        </View>
      </ScrollView>
    </AppSafeArea>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.dark, // status bar area fica escura
  },
  scroll: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: theme.spacing.xxl,
  },

  // Hero
  hero: {
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  heroTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: theme.spacing.sm,
  },
  heroSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },

  // Search
  searchSection: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 11,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    padding: 0,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: 10,
  },
  filterBtnText: {
    flex: 1,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.primary,
    marginRight: 4,
  },
  clearBtn: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingVertical: 10,
    alignItems: 'center',
  },
  clearBtnText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },

  // Lista
  listSection: {
    paddingHorizontal: theme.spacing.md,
  },
  listTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
  },
});
