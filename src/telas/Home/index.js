import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import TelaPost from '../../modal/TelaPost';
import api from '../../../services/api';

export default function Home({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [recommendedPosts, setRecommendedPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([
    {
      id: 5, fav: true,
      images: ['https://www.melhoresdestinos.com.br/wp-content/uploads/2019/07/passagens-aereas-foz-do-iguacu-capa2019-05.jpg'],
      route: 'Curitiba → Foz do Iguaçu',
      excursionInfo: 'Tour de 3 dias com hotel e ingressos.',
      rating: 9, comments: ['Maravilhoso!', 'Ótimo custo-benefício.'],
      type: 'Romântico', theme: 'Praia ao pôr do sol'
    },
    {
      id: 6, fav: true,
      images: ['https://amazonasatual.com.br/wp-content/uploads/2017/10/TRILHA-AQU%C3%81TICA-DA-MIRATINGA.jpg'],
      route: 'Manaus → Amazônia',
      excursionInfo: 'Aventura na floresta.',
      rating: 8, comments: ['Inesquecível!', 'Muita natureza.'],
      type: 'Aventura', theme: 'Trilha na floresta'
    },
    {
      id: 7, fav: false,
      images: ['https://emalgumlugardomundo.com.br/wp-content/uploads/2023/01/o-que-fazer-em-olinda-centro-historico.jpg'],
      route: 'Recife → Olinda',
      excursionInfo: 'Circuito cultural histórico.',
      rating: 7, comments: ['Colorido!', 'Rico em arte.'],
      type: 'Cultural', theme: 'Museus e arte'
    }
  ]);

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

  useEffect(() => {
    renderPosts();
  }, []);

  async function renderPosts() {
    try {
      const res = await api.post('TCC/posts.php');
      console.log('Resposta da API:', res.data);

      if (res.status === 200 && res.data.success) {
        setRecommendedPosts(res.data.data.map(item => ({
          id: item.id,
          title: item.title,
          images: item.images,
          route: item.route,
          route_exit: item.route_exit,
          desc: item.description,
          numSlots: item.numSlots,
          exit_date: item.exit_date,
          return_date: item.return_date,
          review: item.review,
          fav: item.fav || false,
          type: item.type || 'Tipo não definido',
          theme: item.theme || 'Tema não definido'
        })));
      }
    } catch (error) {
      console.error(error.message);
    }
  }

  const toggleFav = (id) => {
    setRecommendedPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    setPopularPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
  };

  const toggleSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? -250 : 0,
      duration: 300,
      useNativeDriver: true
    }).start();
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
        <Text style={styles.cardTitle}>{item.title}</Text>
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
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          const favoritos = [...recommendedPosts, ...popularPosts].filter(p => p.fav);
          navigation.navigate('Historico', { favoritos });
          toggleSidebar();
        }}>
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

      <TelaPost
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />
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
  sidebar: { position: 'absolute', top: 0, left: 0, width: 250, height: '100%', backgroundColor: '#f2f2f2', padding: 20, zIndex: 100 },
  sidebarTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  sidebarItem: { paddingVertical: 10 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' }
});
