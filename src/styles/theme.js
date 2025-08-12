// src/styles/theme.js

// Cores base do app (turismo)
export const colors = {
  primary: '#3498db',     // Azul (destaque)
  secondary: '#2ecc71',   // Verde (natureza)
  background: '#f5f5f5',  // Fundo claro
  text: '#333333',        // Texto escuro
  accent: '#e74c3c',      // Vermelho (CTA)
  border: '#dddddd',      // Bordas
};

// Tema CLARO (default)
export const lightTheme = {
  ...colors, // Herda todas as cores base
  // Adicione variações específicas do tema claro:
  headerBackground: colors.primary,
  cardBackground: '#ffffff',
  subtitleText: '#666666',
};