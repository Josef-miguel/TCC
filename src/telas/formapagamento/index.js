import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MaskedTextInput } from "react-native-mask-text";

export default function formapagamento({ navigation }) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [saveCard, setSaveCard] = useState(false);

  const handlePayment = () => {
    if (!cardNumber || !cardHolder || !expiryDate || !cvv) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }
    
    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Erro', 'Número do cartão inválido');
      return;
    }
    
    if (cvv.length < 3) {
      Alert.alert('Erro', 'CVV inválido');
      return;
    }
    
    Alert.alert(
      'Sucesso', 
      'Pagamento processado com sucesso!',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>← Finalizar pagamento</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.paymentCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="card" size={24} color="#666" />
            <Text style={styles.cardHeaderText}>Cartão de Crédito</Text>
          </View>
          
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
          
          <View style={styles.row}>
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
          
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setSaveCard(!saveCard)}
          >
            <View style={[styles.checkbox, saveCard && styles.checkedBox]}>
              {saveCard && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxLabel}>Salvar informações do cartão</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.payButton} onPress={handlePayment}>
          <Text style={styles.payButtonText}>Confirmar Pagamento</Text>
        </TouchableOpacity>
        
        <View style={styles.securityInfo}>
          <Ionicons name="lock-closed" size={16} color="#4CAF50" />
          <Text style={styles.securityText}>Pagamento seguro criptografado</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#b0ff9b',
    padding: 10,
  },
  backButton: {
    flexDirection: 'row',
  },
  backText: {
    fontSize: 16,
    color: '#000',
  },
  contentContainer: {
    padding: 15,
  },
  paymentCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
    color: '#666',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 12,
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
    marginTop: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
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
    padding: 16,
    borderRadius: 6,
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
  },
  securityText: {
    marginLeft: 5,
    color: '#4CAF50',
    fontSize: 14,
  },
});