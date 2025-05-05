// src/telas/Favoritos/index.js

import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const favoritos = [
  {
    id: '1',
    titulo: 'Excursão para o Rock in Rio',
    local: 'Rio de Janeiro, RJ',
    data: '21/09/2025',
    imagem: 'https://via.placeholder.com/150',
  },
  {
    id: '2',
    titulo: 'Show do Coldplay',
    local: 'São Paulo, SP',
    data: '15/10/2025',
    imagem: 'https://via.placeholder.com/150',
  },
  // Adicione mais exemplos conforme necessário
];

export default function Favoritos() {
  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Meus Favoritos</Text>
      <FlatList
        data={favoritos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.imagem }} style={styles.imagem} />
            <View style={styles.info}>
              <Text style={styles.nome}>{item.titulo}</Text>
              <Text style={styles.local}>{item.local}</Text>
              <Text style={styles.data}>{item.data}</Text>
            </View>
            <TouchableOpacity>
              <Ionicons name="heart" size={24} color="#e63946" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  titulo: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    elevation: 2,
  },
  imagem: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 10,
  },
  info: {
    flex: 1,
  },
  nome: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  local: {
    color: '#555',
  },
  data: {
    color: '#888',
  },
});
