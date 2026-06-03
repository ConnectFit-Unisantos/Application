import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Modal,
  Pressable,
} from 'react-native';

import AppSafeArea from '../components/AppSafeArea';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import Header from '../components/Header';
import StatCard from '../components/StatCard';
import TrainerCard from '../components/TrainerCard';
import LocalidadeModal, { LocalidadeSelecionada } from '../components/LocalidadeModal';
import { theme } from '../styles/theme';
import { Trainer } from '../types';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useAuth } from '../hooks/useAuth';

// Remove acentos e normaliza caixa para comparações tolerantes
function normalizeStr(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

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
    bio: 'Personal trainer certificada com mais de 8 anos de experiência. Especializada em transformação corporal e ganho de massa muscular. Metodologia personalizada para cada aluno.',
    experiencia: 8,
    disponibilidade: ['Segunda', 'Quarta', 'Sexta'],
    avaliacoesRecentes: [
      { id: 'r1', nome: 'João Silva', nota: 5, tempo: 'Há 2 semanas', texto: 'Excelente profissional! Consegui atingir meus objetivos em 3 meses.' },
      { id: 'r2', nome: 'Maria Santos', nota: 5, tempo: 'Há 1 mês', texto: 'Muito atenciosa e comprometida. Recomendo!' },
      { id: 'r3', nome: 'Pedro Costa', nota: 4, tempo: 'Há 2 meses', texto: 'Ótimos treinos, muita dedicação aos alunos.' },
    ],
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
    bio: 'Especialista em CrossFit e treinamento funcional com 6 anos de experiência. Atleta competitivo com metodologia voltada para alta performance e resultados expressivos.',
    experiencia: 6,
    disponibilidade: ['Terça', 'Quinta', 'Sábado'],
    avaliacoesRecentes: [
      { id: 'r1', nome: 'Lucas Ferreira', nota: 5, tempo: 'Há 1 semana', texto: 'Carlos é incrível! Minha performance melhorou muito.' },
      { id: 'r2', nome: 'Ana Paula', nota: 5, tempo: 'Há 3 semanas', texto: 'Treinos desafiadores e muito profissional.' },
      { id: 'r3', nome: 'Roberto Lima', nota: 4, tempo: 'Há 1 mês', texto: 'Ótimo personal, recomendo para quem quer evoluir no CrossFit.' },
    ],
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
    bio: 'Instrutora de Yoga e Pilates com formação internacional e 10 anos dedicados ao bem-estar dos alunos. Abordagem holística e completamente individualizada para cada pessoa.',
    experiencia: 10,
    disponibilidade: ['Segunda', 'Terça', 'Quinta', 'Sexta'],
    avaliacoesRecentes: [
      { id: 'r1', nome: 'Carla Dias', nota: 5, tempo: 'Há 3 dias', texto: 'A melhor professora de Yoga que já tive!' },
      { id: 'r2', nome: 'Felipe Souza', nota: 5, tempo: 'Há 2 semanas', texto: 'As aulas de Pilates transformaram minha postura completamente.' },
      { id: 'r3', nome: 'Sandra Costa', nota: 5, tempo: 'Há 1 mês', texto: 'Profissional incrível, muito atenciosa e dedicada.' },
    ],
  },
];

