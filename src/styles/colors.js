// src/styles/colors.js

export const lightTheme = {
  // Cores principais
  primary: '#f37100',       // Laranja principal
  primaryDark: '#c45c00',    // Laranja mais escuro
  primaryLight: '#ff8c29',   // Laranja mais claro
  
  // Cores de fundo
  background: '#f8f9fa',     // Fundo claro principal
  backgroundSecondary: '#ffffff', // Fundo secundário
  backgroundDark: '#e9ecef', // Fundo escuro para elementos
  backgroundElevated: '#ffffff', // Fundo elevado (cards, modais)
  
  // Cores de texto
  textPrimary: '#212529',   // Texto principal
  textSecondary: '#6c757d', // Texto secundário
  textTertiary: '#adb5bd',  // Texto terciário
  textInverted: '#ffffff',  // Texto em fundos escuros
  textMuted: '#868e96',    // Texto desabilitado
  
  // Cores de borda
  border: '#dee2e6',        // Borda padrão
  borderLight: '#e9ecef',   // Borda clara
  borderDark: '#adb5bd',    // Borda escura
  borderHighlight: '#f37100', // Borda destacada
  
  // Cores de cards e superfícies
  cardBackground: '#ffffff', // Fundo do card
  cardShadow: 'rgba(0,0,0,0.08)', // Sombra do card
  surface: '#ffffff',       // Superfície principal
  
  // Cores de estado
  success: '#28a745',       // Verde para sucesso
  warning: '#ffc107',       // Amarelo para aviso
  error: '#dc3545',         // Vermelho para erro
  info: '#17a2b8',          // Azul para informação
  
  // Cores específicas
  star: '#ffc107',          // Amarelo para estrelas
  overlay: 'rgba(0,0,0,0.5)', // Overlay
  divider: '#e9ecef',       // Divisor
  
  // Cores de interação
  hover: 'rgba(243, 113, 0, 0.1)', // Hover state
  pressed: 'rgba(243, 113, 0, 0.2)', // Pressed state
  focus: 'rgba(243, 113, 0, 0.3)', // Focus state
  
  // Gradientes
  gradientPrimary: ['#f37100', '#ff8c29'],
  gradientSecondary: ['#ffffff', '#f8f9fa'],
};

export const darkTheme = {
  // Cores principais
  primary: '#f37100',
  primaryDark: '#c45c00',
  primaryLight: '#ff8c29',
  
  // Cores de fundo
  background: '#121212',     // Fundo escuro principal
  backgroundSecondary: '#1e1e1e', // Fundo secundário
  backgroundDark: '#2d2d2d', // Fundo escuro para elementos
  backgroundElevated: '#2a2a2a', // Fundo elevado (cards, modais)
  
  // Cores de texto
  textPrimary: '#ffffff',   // Texto principal
  textSecondary: '#b3b3b3', // Texto secundário
  textTertiary: '#808080',  // Texto terciário
  textInverted: '#000000',  // Texto em fundos claros
  textMuted: '#666666',    // Texto desabilitado
  
  // Cores de borda
  border: '#404040',        // Borda padrão
  borderLight: '#333333',   // Borda clara
  borderDark: '#555555',    // Borda escura
  borderHighlight: '#f37100', // Borda destacada
  
  // Cores de cards e superfícies
  cardBackground: '#1e1e1e', // Fundo do card
  cardShadow: 'rgba(0,0,0,0.3)', // Sombra do card
  surface: '#1e1e1e',       // Superfície principal
  
  // Cores de estado
  success: '#4caf50',       // Verde para sucesso
  warning: '#ff9800',       // Amarelo para aviso
  error: '#f44336',         // Vermelho para erro
  info: '#2196f3',          // Azul para informação
  
  // Cores específicas
  star: '#ffc107',          // Amarelo para estrelas
  overlay: 'rgba(0,0,0,0.7)', // Overlay
  divider: '#333333',       // Divisor
  
  // Cores de interação
  hover: 'rgba(243, 113, 0, 0.2)', // Hover state
  pressed: 'rgba(243, 113, 0, 0.3)', // Pressed state
  focus: 'rgba(243, 113, 0, 0.4)', // Focus state
  
  // Gradientes
  gradientPrimary: ['#f37100', '#ff8c29'],
  gradientSecondary: ['#1e1e1e', '#2a2a2a'],
};

// Exportar o tema padrão (darkTheme) inicialmente
export default darkTheme;