/**
 * ConnectFit — Design System
 *
 * Cores extraídas dos protótipos Figma:
 *   - Header/botão primário: #0A0E1A (preto-azulado escuro)
 *   - Fundo da página:       #F3F3F3 (cinza claro)
 *   - Cards / formulários:   #FFFFFF
 *   - Input background:      #F3F4F6
 */

export const theme = {
  colors: {
    background: '#F3F3F3',
    white: '#FFFFFF',
    dark: '#0A0E1A',
    primary: '#0A0E1A',

    inputBg: '#F3F4F6',
    inputBorder: '#E5E7EB',
    divider: '#E5E7EB',

    star: '#FBBF24',
    error: '#EF4444',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',

    text: {
      primary: '#111827',
      secondary: '#6B7280',
      muted: '#9CA3AF',
      white: '#FFFFFF',
    },
  },

  fonts: {
    sizes: {
      xs: 11,
      sm: 13,
      md: 14,
      base: 16,
      lg: 18,
      xl: 22,
      xxl: 28,
    },
    weights: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
  },

  shadows: {
    card: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 2,
    },
    modal: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 5,
    },
  },
};
