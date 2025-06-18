import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CriarPagamento from './../../modal/CriarPagamento';

export default function FormPagamento({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minhas formas de pagamento</Text>
      </View>

      {/* Cartão */}
      <TouchableOpacity style={styles.card} onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: 'https://t.ctcdn.com.br/kMf14Wi0IOrlcp_4VoXmwz5xBD8=/i490070.jpeg' }}
          style={styles.icon}
        />
        <Text style={styles.cardText}>**** 0624</Text>
      </TouchableOpacity>

      {/* Pix */}
      <TouchableOpacity style={styles.card} onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: 'https://i.pinimg.com/736x/46/11/a5/4611a564a1f84d6758472fe7e6483671.jpg' }}
          style={styles.icon}
        />
        <Text style={styles.cardText}>Pix</Text>
      </TouchableOpacity>

      {/* Botão adicionar */}
      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={20} color="#fff" />
        <Text style={styles.addButtonText}>Adicionar forma de pagamento</Text>
      </TouchableOpacity>

      {/* Componente Modal separado */}
      <CriarPagamento visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 20 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
    color: '#1f2937',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  icon: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
    marginRight: 16,
  },
  cardText: {
    fontSize: 16,
    color: '#1f2937',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 12,
    marginTop: 24,
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
});
