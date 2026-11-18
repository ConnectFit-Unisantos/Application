import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import StatusBadge from './StatusBadge';
import { theme } from '../styles/theme';
import { Aula } from '../types';
import { formatIntervalo, formatPreco } from '../utils/format';

interface Props {
  aula: Aula;
  busy?: boolean;
  onPress: () => void;
  onConfirmar?: () => void;
  onRecusar?: () => void;
  onCancelar?: () => void;
  onMensagem?: () => void;
}

/** Card de uma aula na lista "Minhas Aulas" / "Agenda". */
export default function AulaCard({ aula, busy, onPress, onConfirmar, onRecusar, onCancelar, onMensagem }: Props) {
  const outro = aula.meuPapel === 'aluno' ? aula.personal : aula.aluno;
  const papelOutro = aula.meuPapel === 'aluno' ? 'Personal' : 'Aluno';
  const mostrarResponder = aula.podeResponder && !!onConfirmar && !!onRecusar;
  const mostrarCancelar = aula.podeCancelar && !!onCancelar;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.top}>
        <View style={styles.timeBox}>
          <Text style={styles.timeText}>{aula.horario}</Text>
          <Text style={styles.durText}>{aula.duracaoMin}min</Text>
        </View>

        <View style={styles.info}>
          <Text style={styles.nome} numberOfLines={1}>
            {outro.nome}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {papelOutro} · {formatIntervalo(aula.horario, aula.duracaoMin)} · {formatPreco(aula.preco)}
          </Text>
          <View style={styles.badgeRow}>
            <StatusBadge status={aula.status} />
          </View>
        </View>

        <Ionicons name="chevron-forward" size={16} color={theme.colors.text.muted} />
      </View>

      {!!aula.observacao && (
        <Text style={styles.obs} numberOfLines={2}>
          “{aula.observacao}”
        </Text>
      )}

      {(mostrarResponder || mostrarCancelar || onMensagem) && (
        <View style={styles.actions}>
          {busy ? (
            <ActivityIndicator size="small" color={theme.colors.dark} style={styles.busy} />
          ) : (
            <>
              {onMensagem && (
                <TouchableOpacity style={styles.iconBtn} onPress={onMensagem} activeOpacity={0.75}>
                  <Ionicons name="chatbubble-outline" size={16} color={theme.colors.text.primary} />
                </TouchableOpacity>
              )}
              <View style={styles.flex1} />
              {mostrarCancelar && (
                <TouchableOpacity style={styles.outlineBtn} onPress={onCancelar} activeOpacity={0.8}>
                  <Text style={styles.outlineDangerText}>Cancelar</Text>
                </TouchableOpacity>
              )}
              {mostrarResponder && (
                <>
                  <TouchableOpacity style={styles.outlineBtn} onPress={onRecusar} activeOpacity={0.8}>
                    <Text style={styles.outlineDangerText}>Recusar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={onConfirmar} activeOpacity={0.85}>
                    <Text style={styles.primaryText}>Confirmar</Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.card,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBox: {
    width: 62,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.inputBg,
    alignItems: 'center',
  },
  timeText: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.bold,
    color: theme.colors.text.primary,
  },
  durText: {
    fontSize: 10,
    color: theme.colors.text.secondary,
    marginTop: 1,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nome: {
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.text.primary,
  },
  sub: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.text.secondary,
  },
  badgeRow: {
    marginTop: 3,
  },
  obs: {
    marginTop: 10,
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.text.secondary,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.divider,
  },
  busy: {
    flex: 1,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
  },
  outlineDangerText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.error,
  },
  primaryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: theme.borderRadius.md,
    backgroundColor: theme.colors.dark,
  },
  primaryText: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.semibold,
    color: theme.colors.white,
  },
});
