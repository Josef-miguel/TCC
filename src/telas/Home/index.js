import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TelaPost from '../../modal/TelaPost';
import api from '../../../services/api';

export default function Home({ navigation }) {
  // Controle de visibilidade e animação da sidebar
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  // Controle do modal e post selecionado
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Controle do campo de busca
  const [searchQuery, setSearchQuery] = useState('');

  // Estado para armazenar os posts recomendados e populares
  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  // Filtra os posts recomendados com base na busca
  const filteredRecommended = recommendedPosts.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtra os posts populares com base na busca
  const filteredPopular = popularPosts.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Carrega os posts ao montar o componente
  useEffect(() => {
    renderPosts("rec");
    renderPosts("pop");
  }, []);

  // Função para buscar e processar os posts da API
  async function renderPosts(id) {
    try {
      const res = await api.post('TCC/posts.php');

      if (res.status === 200 && res.data.success) {
        if (id === "rec") {
          // Preenche os posts recomendados
          setRecommendedPosts(res.data.result.map(item => ({
            id: item.id_evento,
            images: Array.isArray(item.images) ? item.images : [],
            desc: item.description,
            route: item.route,
            route_exit: item.route_exit,
            price: item.price,
            numSlots: item.numSlots,
            exit_date: item.exit_date,
            return_date: item.return_date,
            review: item.review,
            fav: item.fav || false,
            theme: item.theme || 'Sem tema',
            type: item.type || 'Sem tipo',
            title: item.title
          })));
        } else if (id === "pop") {
          // Ordena e pega os 3 posts mais populares
          const top3 = res.data.result
            .sort((a, b) => b.review - a.review)
            .slice(0, 3)
            .reverse();

          setPopularPosts(top3.map(item => ({
            id: item.id_evento,
            images: Array.isArray(item.images) ? item.images : [],
            desc: item.description,
            route: item.route,
            route_exit: item.route_exit,
            price: item.price,
            numSlots: item.numSlots,
            exit_date: item.exit_date,
            return_date: item.return_date,
            review: item.review,
            fav: item.fav || false,
            theme: item.theme || 'Sem tema',
            type: item.type || 'Sem tipo',
            title: item.title
          })));
        }
      }
    } catch (error) {
      console.error('Erro ao buscar posts:', error.message);
    }
  }

  // Alterna o estado de favorito de um post
  const toggleFav = (id) => {
    setRecommendedPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    setPopularPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
  };

  // Alterna a exibição da sidebar com animação
  const toggleSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  // Abre o modal com os detalhes de um post
  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  // Renderiza cada card de post
  const renderCard = ({ item }) => (
    <TouchableOpacity onPress={() => openModal(item)} style={styles.card}>
      <Image
        source={{ uri: item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/60' }}
        style={styles.cardImage}
      />
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSubtitle}>
          {typeof item.desc === 'string'
            ? (item.desc.length > 35 ? item.desc.slice(0, 35) + '...' : item.desc)
            : 'Sem descrição disponível'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
        <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color="red" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Barra superior com menu, busca e perfil */}
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

      {/* Overlay para fechar a sidebar */}
      {sidebarVisible && <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} activeOpacity={1} />}

      {/* Sidebar com navegação */}
      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
        <Text style={styles.sidebarTitle}>Menu</Text>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => { navigation.navigate('Agenda'); toggleSidebar(); }}>
          <Text>Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          const favoritos = [...recommendedPosts, ...popularPosts].filter(p => p.fav);
          navigation.navigate('Historico', { favoritos });
          toggleSidebar();
        }}>
          <Text>Minhas Viagens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          const favoritos = [...recommendedPosts, ...popularPosts].filter(p => p.fav);
          navigation.navigate('Favoritos', { favoritos });
          toggleSidebar();
        }}>
          <Text>Minhas Viagens</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.sidebarItem, { backgroundColor: '#ffe6e6' }]} onPress={toggleSidebar}>
          <Text style={{ color: 'red' }}>Fechar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Lista de posts recomendados */}
      <FlatList
        data={filteredRecommended}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.scrollContent}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Recomendados</Text>}
      />

      {/* Lista de posts populares */}
      <Text style={styles.popularesTxt}>Populares recentemente</Text>
      <FlatList
        data={filteredPopular}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.scrollContent}
      />

      {/* Modal de detalhes do post */}
      <TelaPost
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />
    </View>
  );
}

// Estilos do componente
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
  cardSubtitle: { fontSize: 14, color: '#666', overflow: 'hidden', flexWrap: 'nowrap' },
  cardIcon: { padding: 4 },
  popularesTxt: { fontWeight: 'bold', fontSize: 14, marginVertical: 10, marginLeft: 10 },
  sidebar: { position: 'absolute', top: 0, left: 0, width: 250, height: '100%', backgroundColor: '#f2f2f2', padding: 20, zIndex: 100 },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sidebarItem: { paddingVertical: 10 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }
});
