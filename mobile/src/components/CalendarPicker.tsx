import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../styles/theme';
import { DIAS_SEMANA_CURTOS, MESES, hojeStr, toDateStr } from '../utils/format';

/** 42 células (6 semanas) do mês/ano informado. */
function buildCells(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = firstDay.getDay(); // 0 = Dom

  const cells: Array<{ date: Date; current: boolean }> = [];
  for (let i = 0; i < offset; i++) {
    cells.push({ date: new Date(year, month, i - offset + 1), current: false });
  }
  for (let d = 1; d <= lastDay.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ date: new Date(year, month + 1, next++), current: false });
  }
  return cells;
}

export interface CalendarPickerProps {
  selected: string;
  onSelect: (str: string) => void;
  /** Regra extra para habilitar o dia (além de não ser passado). */
  isDayEnabled?: (str: string) => boolean;
  /** Dias destacados (ex: datas bloqueadas). */
  markedDates?: ReadonlySet<string>;
  /** Último dia navegável (YYYY-MM-DD). */
  maxDate?: string;
  /** Avisado quando o mês exibido muda (inclusive na montagem). */
  onMonthChange?: (year: number, month: number) => void;
}

/**
 * Calendário mensal reutilizável (agendamento e disponibilidade).
 * A largura das células se adapta ao container.
 */
export default function CalendarPicker({
  selected,
  onSelect,
  isDayEnabled,
  markedDates,
  maxDate,
  onMonthChange,
}: CalendarPickerProps) {
  const hoje = hojeStr();
  const today = new Date();
  const [cur, setCur] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [width, setWidth] = useState(0);

  const year = cur.getFullYear();
  const month = cur.getMonth();
  const cells = buildCells(year, month);
  const cell = width ? Math.floor(width / 7) : 0;

  const podeVoltar = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth());
  const ultimoDoMes = toDateStr(new Date(year, month + 1, 0));
  const podeAvancar = !maxDate || ultimoDoMes < maxDate;

  React.useEffect(() => {
    onMonthChange?.(year, month);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  function onLayout(e: LayoutChangeEvent) {
    setWidth(e.nativeEvent.layout.width);
  }

  return (
    <View onLayout={onLayout}>
      {/* Navegação de mês */}
      <View style={s.nav}>
        <TouchableOpacity
          style={[s.arrow, !podeVoltar && s.arrowOff]}
          onPress={() => podeVoltar && setCur(new Date(year, month - 1, 1))}
          activeOpacity={0.65}
          disabled={!podeVoltar}
        >
          <Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />
        </TouchableOpacity>

        <Text style={s.monthLabel}>
          {MESES[month]} {year}
        </Text>

        <TouchableOpacity
          style={[s.arrow, !podeAvancar && s.arrowOff]}
          onPress={() => podeAvancar && setCur(new Date(year, month + 1, 1))}
          activeOpacity={0.65}
          disabled={!podeAvancar}
        >
          <Ionicons name="chevron-forward" size={18} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      {cell > 0 && (
        <>
          <View style={s.weekRow}>
            {DIAS_SEMANA_CURTOS.map((d) => (
              <Text key={d} style={[s.weekText, { width: cell }]}>
                {d}
              </Text>
            ))}
          </View>

          <View style={s.grid}>
            {cells.map((c, idx) => {
              const str = toDateStr(c.date);
              const past = str < hoje;
              const beyond = !!maxDate && str > maxDate;
              const enabledByRule = isDayEnabled ? isDayEnabled(str) : true;
              const disabled = past || beyond || !c.current || !enabledByRule;
              const isSelected = str === selected;
              const isToday = str === hoje;
              const marked = c.current && !!markedDates?.has(str);

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    s.cell,
                    { width: cell, height: Math.min(cell, 44), borderRadius: Math.min(cell, 44) / 2 },
                    isToday && !isSelected && s.cellToday,
                    marked && !isSelected && s.cellMarked,
                    isSelected && s.cellSelected,
                  ]}
                  onPress={() => !disabled && onSelect(str)}
                  activeOpacity={disabled ? 1 : 0.75}
                  disabled={disabled}
                >
                  <Text
                    style={[
                      s.cellText,
                      !c.current && s.cellTextOther,
                      disabled && s.cellTextDisabled,
                      isToday && !isSelected && s.cellTextToday,
                      marked && !isSelected && s.cellTextMarked,
                      isSelected && s.cellTextSelected,
                    ]}
                  >
                    {c.date.getDate()}
                  </Text>
                  {/* ponto indica dia com horários livres */}
                  {isDayEnabled && !disabled && !isSelected && <View style={s.dot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
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
  arrowOff: {
    opacity: 0.35,
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
  },
  cellSelected: {
    backgroundColor: theme.colors.dark,
  },
  cellToday: {
    backgroundColor: theme.colors.inputBg,
  },
  cellMarked: {
    backgroundColor: theme.colors.errorBg,
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
  cellTextMarked: {
    color: theme.colors.error,
    fontWeight: theme.fonts.weights.semibold,
  },
  dot: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.success,
  },
});
