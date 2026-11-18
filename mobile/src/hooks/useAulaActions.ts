import { useState } from 'react';
import { Alert } from 'react-native';

import { agendamentoService } from '../services/agendamentoService';
import { Aula } from '../types';
import { formatDataCurta } from '../utils/format';

function descricao(aula: Aula) {
  const quem = aula.meuPapel === 'aluno' ? aula.personal.nome : aula.aluno.nome;
  return `${quem} · ${formatDataCurta(aula.data)} às ${aula.horario}`;
}

/** Confirmar / recusar / cancelar com diálogo de confirmação e tratamento de erro. */
export function useAulaActions(onUpdated: (aula: Aula) => void) {
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(aula: Aula, fn: () => Promise<Aula>, sucesso: string) {
    setBusyId(aula.id);
    try {
      const atualizada = await fn();
      onUpdated(atualizada);
      Alert.alert('Pronto', sucesso);
    } catch (e) {
      Alert.alert('Não foi possível concluir', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setBusyId(null);
    }
  }

  function confirmar(aula: Aula) {
    Alert.alert('Confirmar aula?', descricao(aula), [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => run(aula, () => agendamentoService.confirmar(aula.id), 'Aula confirmada. O aluno foi avisado.'),
      },
    ]);
  }

  function recusar(aula: Aula, motivo = '') {
    Alert.alert('Recusar solicitação?', `${descricao(aula)}\n\nO horário volta a ficar livre.`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Recusar',
        style: 'destructive',
        onPress: () => run(aula, () => agendamentoService.recusar(aula.id, motivo), 'Solicitação recusada.'),
      },
    ]);
  }

  function cancelar(aula: Aula, motivo = '') {
    if (!aula.podeCancelar) {
      Alert.alert('Não é possível cancelar', aula.motivoNaoCancela || 'Esta aula não pode ser cancelada.');
      return;
    }
    Alert.alert('Cancelar aula?', `${descricao(aula)}\n\nEssa ação não pode ser desfeita.`, [
      { text: 'Voltar', style: 'cancel' },
      {
        text: 'Cancelar aula',
        style: 'destructive',
        onPress: () => run(aula, () => agendamentoService.cancelar(aula.id, motivo), 'Aula cancelada.'),
      },
    ]);
  }

  return { busyId, confirmar, recusar, cancelar };
}
