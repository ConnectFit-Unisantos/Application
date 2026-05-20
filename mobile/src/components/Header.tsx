import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';

interface HeaderProps {
  /** Exibe o botão "Conecte-se" no canto direito (apenas na Home). */
  showConnectButton?: boolean;
  onConnectPress?: () => void;
}

/**
 * Barra de navegação superior do ConnectFit.
 * Fundo escuro (#0A0E1A), logo à esquerda, botão opcional à direita.
 */
export default function Header({
  showConnectButton = false,
  onConnectPress,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logo}>
        <View style={styles.logoIconBox}>
          <Ionicons name="people" size={16} color={theme.colors.text.white} />
        </View>
        <Text style={styles.logoText}>ConnectFit</Text>
      </View>

      {/* Botão de ação */}
      {showConnectButton && (
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={onConnectPress}
          activeOpacity={0.75}
        >
          <Text style={styles.connectBtnText}>Conecte-se</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    backgroundColor: theme.colors.dark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
  },

  // ── Logo ──────────────────────────────────────────────────────────────────
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

  // ── Botão ─────────────────────────────────────────────────────────────────
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
