// src/components/TestComponents.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { StandardButton, StandardInput, StandardCard, StandardHeader, StandardBadge, StandardAvatar } from './CommonComponents';
import { textStyles, spacing, borderRadius, shadows } from '../styles/typography';

// Componente de teste para verificar se todos os componentes estão funcionando
export const TestComponents = ({ theme }) => {
  return (
    <View style={styles.container}>
      <StandardHeader
        title="Teste de Componentes"
        subtitle="Verificando funcionamento"
        theme={theme}
      />
      
      <StandardCard theme={theme} style={styles.card}>
        <Text style={[textStyles.h4, { color: theme?.textPrimary }]}>
          Componentes Padronizados
        </Text>
        
        <StandardInput
          placeholder="Teste de input"
          value=""
          onChangeText={() => {}}
          icon="person-outline"
          theme={theme}
          style={styles.input}
        />
        
        <StandardButton
          title="Botão de Teste"
          onPress={() => {}}
          variant="primary"
          size="medium"
          theme={theme}
          style={styles.button}
        />
        
        <StandardBadge
          text="Teste"
          variant="success"
          size="medium"
          icon="checkmark"
          theme={theme}
          style={styles.badge}
        />
        
        <StandardAvatar
          source={null}
          size="medium"
          theme={theme}
          style={styles.avatar}
        />
      </StandardCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.base,
  },
  card: {
    marginVertical: spacing.base,
  },
  input: {
    marginBottom: spacing.base,
  },
  button: {
    marginBottom: spacing.base,
  },
  badge: {
    marginBottom: spacing.base,
  },
  avatar: {
    marginBottom: spacing.base,
  },
});