// ─── Tela ─────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [search, setSearch] = useState('');
  const [selectedEspecialidade, setSelectedEspecialidade] = useState<string | null>(null);
  const [showEspecialidadeModal, setShowEspecialidadeModal] = useState(false);
  const [localidade, setLocalidade] = useState<LocalidadeSelecionada | null>(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const { user } = useAuth();

  const todasEspecialidades = useMemo(() => {
    const set = new Set<string>();
    MOCK_TRAINERS.forEach((t) => t.especialidades.forEach((e) => set.add(e)));
    return Array.from(set).sort();
  }, []);

  const filteredTrainers = useMemo(() => {
    return MOCK_TRAINERS.filter((trainer) => {
      // Busca por nome
      const matchesSearch =
        search.trim() === '' ||
        trainer.nome.toLowerCase().includes(search.toLowerCase().trim());

      // Filtro de especialidade
      const matchesEspecialidade =
        !selectedEspecialidade ||
        trainer.especialidades.includes(selectedEspecialidade);

      // Filtro de localidade (estado e/ou cidade)
      const matchesLocalidade = (() => {
        if (!localidade) return true;
        // Formato do mock: "Cidade - UF"
        const partes = trainer.localizacao.split(' - ');
        const uf = partes[partes.length - 1]?.trim() ?? '';
        const cidade = partes.slice(0, -1).join(' - ').trim();
        if (localidade.cidade) {
          return uf === localidade.uf &&
            normalizeStr(cidade) === normalizeStr(localidade.cidade);
        }
        return uf === localidade.uf;
      })();

      return matchesSearch && matchesEspecialidade && matchesLocalidade;
    });
  }, [search, selectedEspecialidade, localidade]);

  return (
    <AppSafeArea style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.dark} />

      {/* ── Modal de localidade ───────────────────────────────────────────── */}
      <LocalidadeModal
        visible={showLocModal}
        onClose={() => setShowLocModal(false)}
        onSelect={(loc) => setLocalidade(loc)}
      />

      {/* ── Modal de especialidades ────────────────────────────────────────── */}
      <Modal
        visible={showEspecialidadeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowEspecialidadeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowEspecialidadeModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Modalidade de Treino</Text>
            <TouchableOpacity
              style={[
                styles.modalOption,
                !selectedEspecialidade && styles.modalOptionSelected,
              ]}
              activeOpacity={0.7}
              onPress={() => {
                setSelectedEspecialidade(null);
                setShowEspecialidadeModal(false);
              }}
            >
              <Text
                style={[
                  styles.modalOptionText,
                  !selectedEspecialidade && styles.modalOptionTextSelected,
                ]}
              >
                Todas as modalidades
              </Text>
            </TouchableOpacity>
            {todasEspecialidades.map((esp) => (
              <TouchableOpacity
                key={esp}
                style={[
                  styles.modalOption,
                  selectedEspecialidade === esp && styles.modalOptionSelected,
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  setSelectedEspecialidade(esp);
                  setShowEspecialidadeModal(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    selectedEspecialidade === esp && styles.modalOptionTextSelected,
                  ]}
                >
                  {esp}
                </Text>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

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
            <TouchableOpacity
              style={[
                styles.filterBtn,
                selectedEspecialidade ? styles.filterBtnActive : null,
              ]}
              activeOpacity={0.7}
              onPress={() => setShowEspecialidadeModal(true)}
            >
              <Text
                style={[
                  styles.filterBtnText,
                  selectedEspecialidade ? styles.filterBtnTextActive : null,
                ]}
                numberOfLines={1}
              >
                {selectedEspecialidade ?? 'Todas especialidades'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={
                  selectedEspecialidade
                    ? theme.colors.white
                    : theme.colors.text.secondary
                }
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.filterBtn, localidade ? styles.filterBtnActive : null]}
              activeOpacity={0.7}
              onPress={() => setShowLocModal(true)}
            >
              <Text
                style={[styles.filterBtnText, localidade ? styles.filterBtnTextActive : null]}
                numberOfLines={1}
              >
                {localidade ? localidade.label : 'Todas localizações'}
              </Text>
              <Ionicons
                name="chevron-down"
                size={14}
                color={localidade ? theme.colors.white : theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>

          {/* Limpar filtros */}
          <TouchableOpacity
            style={styles.clearBtn}
            activeOpacity={0.7}
            onPress={() => {
              setSearch('');
              setSelectedEspecialidade(null);
              setLocalidade(null);
            }}
          >
            <Text style={styles.clearBtnText}>Limpar Filtros</Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista de Personals ────────────────────────────────────────────── */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>
            {filteredTrainers.length} Personals Disponíveis
          </Text>

          {filteredTrainers.length > 0 ? (
            filteredTrainers.map((trainer) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                onPress={() => navigation.navigate('TrainerDetail', { trainer })}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={theme.colors.text.muted}
              />
              <Text style={styles.emptyText}>Nenhum personal encontrado</Text>
            </View>
          )}
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

  // Filtro ativo
  filterBtnActive: {
    backgroundColor: theme.colors.dark,
    borderColor: theme.colors.dark,
  },
  filterBtnTextActive: {
    color: theme.colors.white,
  },

  // Estado vazio
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    marginTop: theme.spacing.sm,
  },

  // Modal de especialidades
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    width: '100%',
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginBottom: 4,
  },
  modalOptionSelected: {
    backgroundColor: theme.colors.dark,
  },
  modalOptionText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  modalOptionTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semibold,
  },
});
