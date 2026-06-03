import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Cidade {
  id: number;
  nome: string;
}

export interface LocalidadeSelecionada {
  uf: string;
  cidade: string | null;
  label: string;
}

// ─── API IBGE ─────────────────────────────────────────────────────────────────

const IBGE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

// Cache em memória para evitar chamadas repetidas durante a sessão
let _estadosCache: Estado[] | null = null;
const _cidadesCache: Record<string, Cidade[]> = {};

async function fetchEstadosIBGE(): Promise<Estado[]> {
  if (_estadosCache) return _estadosCache;
  const res = await fetch(`${IBGE}/estados?orderBy=nome`);
  if (!res.ok) throw new Error('Falha ao carregar estados');
  const data: Estado[] = await res.json();
  _estadosCache = data;
  return data;
}

async function fetchCidadesIBGE(uf: string): Promise<Cidade[]> {
  if (_cidadesCache[uf]) return _cidadesCache[uf];
  const res = await fetch(`${IBGE}/estados/${uf}/municipios?orderBy=nome`);
  if (!res.ok) throw new Error('Falha ao carregar cidades');
  const data: Cidade[] = await res.json();
  _cidadesCache[uf] = data;
  return data;
}

// ─── Busca inteligente ────────────────────────────────────────────────────────
// Remove acentos e caixa para que "sao paulo", "SP" e "S Paulo" todos encontrem resultados

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function match(item: string, query: string): boolean {
  if (!query.trim()) return true;
  return normalize(item).includes(normalize(query.trim()));
}

// ─── Constantes de layout ─────────────────────────────────────────────────────

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get('window');
const SHEET_MAX_H = SCREEN_H * 0.88;
const PAD = 16;

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (loc: LocalidadeSelecionada) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

type View = 'estados' | 'cidades';

