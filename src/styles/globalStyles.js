// src/styles/globalStyles.js
import { StyleSheet } from 'react-native';
import { lightTheme } from './theme'; // Importa o tema atual

export const globalStyles = StyleSheet.create({
  // Container padrão
  container: {
    flex: 1,
    backgroundColor: lightTheme.background,
    padding: 16,
  },
  // Textos
  title: {
    fontSize: 24,
    color: lightTheme.text,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: lightTheme.subtitleText,
  },
  // Botões
  buttonPrimary: {
    backgroundColor: lightTheme.primary,
    borderRadius: 8,
    padding: 12,
  },
  // Cards (exemplo para telas de turismo)
  card: {
    backgroundColor: lightTheme.cardBackground,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});