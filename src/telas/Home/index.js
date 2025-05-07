import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TelaPost from '../../modal/TelaPost';
import ParticiparPost from '../../modal/ParticiparPost';

export default function Home({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');

  const [recommendedPosts, setRecommendedPosts] = useState([
    { id: 1, fav: false, images: ['https://placekitten.com/300/200'], route: 'São Paulo → Rio de Janeiro', excursionInfo: 'Visita guiada pelos principais pontos turísticos.', rating: 8, comments: ['Foi incrível!', 'Recomendo demais.'], type: 'Aventura', theme: 'Montanha' },
    { id: 2, fav: true, images: ['https://placekitten.com/310/200'], route: 'Rio de Janeiro → Búzios', excursionInfo: 'Dia de praia e relax.', rating: 9, comments: ['Perfeito!', 'Sol o dia todo.'], type: 'Relax', theme: 'Praia' },
    { id: 3, fav: false, images: ['https://placekitten.com/320/200'], route: 'Salvador → Praia do Forte', excursionInfo: 'História e cultura local.', rating: 7, comments: ['Interessante.', 'Boa gastronomia.'], type: 'Cultural', theme: 'História' },
    { id: 4, fav: false, images: ['https://placekitten.com/330/200'], route: 'Curitiba → Blumenau', excursionInfo: 'Gastronomia típica alemã.', rating: 8, comments: ['Delicioso!', 'Ótima cerveja.'], type: 'Gastronomia', theme: 'Culinária local' }
  ]);

  const [popularPosts, setPopularPosts] = useState([
    { id: 5, fav: true, images: ['https://placekitten.com/302/200'], route: 'Curitiba → Foz do Iguaçu', excursionInfo: 'Tour de 3 dias com hotel e ingressos.', rating: 9, comments: ['Maravilhoso!', 'Ótimo custo-benefício.'], type: 'Romântico', theme: 'Praia ao pôr do sol' },
    { id: 6, fav: true, images: ['https://placekitten.com/340/200'], route: 'Manaus → Amazônia', excursionInfo: 'Aventura na floresta.', rating: 8, comments: ['Inesquecível!', 'Muita natureza.'], type: 'Aventura', theme: 'Trilha na floresta' },
    { id: 7, fav: false, images: ['https://placekitten.com/350/200'], route: 'Recife → Olinda', excursionInfo: 'Circuito cultural histórico.', rating: 7, comments: ['Colorido!', 'Rico em arte.'], type: 'Cultural', theme: 'Museus e arte' }
  ]);

  // Filtrar posts com base no searchQuery
  const filteredRecommended = recommendedPosts.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredPopular = popularPosts.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combina e filtra favoritos para "Minhas Viagens"
  const favoritePosts = [...recommendedPosts, ...popularPosts].filter(post => post.fav);

  const toggleFav = (id) => {
    setRecommendedPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    setPopularPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
  };

  const toggleSidebar = () => {
    Animated.timing(sidebarAnimation, { toValue: sidebarVisible ? -250 : 0, duration: 300, useNativeDriver: true }).start();
    setSidebarVisible(!sidebarVisible);
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const renderCard = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={styles.card}>
      <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.theme}</Text>
        <Text style={styles.cardSubtitle}>{item.type}</Text>
      </View>
      <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
        <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Quero ir para...."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {sidebarVisible && <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} activeOpacity={1} />}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}> 
        <Text style={styles.sidebarTitle}>Menu</Text>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => { navigation.navigate('Agenda'); toggleSidebar(); }}>
          <Text>Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity
  style={styles.sidebarItem}
  onPress={() => {
    const favoritos = [...recommendedPosts, ...popularPosts].filter(p => p.fav);
    navigation.navigate('Historico', { favoritos });
    toggleSidebar();
  }}
>
  <Text>Minhas Viagens</Text>
</TouchableOpacity>

        <TouchableOpacity style={[styles.sidebarItem, { backgroundColor: '#ffe6e6' }]} onPress={toggleSidebar}>
          <Text style={{ color: 'red' }}>Fechar</Text>
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={filteredRecommended}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Recomendados</Text>}
      />
      <Text style={styles.popularesTxt}>Populares recentemente</Text>
      <FlatList
        data={filteredPopular}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.scrollContent}
      />

     

      <TelaPost modalVisible={modalVisible} setModalVisible={setModalVisible} selectedPost={selectedPost} setSelectedPost={setSelectedPost} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  topBar: { flexDirection: 'row', alignItems: 'center', padding: 8, backgroundColor: '#f2f2f2' },
  searchInput: { flex: 1, height: 35, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 10, marginHorizontal: 8 },
  scrollContent: { padding: 10, paddingBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, elevation: 3, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, marginBottom: 12, padding: 10 },
  cardImage: { width: 60, height: 60, borderRadius: 6 },
  cardContent: { flex: 1, marginLeft: 10 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, color: '#666' },
  cardIcon: { padding: 4 },
  popularesTxt: { fontWeight: 'bold', fontSize: 14, marginVertical: 10, marginLeft: 10 },
  minhasViagensButton: { margin: 10, padding: 12, backgroundColor: '#ffdddd', borderRadius: 8, alignItems: 'center' },
  minhasViagensText: { color: 'red', fontWeight: 'bold' },
  sidebar: { position: 'absolute', top: 0, left: 0, width: 250, height: '100%', backgroundColor: '#f2f2f2', padding: 20, zIndex: 100 },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sidebarItem: { paddingVertical: 10 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }
});
