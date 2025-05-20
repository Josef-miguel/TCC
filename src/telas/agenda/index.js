import React, { useState, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

// Tela de favoritos do usuário
export default function Favoritos({ navigation, route }) {
  // Estado local para armazenar a lista de favoritos
  const [favorites, setFavorites] = useState([]);

  // Hook que executa sempre que a tela ganha foco na navegação
  useFocusEffect(
    React.useCallback(() => {
      // Obtém a lista de favoritos passada via parâmetros da rota ou um array vazio
      const favs = route.params?.favoritos || [];
      // Atualiza o estado com os favoritos atuais
      setFavorites(favs);
    }, [route.params?.favoritos]) // Executa quando route.params?.favoritos muda
  );

  // Hook para configurar o layout do header antes da renderização
  useLayoutEffect(() => {
    // Remove o header padrão da navegação
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  // Função que alterna o estado de favorito de um item e filtra itens não-favoritados
  const toggleFav = (id) => {
    const updated = favorites
      // Se o ID corresponder, inverte a flag "fav"; caso contrário, mantém o item
      .map(item => (item.id === id ? { ...item, fav: !item.fav } : item))
      // Remove itens cuja flag "fav" seja false (desfavoritados)
      .filter(item => item.fav);
    // Atualiza o estado com a lista filtrada
    setFavorites(updated);
  };

  // Renderiza cada item da lista de favoritos
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      {/* Imagem de destaque da viagem */}
      <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
      {/* Informações do item: tema, tipo e rota */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.theme}</Text>
        <Text style={styles.cardSubtitle}>{item.type}</Text>
        <Text style={styles.cardRoute}>{item.route}</Text>
      </View>
      {/* Botão para desfavoritar item */}
      <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
        <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Botão de navegação para voltar */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Ionicons name="arrow-back" size={24} color="#000" />
        <Text style={styles.backText}>Minhas Viagens</Text>
      </TouchableOpacity>

      {/* Se não houver itens na lista, exibe mensagem vazia */}
      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhum favorito.</Text>
        </View>
      ) : (
        // Caso haja favoritos, renderiza a lista com FlatList
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

// Estilos para a tela Favoritos
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    flexDirection: 'row',       
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f2f2f2',
  },
  backText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 6,
  },
  listContent: {
    padding: 10,
  },
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  cardRoute: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  cardIcon: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center', 
    alignItems: 'center',       
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
});
