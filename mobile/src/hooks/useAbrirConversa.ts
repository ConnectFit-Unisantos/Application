import { useState } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';

import { useAuthContext } from '../contexts/AuthContext';
import { chatService } from '../services/chatService';

/**
 * Abre (ou retoma) uma conversa e navega para o chat.
 * - Aluno conversa com personal.
 * - Personal conversa com aluno que já agendou com ele.
 */
export function useAbrirConversa() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuthContext();
  const [abrindo, setAbrindo] = useState(false);

  async function abrir(outro: { id: string; nome: string; tipo: 'aluno' | 'personal' }) {
    if (!user) {
      navigation.navigate('Login');
      return;
    }
    if (outro.id === user.id) return;
    if (user.tipo === outro.tipo) {
      Alert.alert(
        'Indisponível',
        user.tipo === 'personal'
          ? 'O chat é entre alunos e personal trainers.'
          : 'Você só pode conversar com personal trainers.',
      );
      return;
    }

    setAbrindo(true);
    try {
      const conversa =
        user.tipo === 'aluno'
          ? await chatService.abrirComPersonal(outro.id)
          : await chatService.abrirComAluno(outro.id);
      navigation.navigate('Chat', { conversaId: conversa.id, nome: conversa.outro.nome });
    } catch (e) {
      Alert.alert('Não foi possível abrir a conversa', e instanceof Error ? e.message : 'Tente novamente.');
    } finally {
      setAbrindo(false);
    }
  }

  return { abrir, abrindo };
}
