import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuthContext } from '../contexts/AuthContext';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PersonalOnboardingScreen from '../screens/PersonalOnboardingScreen';
import TrainerDetailScreen from '../screens/TrainerDetailScreen';
import AulasScreen from '../screens/AulasScreen';
import AulaDetalheScreen from '../screens/AulaDetalheScreen';
import DisponibilidadeScreen from '../screens/DisponibilidadeScreen';
import ConversasScreen from '../screens/ConversasScreen';
import ChatScreen from '../screens/ChatScreen';

import { theme } from '../styles/theme';
import { Trainer } from '../types';

// ─── Tipos das rotas ──────────────────────────────────────────────────────────

export type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Register: undefined;
  Profile: undefined;
  PersonalOnboarding: undefined;
  TrainerDetail: { trainer: Trainer };

  // Agendamento
  Aulas: undefined; // "Minhas Aulas" (aluno) / "Agenda" (personal)
  AulaDetalhe: { aulaId: string };
  Disponibilidade: undefined; // personal

  // Chat
  Conversas: undefined;
  Chat: { conversaId: string; nome?: string };
};



// ─── Stack ────────────────────────────────────────────────────────────────────

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const { isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: theme.colors.background,
        }}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: theme.colors.white },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="PersonalOnboarding" component={PersonalOnboardingScreen} />
        <Stack.Screen name="TrainerDetail" component={TrainerDetailScreen} />
        <Stack.Screen name="Aulas" component={AulasScreen} />
        <Stack.Screen name="AulaDetalhe" component={AulaDetalheScreen} />
        <Stack.Screen name="Disponibilidade" component={DisponibilidadeScreen} />
        <Stack.Screen name="Conversas" component={ConversasScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
