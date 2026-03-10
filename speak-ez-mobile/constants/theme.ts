/**
 * Speak-EZ design tokens — ported from css/styles.css :root variables
 * Dark theme only (matching the web app)
 */

export const colors = {
  bg: '#0a0a0f',
  bgCard: '#16161e',
  bgCardHover: '#1e1e2a',
  bgElevated: '#1c1c28',
  bgInput: '#12121a',

  text: '#f0f0f5',
  textSecondary: '#8e8ea0',
  textTertiary: '#5a5a6e',

  accent: '#FF6B35',
  accentDim: 'rgba(255, 107, 53, 0.15)',
  accentGlow: 'rgba(255, 107, 53, 0.3)',

  success: '#58CC02',
  successDim: 'rgba(88, 204, 2, 0.15)',
  warning: '#FDCB6E',
  danger: '#FF7675',

  purple: '#7C5CFC',
  purpleDim: 'rgba(124, 92, 252, 0.15)',
  blue: '#00B4D8',
  blueDim: 'rgba(0, 180, 216, 0.15)',
  pink: '#E84393',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  full: 9999,
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  hero: 32,
} as const;
