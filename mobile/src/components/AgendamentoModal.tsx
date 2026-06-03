import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

// ─── Constantes ────────────────────────────────────────────────────────────────

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_H = SCREEN_HEIGHT * 0.88;
const PAD = 16;

const HORARIOS: string[] = [
  '07:00', '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00',
];

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Tamanho de cada célula do calendário: 7 colunas dentro do padding
const CELL = Math.floor((SCREEN_WIDTH - PAD * 2) / 7);
// Largura de cada botão de horário: 3 por linha com 2 gaps de 8px
const HORARIO_W = Math.floor((SCREEN_WIDTH - PAD * 2 - 8 * 2) / 3);

// ─── Helpers de data ───────────────────────────────────────────────────────────

function toStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Retorna 42 células (6 semanas) para o mês/ano fornecido. */
function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = firstDay.getDay(); // 0=Dom

  const cells: Array<{ date: Date; current: boolean }> = [];

  // Dias do mês anterior
  for (let i = 0; i < offset; i++) {
    cells.push({
      date: new Date(year, month, i - offset + 1),
      current: false,
    });
  }
  // Dias do mês atual
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  // Dias do próximo mês para completar 42 células
  let next = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), current: false });
  }
  return cells;
}

/** "Qua, 15 Jul" */
function displayDate(str: string): string {
  const [y, m, d] = str.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${DIAS_SEMANA[date.getDay()]}, ${d} ${MESES_CURTOS[m - 1]}`;
}

// ─── Componente de calendário ──────────────────────────────────────────────────

interface CalProps {
  selected: string;
  onSelect: (str: string) => void;
}

function CalendarPicker({ selected, onSelect }: CalProps) {
  const today = todayMidnight();
  const [cur, setCur] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const cells = buildCells(year, month);
  const todayStr = toStr(today);

  const isPast = (date: Date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  };

  return (
    <View>
      {/* ── Navegação de mês ── */}
      <View style={calS.nav}>
        <TouchableOpacity
          style={calS.arrow}
          onPress={() => setCur(new Date(year, month - 1, 1))}
          activeOpacity={0.65}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <Text style={calS.monthLabel}>
          {MESES[month]} {year}
        </Text>

        <TouchableOpacity
          style={calS.arrow}
          onPress={() => setCur(new Date(year, month + 1, 1))}
          activeOpacity={0.65}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* ── Cabeçalho dos dias ── */}
      <View style={calS.weekRow}>
        {DIAS_SEMANA.map((d) => (
          <Text key={d} style={[calS.weekText, { width: CELL }]}>
            {d}
          </Text>
        ))}
      </View>

      {/* ── Grade ── */}
      <View style={calS.grid}>
        {cells.map((cell, idx) => {
          const str = toStr(cell.date);
          const past = isPast(cell.date);
          const isSelected = str === selected;
          const isToday = str === todayStr;
          const disabled = past || !cell.current;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                calS.cell,
                { width: CELL, height: CELL },
                isSelected && calS.cellSelected,
                isToday && !isSelected && calS.cellToday,
              ]}
              onPress={() => !disabled && onSelect(str)}
              activeOpacity={disabled ? 1 : 0.75}
              disabled={disabled}
            >
              <Text
                style={[
                  calS.cellText,
                  !cell.current && calS.cellTextOther,
                  disabled && calS.cellTextDisabled,
                  isSelected && calS.cellTextSelected,
                  isToday && !isSelected && calS.cellTextToday,
                ]}
              >
                {cell.date.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const calS = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  arrow: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthLabel: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  weekText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.secondary,
    paddingVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: CELL / 2,
  },
  cellSelected: {
    backgroundColor: theme.colors.dark,
  },
  cellToday: {
    backgroundColor: theme.colors.inputBg,
  },
  cellText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.text.primary,
  },
  cellTextOther: {
    color: theme.colors.text.muted,
  },
  cellTextDisabled: {
    color: theme.colors.text.muted,
    opacity: 0.4,
  },
  cellTextSelected: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.bold,
  },
  cellTextToday: {
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
});

// ─── Modal principal ───────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  trainerName: string;
  onClose: () => void;
}

export default function AgendamentoModal({ visible, trainerName, onClose }: Props) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedHorario, setSelectedHorario] = useState('');
  const [mounted, setMounted] = useState(false);

  const overlayAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(SHEET_H)).current;

  // ── Animar entrada ──
  const animIn = useCallback(() => {
    slideAnim.setValue(SHEET_H);
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

  // ── Animar saída ──
  const animOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlayAnim, {
        toValue: 0,
        duration: 210,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SHEET_H,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setMounted(false);
      setSelectedDate('');
      setSelectedHorario('');
      onClose();
    });
  }, [overlayAnim, slideAnim, onClose]);

  useEffect(() => {
    if (visible) animIn();
    else if (mounted) animOut();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const canConfirm = selectedDate !== '' && selectedHorario !== '';

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={animOut}
    >
      {/* ── Overlay escuro ── */}
      <Animated.View style={[s.overlay, { opacity: overlayAnim }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={animOut} />
      </Animated.View>

      {/* ── Bottom sheet ── */}
      <Animated.View style={[s.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Alça de arraste */}
        <View style={s.handle} />

        {/* Cabeçalho */}
        <View style={s.header}>
          <View>
            <Text style={s.headerTitle}>Agendar Aula</Text>
            <Text style={s.headerSub}>{trainerName}</Text>
          </View>
          <TouchableOpacity style={s.closeBtn} onPress={animOut} activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={theme.colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Conteúdo rolável */}
        <ScrollView
          style={s.body}
          contentContainerStyle={s.bodyContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Calendário */}
          <CalendarPicker
            selected={selectedDate}
            onSelect={setSelectedDate}
          />

          {/* ── Horários ── */}
          <View style={s.horariosSection}>
            <View style={s.horariosTitleRow}>
              <Text style={s.horariosTitle}>Horários Disponíveis</Text>
              <Text style={s.horariosHint}>Selecione um horário</Text>
            </View>

            <View style={s.horariosGrid}>
              {HORARIOS.map((h) => {
                const active = selectedHorario === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[
                      s.horarioBtn,
                      { width: HORARIO_W },
                      active && s.horarioBtnOn,
                    ]}
                    onPress={() => setSelectedHorario(h)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.horarioBtnText, active && s.horarioBtnTextOn]}>
                      {h}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>

        {/* ── Rodapé fixo ── */}
        <View style={s.footer}>
          {/* Chip de resumo — aparece quando ambos estão selecionados */}
          {canConfirm && (
            <View style={s.summaryChip}>
              <Ionicons name="calendar-outline" size={13} color={theme.colors.text.secondary} />
              <Text style={s.summaryText}>{displayDate(selectedDate)}</Text>
              <View style={s.dot} />
              <Ionicons name="time-outline" size={13} color={theme.colors.text.secondary} />
              <Text style={s.summaryText}>{selectedHorario}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.confirmBtn, !canConfirm && s.confirmBtnOff]}
            activeOpacity={canConfirm ? 0.85 : 1}
            disabled={!canConfirm}
            onPress={animOut}
          >
            <Text style={[s.confirmBtnText, !canConfirm && s.confirmBtnTextOff]}>
              {canConfirm ? 'Confirmar Agendamento' : 'Selecione data e horário'}
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

// ─── Estilos do modal ──────────────────────────────────────────────────────────

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
    maxHeight: SHEET_H,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.14,
    shadowRadius: 18,
    elevation: 20,
  },

  // alça
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.inputBorder,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
  },

  // cabeçalho
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  // corpo
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: PAD,
    paddingTop: 18,
    paddingBottom: 12,
  },

  // horários
  horariosSection: {
    marginTop: 22,
  },
  horariosTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
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
  horarioBtnText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.primary,
  },
  horarioBtnTextOn: {
    color: theme.colors.white,
    fontWeight: theme.fonts.weights.semibold,
  },

  // rodapé
  footer: {
    paddingHorizontal: PAD,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 30 : 18,
    borderTopWidth: 1,
    borderTopColor: theme.colors.inputBorder,
    gap: 10,
  },

  // chip de resumo
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.inputBg,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignSelf: 'center',
  },
  summaryText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
    color: theme.colors.text.secondary,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.text.muted,
  },

  // botão confirmar
  confirmBtn: {
    backgroundColor: theme.colors.dark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  confirmBtnOff: {
    backgroundColor: theme.colors.inputBg,
  },
  confirmBtnText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.white,
  },
  confirmBtnTextOff: {
    color: theme.colors.text.muted,
  },
});
