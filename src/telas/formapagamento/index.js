import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CriarPagamento from '../../modal/CriarPagamento';
import { ThemeContext } from '../../context/ThemeContext';

export default function FormPagamento({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const { theme } = useContext(ThemeContext);

  return (
    <View style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme?.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>Minhas formas de pagamento</Text>
      </View>

      {/* Cartão */}
      <TouchableOpacity style={[styles.card, { backgroundColor: theme?.cardBackground }]} onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: 'https://t.ctcdn.com.br/kMf14Wi0IOrlcp_4VoXmwz5xBD8=/i490070.jpeg' }}
          style={styles.icon}
        />
        <Text style={[styles.cardText, { color: theme?.textPrimary }]}>**** 0624</Text>
      </TouchableOpacity>

      {/* Pix */}
      <TouchableOpacity style={[styles.card, { backgroundColor: theme?.cardBackground }]} onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: 'https://i.pinimg.com/736x/46/11/a5/4611a564a1f84d6758472fe7e6483671.jpg' }}
          style={styles.icon}
        />
        <Text style={[styles.cardText, { color: theme?.textPrimary }]}>Pix</Text>
      </TouchableOpacity>

      {/* Botão adicionar */}
      <TouchableOpacity style={[styles.addButton, { backgroundColor: theme?.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={20} color={theme?.textInverted} />
        <Text style={[styles.addButtonText, { color: theme?.textInverted }]}>Adicionar forma de pagamento</Text>
      </TouchableOpacity>

      {/* Componente Modal separado */}
      <CriarPagamento visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
    marginRight: 16,
  },
  cardText: {
    fontSize: 16,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
});
