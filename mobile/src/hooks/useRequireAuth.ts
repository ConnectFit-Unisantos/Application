import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStackParamList } from '../navigation/AppNavigator';

import { useAuthContext } from '../contexts/AuthContext';

/**
 * Telas que exigem login: se não houver usuário (ou ele for de outro tipo),
 * redireciona fora do render.
 */
export function useRequireAuth(tipo?: 'aluno' | 'personal') {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, isLoading } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } else if (tipo && user.tipo !== tipo) {
      navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
    }
  }, [user, isLoading, tipo, navigation]);

  const allowed = !!user && (!tipo || user.tipo === tipo);
  return { user, allowed };
}
