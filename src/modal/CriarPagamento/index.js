import React, { useState, useContext } from 'react';
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
import { ThemeContext } from '../../context/ThemeContext';

const CriarPagamento = ({ visible, onClose }) => {
  const [tipoPagamento, setTipoPagamento] = useState('Cartão de crédito');
  const [metodo, setMetodo] = useState('Débito automático');
  const { theme } = useContext(ThemeContext);

  const handleSalvar = () => {
    onClose(); // Fecha o modal após salvar
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.container, { backgroundColor: theme?.background }]}>

      <View style={[styles.overlay, { backgroundColor: theme?.overlay }]}>
        <View style={[styles.modalBox, { backgroundColor: theme?.backgroundSecondary }]}>
          {/* Botão de voltar/fechar */}
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={24} color={theme?.primary || '#f37100'} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: theme?.textPrimary }]}>Tipo de pagamento</Text>
          {['Cartão de crédito', 'Pix', 'Boleto bancário'].map((tipo) => (
            <TouchableOpacity
              key={tipo}
              style={styles.option}
              onPress={() => setTipoPagamento(tipo)}
            >
              <View style={[styles.radioOuter, { borderColor: theme?.primary }]}>
                {tipoPagamento === tipo && <View style={[styles.radioInner, { backgroundColor: theme?.primary }]} />}
              </View>
              <Text style={[styles.optionText, { color: theme?.textSecondary }]}>{tipo}</Text>
            </TouchableOpacity>
          ))}

          <Text style={[styles.title, { marginTop: 20, color: theme?.textPrimary }]}>Método</Text>
          {['Débito automático', 'Pagamento manual'].map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.option}
              onPress={() => setMetodo(opt)}
            >
              <View style={[styles.radioOuter, { borderColor: theme?.primary }]}>
                {metodo === opt && <View style={[styles.radioInner, { backgroundColor: theme?.primary }]} />}
              </View>
              <Text style={[styles.optionText, { color: theme?.textSecondary }]}>{opt}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={[styles.confirmButton, { backgroundColor: theme?.primary }]} onPress={handleSalvar}>
            <Text style={[styles.confirmText, { color: theme?.textInverted }]}>Salvar</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '85%',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    marginLeft: 10,
  },
  confirmButton: {
    marginTop: 20,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
