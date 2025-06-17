import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, FlatList, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

import TelaPost from '../../modal/TelaPost';
import { db, auth } from '../../../services/firebase';

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
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  // Autenticação anônima
  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(() => console.log('Usuário logado anonimamente:', auth.currentUser?.uid))
        .catch(error => console.error('Erro ao logar anonimamente:', error));
    } else {
    }
  }, []);

  // Filtra os posts recomendados com base na busca
  const filteredRecommended = posts.filter(item =>
    (item.route?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Filtra os posts populares com base na busca
  const filteredPopular = popularPosts.filter(item =>
    (item.route?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Carrega os posts ao montar o componente
  useEffect(() => {
    const q = query(collection(db, 'events')); // Removido orderBy
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fav: doc.data().fav || false, // Fallback para fav
        theme: doc.data().theme || '' // Fallback para theme
      }));
      setPosts(fetchedPosts);
      // Usar review em vez de likes para popularPosts
      const popular = fetchedPosts.filter(post => (post.review || 0) > 0);
      setPopularPosts(popular);
    }, (error) => {
      console.error('Erro ao buscar eventos:', error);
    });
    return () => unsubscribe();
  }, []);

  // Log para verificar atualizações no estado
  useEffect(() => {
  }, [posts, popularPosts]);

  // Alterna o estado de favorito de um post
  const toggleFav = (id) => {
    setPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    setPopularPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
  };

  // Alterna a exibição da sidebar com animação
  const toggleSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? -250 : 30,
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
        <Text style={styles.cardTitle}>{item.title || 'Sem título'}</Text>
        <Text style={styles.cardSubtitle}>
          {typeof item.desc === 'string'
            ? (item.desc.length > 35 ? item.desc.slice(0, 35) + '...' : item.desc)
            : 'Sem descrição disponível'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
        <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color="#f37100" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
          const favoritos = [...posts, ...popularPosts].filter(p => p.fav);
          navigation.navigate('Historico', { favoritos });
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
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum evento recomendado encontrado</Text>}
      />

      {/* Lista de posts populares */}
      <Text style={styles.popularesTxt}>Populares recentemente</Text>
      <FlatList
        data={filteredPopular}
        keyExtractor={item => item.id.toString()}
        renderItem={renderCard}
        contentContainerStyle={styles.scrollContent}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum evento popular encontrado</Text>}
      />

      {/* Modal de detalhes do post */}
      <TelaPost
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />
    </SafeAreaView>
  );
}

// Estilos do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b21', // Soft light gray for a modern, clean background
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,

  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#363942', // White background for a crisp top bar
    elevation: 4, // Subtle shadow for Android
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f37100', // Light border for separation
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#2b2c33', // Slightly darker input background for contrast
    borderRadius: 20, // Rounded corners for a modern look
    paddingHorizontal: 15,
    marginHorizontal: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#f37100', // Subtle border for input
  },
  scrollContent: {
    padding: 16, // Increased padding for better spacing
    paddingBottom: 80, // Extra padding to avoid content cutoff
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600', // Semi-bold for better hierarchy
    color: '#fff', // Darker text for contrast
    marginVertical: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363942',
    borderRadius: 12, // Softer, modern rounded corners
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f37100', // Subtle border for card definition
  },
  cardImage: {
    width: 80, // Slightly larger image for better visuals
    height: 80,
    borderRadius: 10, // Rounded image corners
    backgroundColor: '#f0f2f5', // Placeholder background while loading
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600', // Semi-bold for emphasis
    color: '#fff', // Darker text for readability
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#a0a4ad', // Muted gray for secondary text
    lineHeight: 20, // Improved readability
  },
  cardIcon: {
    padding: 8,
    borderRadius: 20, // Circular touch area for favorite icon
    backgroundColor: '#f9fafb', // Light background for icon
  },
  popularesTxt: {
    fontWeight: '600',
    fontSize: 16,
    color: '#fff',
    marginVertical: 12,
    marginLeft: 16,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: -30,
    width: 280, // Slightly wider sidebar for comfort
    height: '100%',
    backgroundColor: '#ffffff', // White for a clean look
    padding: 24,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '700', // Bold for prominence
    color: '#111827', // Dark text for contrast
    marginBottom: 24,
    marginTop: 16,
  },
  sidebarItem: {
    paddingVertical: 12,
    // paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f9fafb', // Light hover-like effect
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)', // Slightly darker overlay for better focus
    zIndex: 99,
  },
});