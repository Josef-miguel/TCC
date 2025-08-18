// src/styles/colors.js

export const lightTheme = {
  // Cores principais
  primary: '#f37100',       // Laranja principal
  primaryDark: '#c45c00',    // Laranja mais escuro
  primaryLight: '#ff8c29',   // Laranja mais claro
  
  // Cores de fundo
  background: '#f5f5f5',     // Fundo claro
  backgroundSecondary: '#ffffff', // Fundo secundário
  backgroundDark: '#e0e0e0', // Fundo escuro para elementos
  
  // Cores de texto
  textPrimary: '#333333',   // Texto principal
  textSecondary: '#666666', // Texto secundário
  textTertiary: '#999999',  // Texto terciário
  textInverted: '#ffffff',  // Texto em fundos escuros
  
  // Cores de borda
  border: '#dddddd',        // Borda padrão
  borderHighlight: '#f37100', // Borda destacada
  
  // Cores de cards
  cardBackground: '#ffffff', // Fundo do card
  cardShadow: 'rgba(0,0,0,0.1)', // Sombra do card
  
  // Cores específicas
  star: '#800080',          // Roxo para estrelas
  overlay: 'rgba(0,0,0,0.4)', // Overlay
};

export const darkTheme = {
  // Cores principais (mantidas do seu tema atual)
  primary: '#f37100',
  primaryDark: '#c45c00',
  primaryLight: '#ff8c29',
  
  // Cores de fundo
  background: '#1a1b21',
  backgroundSecondary: '#2b2c33',
  backgroundDark: '#363942',
  
  // Cores de texto
  textPrimary: '#ffffff',
  textSecondary: '#e4e4e4',
  textTertiary: '#a0a4ad',
  textInverted: '#333333',
  
  // Cores de borda
  border: '#333333',
  borderHighlight: '#f37100',
  
  // Cores de cards
  cardBackground: '#2a2b31',
  cardShadow: 'rgba(0,0,0,0.3)',
  
  // Cores específicas
  star: '#800080',
  overlay: 'rgba(0,0,0,0.4)',
};

// Exportar o tema padrão (darkTheme) inicialmente
export default darkTheme;