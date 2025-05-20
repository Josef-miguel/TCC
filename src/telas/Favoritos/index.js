import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Tela de favoritos do usuário
export default function Favoritos({ navigation, route }) {
  // Estado local para lista de favoritos
  const [favorites, setFavorites] = useState([]);

  // Atualiza favoritos toda vez que a tela ganha foco (pode receber novos params)
  useFocusEffect(
    React.useCallback(() => {
      // Lê a lista de favoritos enviada pela rota (ou array vazio)
      const favs = route.params?.favoritos || [];
      setFavorites(favs);
    }, [route.params?.favoritos])
  );

  // Remove header default e configura custom header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Alterna estado de favorito e filtra removendo itens desfavoritados
  const toggleFav = (id) => {
    const updated = favorites
      .map(item => (item.id === id ? { ...item, fav: !item.fav } : item))
      .filter(item => item.fav);
    setFavorites(updated);
  };

  // Função para renderizar cada item no FlatList
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Imagem de capa da viagem */}
      <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
      {/* Conteúdo: tema, tipo e rota */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.theme}</Text>
        <Text style={styles.cardSubtitle}>{item.type}</Text>
        <Text style={styles.cardRoute}>{item.route}</Text>
      </View>
      {/* Ícone para desfavoritar */}
      <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
        <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botão de voltar para a tela anterior */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Minhas Viagens</Text>
      </TouchableOpacity>

      {/* Se não houver favoritos, mostra mensagem; senão lista em FlatList */}
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum favorito.</Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

// Estilos da tela de Favoritos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backButton: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: '#f2f2f2' },
  backText: { fontSize: 16, color: '#000', marginLeft: 6 },
  listContent: { padding: 10 },
  card: {
    flexDirection: 'row',         
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2,                
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 12,
    padding: 10,
  },
  cardImage: { width: 60, height: 60, borderRadius: 6 },
  cardContent: { flex: 1, marginLeft: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  cardRoute: { fontSize: 12, color: '#999', marginTop: 4 },
  cardIcon: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16, color: '#666' },
});
