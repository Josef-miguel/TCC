import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Tela de histórico de viagens favoritas
export default function Historico({ route, navigation }) {
  // Recebe lista de favoritos via parâmetros de rota (padrão: array vazio)
  const favoritos = route.params?.favoritos || [];
  // Estado para texto de busca
  const [searchQuery, setSearchQuery] = useState('');

  // Filtra favoritos com base no texto de busca (rota, tema ou tipo)
  const filtrados = favoritos.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Header com botão de voltar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Minhas viagens</Text>
        </TouchableOpacity>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="gray" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de cards de viagens */}
      <ScrollView style={styles.cardsContainer}>
        {filtrados.length === 0 ? (
          // Mensagem caso não haja resultados
          <Text style={styles.emptyText}>Nenhuma viagem favoritada encontrada.</Text>
        ) : (
          // Renderiza um card para cada item filtrado
          filtrados.map(item => (
            <View key={item.id} style={styles.card}>
              {/* Imagem da viagem */}
              <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
              {/* Conteúdo textual: rota e informações da excursão */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.route}</Text>
                <Text style={styles.cardSubtitle}>{item.excursionInfo}</Text>
              </View>
              {/* Ícone de coração para indicar favorito */}
              <Ionicons name="heart" size={22} color="red" style={styles.heartIcon} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Estilos da tela de histórico
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
  searchContainer: {
    flexDirection: 'row', 
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  cardsContainer: {
    marginHorizontal: 10,
  },
  card: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginTop: 10,
    padding: 10,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#555',
  },
  heartIcon: {
    marginLeft: 5,
  },
  emptyText: {
    marginTop: 20,
    textAlign: 'center',
    color: '#666',
  },
});
