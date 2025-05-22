import React, { useState } from 'react';
import { SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaskedTextInput } from 'react-native-mask-text';

// Tela de formulário de pagamento
export default function FormPagamento({ navigation }) {
  // Estados para os campos do cartão
  const [cardNumber, setCardNumber] = useState('');   // Número do cartão
  const [cardHolder, setCardHolder] = useState('');   // Nome impresso no cartão
  const [expiryDate, setExpiryDate] = useState('');   // Data de validade
  const [cvv, setCvv] = useState('');                 // Código de segurança (CVV)
  const [saveCard, setSaveCard] = useState(false);     // Flag para salvar cartão

  // Função chamada ao confirmar pagamento
  const handlePayment = () => {
    // Validação: todos os campos devem estar preenchidos
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Remove espaços e valida comprimento do número do cartão (mínimo 16 dígitos)
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Erro', 'Número do cartão inválido');
      return;
    }

    // Valida comprimento do CVV (mínimo 3 dígitos)
    if (cvv.length < 3) {
      Alert.alert('Erro', 'CVV inválido');
      return;
    }

    // Se tudo OK, exibe alerta de sucesso e volta
    Alert.alert(
      'Sucesso',
      'Pagamento processado com sucesso!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Configura barra de status */}
      <StatusBar barStyle="dark-content" backgroundColor="#b0ff9b" />

      {/* Cabeçalho com botão de voltar e título */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backText}>Finalizar Pagamento</Text>
        </TouchableOpacity>
      </View>

      {/* Conteúdo rolável para formularios */}
      <ScrollView contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">
        {/* Cartão de pagamento estilizado */}
        <View style={styles.paymentCard}>
          {/* Cabeçalho do cartão com ícone e texto */}
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#666" />
            <Text style={styles.cardHeaderText}>Cartão de Crédito</Text>
          </View>

          {/* Input: Número do cartão com máscara */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Número do Cartão</Text>
            <MaskedTextInput
              style={styles.input}
              placeholder="0000 0000 0000 0000"
              keyboardType="numeric"
              mask="9999 9999 9999 9999"
              value={cardNumber}
              onChangeText={setCardNumber}
            />
          </View>

          {/* Input: Nome no cartão */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nome no Cartão</Text>
            <TextInput
              style={styles.input}
              placeholder="Nome como está no cartão"
              value={cardHolder}
              onChangeText={setCardHolder}
              autoCapitalize="words"
            />
          </View>

          {/* Linha com Validade e CVV lado a lado */}
          <View style={styles.row}>
            {/* Validade com máscara MM/AA */}
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>  
              <Text style={styles.label}>Validade</Text>
              <MaskedTextInput
                style={styles.input}
                placeholder="MM/AA"
                keyboardType="numeric"
                mask="99/99"
                value={expiryDate}
                onChangeText={setExpiryDate}
              />
            </View>

            {/* CVV (segurança) */}
            <View style={[styles.inputGroup, { flex: 1 }]}>  
              <Text style={styles.label}>CVV</Text>
              <MaskedTextInput
                style={styles.input}
                placeholder="000"
                keyboardType="numeric"
                mask="999"
                value={cvv}
                onChangeText={setCvv}
                secureTextEntry
              />
            </View>
          </View>

          {/* Checkbox para salvar o cartão */}
          <TouchableOpacity style={styles.checkboxContainer} onPress={() => setSaveCard(!saveCard)}>
            <View style={[styles.checkbox, saveCard && styles.checkedBox]}>  
              {saveCard && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Salvar informações do cartão</Text>
          </TouchableOpacity>
        </View>

        {/* Botão para confirmar pagamento */}
        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Confirmar Pagamento</Text>
        </TouchableOpacity>

        {/* Informação de segurança */}
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>Pagamento seguro criptografado</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Definição de estilos para a tela de pagamento
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#b0ff9b',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    color: '#000',
    marginLeft: 8,
    fontWeight: '500',
  },
  contentContainer: {
    padding: 16,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderText: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkedBox: {
    backgroundColor: '#6200ee',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  payButton: {
    backgroundColor: '#6200ee',
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  securityText: {
    marginLeft: 6,
    color: '#4CAF50',
    fontSize: 14,
  },
});