export default function LocalidadeModal({ visible, onClose, onSelect }: Props) {
  // Navegação interna
  const [view, setView] = useState<View>('estados');
  const [selectedEstado, setSelectedEstado] = useState<Estado | null>(null);

  // Dados
  const [estados, setEstados] = useState<Estado[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);

  // UI
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Animação
  const overlayAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_MAX_H)).current;

  // ── Filtro inteligente ──
  const filteredEstados = useMemo(() => {
    if (!search.trim()) return estados;
    return estados.filter(
      (e) => match(e.nome, search) || e.sigla.toLowerCase().startsWith(normalize(search)),
    );
  }, [estados, search]);

  const filteredCidades = useMemo(() => {
    if (!search.trim()) return cidades;
    return cidades.filter((c) => match(c.nome, search));
  }, [cidades, search]);

  // ── Fetch ──
  const loadEstados = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchEstadosIBGE();
      setEstados(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCidades = useCallback(async (uf: string) => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchCidadesIBGE(uf);
      setCidades(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Animação ──
  const animIn = useCallback(() => {
    slideAnim.setValue(SHEET_MAX_H);
    overlayAnim.setValue(0);
    setMounted(true);
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 22,
        stiffness: 190,
        mass: 1,
        useNativeDriver: true,
      }),
    ]).start();
  }, [overlayAnim, slideAnim]);

  const animOut = useCallback(
    (afterAnimation?: () => void) => {
      Animated.parallel([
        Animated.timing(overlayAnim, {
          toValue: 0,
          duration: 210,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SHEET_MAX_H,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Reset estado interno antes de fechar
        setMounted(false);
        setView('estados');
        setSearch('');
        setSelectedEstado(null);
        setCidades([]);
        setError(false);
        afterAnimation ? afterAnimation() : onClose();
      });
    },
    [overlayAnim, slideAnim, onClose],
  );

  // Abre/fecha conforme prop `visible`
  useEffect(() => {
    if (visible) {
      animIn();
      loadEstados();
    } else if (mounted) {
      animOut();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers de seleção ──
  const handleSelectEstado = useCallback(
    (estado: Estado) => {
      setSelectedEstado(estado);
      setSearch('');
      setView('cidades');
      loadCidades(estado.sigla);
    },
    [loadCidades],
  );

  const handleSelectEstadoOnly = useCallback(() => {
    if (!selectedEstado) return;
    const loc: LocalidadeSelecionada = {
      uf: selectedEstado.sigla,
      cidade: null,
      label: `${selectedEstado.nome} - ${selectedEstado.sigla}`,
    };
    animOut(() => {
      onSelect(loc);
      onClose();
    });
  }, [selectedEstado, animOut, onSelect, onClose]);

  const handleSelectCidade = useCallback(
    (cidade: Cidade) => {
      if (!selectedEstado) return;
      const loc: LocalidadeSelecionada = {
        uf: selectedEstado.sigla,
        cidade: cidade.nome,
        label: `${cidade.nome}, ${selectedEstado.sigla}`,
      };
      animOut(() => {
        onSelect(loc);
        onClose();
      });
    },
    [selectedEstado, animOut, onSelect, onClose],
  );

  const handleBack = useCallback(() => {
    setView('estados');
    setSearch('');
    setCidades([]);
    setError(false);
  }, []);

  // ── Conteúdo da lista ──
  const renderEstado = useCallback(
    ({ item }: { item: Estado }) => (
      <TouchableOpacity
        style={s.item}
        onPress={() => handleSelectEstado(item)}
        activeOpacity={0.7}
      >
        <View style={s.siglaBadge}>
          <Text style={s.siglaText}>{item.sigla}</Text>
        </View>
        <Text style={s.itemText}>{item.nome}</Text>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
      </TouchableOpacity>
    ),
    [handleSelectEstado],
  );

  const renderCidade = useCallback(
    ({ item }: { item: Cidade }) => (
      <TouchableOpacity
        style={s.item}
        onPress={() => handleSelectCidade(item)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="location-outline"
          size={15}
          color={theme.colors.text.muted}
          style={s.cityIcon}
        />
        <Text style={s.itemText}>{item.nome}</Text>
      </TouchableOpacity>
    ),
    [handleSelectCidade],
  );

  // Componente de estado vazio / erro
  const ListEmpty = useCallback(
    () =>
      loading ? null : error ? (
        <View style={s.centerBox}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.text.muted} />
          <Text style={s.centerText}>Não foi possível carregar.</Text>
          <TouchableOpacity
            style={s.retryBtn}
            onPress={view === 'estados' ? loadEstados : () => selectedEstado && loadCidades(selectedEstado.sigla)}
            activeOpacity={0.7}
          >
            <Text style={s.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.centerBox}>
          <Ionicons name="search-outline" size={36} color={theme.colors.text.muted} />
          <Text style={s.centerText}>Nenhum resultado para "{search}"</Text>
        </View>
      ),
    [loading, error, search, view, loadEstados, loadCidades, selectedEstado],
  );

  if (!mounted) return null;

  const isEstados = view === 'estados';
  const headerTitle = isEstados ? 'Selecione o Estado' : selectedEstado?.nome ?? '';
  const placeholder = isEstados ? 'Estado ou sigla (ex: SP, São Paulo…)' : 'Buscar cidade…';

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => animOut()}
    >
      {/* ── Overlay ── */}
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => animOut()} />
      </Animated.View>

      {/* ── Sheet ── */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Alça */}
        <View style={s.handle} />

        {/* Cabeçalho */}
        <View style={s.header}>
          {!isEstados ? (
            <TouchableOpacity style={s.headerIconBtn} onPress={handleBack} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
          ) : (
            <View style={s.headerIconBtn} />
          )}

          <View style={s.headerCenter}>
            <Text style={s.headerTitle} numberOfLines={1}>{headerTitle}</Text>
            {!isEstados && (
              <Text style={s.headerSub}>Escolha a cidade ou selecione o estado inteiro</Text>
            )}
          </View>

          <TouchableOpacity style={s.headerIconBtn} onPress={() => animOut()} activeOpacity={0.7}>
            <View style={s.closeCircle}>
              <Ionicons name="close" size={16} color={theme.colors.text.primary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Barra de busca */}
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={16} color={theme.colors.text.muted} />
          <TextInput
            style={s.searchInput}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.text.muted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={theme.colors.text.muted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Opção "Todo o estado" — apenas na view de cidades */}
        {!isEstados && !loading && !error && (
          <TouchableOpacity style={s.allStateRow} onPress={handleSelectEstadoOnly} activeOpacity={0.7}>
            <View style={s.allStateIconWrap}>
              <Ionicons name="map-outline" size={16} color={theme.colors.text.primary} />
            </View>
            <Text style={s.allStateText} numberOfLines={1}>
              Todo o estado de {selectedEstado?.nome}
            </Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.text.muted} />
          </TouchableOpacity>
        )}

        {/* Lista / Loading */}
        {loading ? (
          <View style={s.centerBox}>
            <ActivityIndicator size="large" color={theme.colors.dark} />
            <Text style={s.centerText}>
              {isEstados ? 'Carregando estados…' : 'Carregando cidades…'}
            </Text>
          </View>
        ) : isEstados ? (
          <FlatList<Estado>
            data={filteredEstados}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderEstado}
            style={s.list}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={25}
            maxToRenderPerBatch={30}
            windowSize={10}
            ListEmptyComponent={<ListEmpty />}
          />
        ) : (
          <FlatList<Cidade>
            data={filteredCidades}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderCidade}
            style={s.list}
            contentContainerStyle={s.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            initialNumToRender={30}
            maxToRenderPerBatch={40}
            windowSize={12}
            ListEmptyComponent={<ListEmpty />}
          />
        )}
      </Animated.View>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  // overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // sheet
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: SHEET_MAX_H,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 20,
    // Layout em coluna para que a FlatList ocupe o espaço restante
    flexDirection: 'column',
  },

  // alça
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.inputBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },

  // cabeçalho
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PAD,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
    gap: 8,
  },
  headerIconBtn: {
    width: 34,
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  headerSub: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
    marginTop: 2,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // busca
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    paddingHorizontal: theme.spacing.sm + 4,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    marginHorizontal: PAD,
    marginTop: 14,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
    padding: 0,
  },

  // opção "todo o estado"
  allStateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: PAD,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.inputBorder,
    backgroundColor: theme.colors.inputBg,
    marginHorizontal: PAD,
    marginBottom: 4,
    borderRadius: theme.borderRadius.md,
  },
  allStateIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  allStateText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },

  // lista
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: PAD,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 4,
  },

  // item
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.inputBorder,
    gap: 12,
  },
  siglaBadge: {
    width: 40,
    height: 28,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  siglaText: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
    letterSpacing: 0.5,
  },
  cityIcon: {
    marginLeft: 2,
  },
  itemText: {
    flex: 1,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },

  // centro (loading / erro / vazio)
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
    minHeight: 200,
  },
  centerText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.secondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: theme.spacing.xs,
    paddingVertical: 10,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
  },
  retryText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.white,
  },
});
