import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CriarPagamento = ({ visible, onClose }) => {
  const [tipoPagamento, setTipoPagamento] = useState('Cartão de crédito');
  const [metodo, setMetodo] = useState('Débito automático');

  const handleSalvar = () => {
    onClose(); // Fecha o modal após salvar
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.container}>

      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Botão de voltar/fechar */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color="#e4e4e4" />
          </TouchableOpacity>

          <Text style={styles.title}>Tipo de pagamento</Text>
          {['Cartão de crédito', 'Pix', 'Boleto bancário'].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={styles.option}
              onPress={() => setTipoPagamento(tipo)}
            >
              <View style={styles.radioOuter}>
                {tipoPagamento === tipo && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>{tipo}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.title, { marginTop: 20 }]}>Método</Text>
          {['Débito automático', 'Pagamento manual'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => setMetodo(opt)}
            >
              <View style={styles.radioOuter}>
                {metodo === opt && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.confirmButton} onPress={handleSalvar}>
            <Text style={styles.confirmText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </Modal>
  );
};

export default CriarPagamento;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2B2C33', // fundo principal
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
    backgroundColor: '#363942', // segunda cor de fundo
    borderRadius: 10,
    padding: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#e4e4e4', // fonte clara
    marginTop: 30,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f37100', // cor principal
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f37100', // cor principal
  },
  optionText: {
    marginLeft: 10,
    color: '#e4e4e4', // fonte clara
  },
  confirmButton: {
    marginTop: 20,
    backgroundColor: '#f37100', // cor principal
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmText: {
    color: '#e4e4e4', // fonte clara
    fontWeight: 'bold',
    fontSize: 16,
  },
});
