import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface HeaderProps {
  /**
   * Controla o botão no canto direito.
   * - true: mostra "Conecte-se"
   * - false: mostra "Perfil"
   * - undefined: esconde o botão
   */
  showConnectButton?: boolean;
  onConnectPress?: () => void;

  /** Clique no logo e/ou no texto "ConnectFit". */
  onLogoPress?: () => void;
}

/**
 * Barra de navegação superior do ConnectFit.
 * Fundo escuro (#0A0E1A), logo à esquerda, botão opcional à direita.
 */
export default function Header({
  showConnectButton,
  onConnectPress,
  onLogoPress,
}: HeaderProps) {
  return (
    <View style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo (opcional: redireciona via handler) */}
        <TouchableOpacity
          style={styles.logo}
          activeOpacity={0.75}
          onPress={onLogoPress}
          // Se não houver handler, não responde ao toque.
          disabled={!onLogoPress}
        >
          <View style={styles.logoIconBox}>
            <Ionicons
              name="people"
              size={14}
              color={theme.colors.text.white}
            />
          </View>
          <Text style={styles.logoText}>ConnectFit</Text>
        </TouchableOpacity>

        {/* Botão de ação (opcional) */}
        {showConnectButton === undefined ? null : showConnectButton ? (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={onConnectPress}
            activeOpacity={0.75}
          >
            <Text style={styles.connectBtnText}>Conecte-se</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.connectBtn}
            onPress={onConnectPress}
            activeOpacity={0.75}
          >
            <Text style={styles.connectBtnText}>Perfil</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.dark,
  },
  container: {
    height: 76,
    backgroundColor: theme.colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },

  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.base,
    fontWeight: theme.fonts.weights.semibold,
    letterSpacing: 0.2,
  },

  connectBtn: {
    borderWidth: 1.5,
    borderColor: theme.colors.text.white,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  connectBtnText: {
    color: theme.colors.text.white,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: theme.fonts.weights.medium,
  },
});

