import React, { useRef, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

import TelaPost from '../../modal/TelaPost';
import { db, auth } from '../../../services/firebase';

export default function Home({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [popularPosts, setPopularPosts] = useState([]);

  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth)
        .then(() => console.log('Usuário logado anonimamente:', auth.currentUser?.uid))
        .catch(error => console.error('Erro ao logar anonimamente:', error));
    }
  }, []);

  const filteredRecommended = posts.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type !== undefined && item.type.toString().includes(searchQuery))
  );

  const filteredPopular = popularPosts.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type !== undefined && item.type.toString().includes(searchQuery))
  );

  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fav: doc.data().fav || false,
        theme: doc.data().theme || ''
      }));
      setPosts(fetchedPosts);
      const popular = fetchedPosts.filter(post => (post.review || 0) > 0);
      setPopularPosts(popular);
    }, (error) => {
      console.error('Erro ao buscar eventos:', error);
    });
    return () => unsubscribe();
  }, []);

  const toggleFav = (id) => {
    setPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    setPopularPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
  };

  const toggleSidebar = () => {
    Animated.timing(sidebarAnimation, {
      toValue: sidebarVisible ? -250 : 30,
      duration: 300,
      useNativeDriver: true
    }).start();
    setSidebarVisible(!sidebarVisible);
  };

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const renderCard = (item) => (
    <TouchableOpacity key={item.id} onPress={() => openModal(item)} style={styles.card}>
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
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={32} color="#f37100" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Quero ir para...."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#a9a9a9"
        />
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-circle-outline" size={32} color="#f37100" />
        </TouchableOpacity>
      </View>

      {sidebarVisible && <TouchableOpacity style={styles.overlay} onPress={toggleSidebar} activeOpacity={1} />}

      <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
        <Text style={styles.sidebarTitle}>Menu</Text>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => { navigation.navigate('Agenda'); toggleSidebar(); }}>
          <Text style={styles.sidebarText}>Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          const favoritos = [...posts, ...popularPosts].filter(p => p.fav);
          navigation.navigate('Historico', { favoritos });
          toggleSidebar();
        }}>
          <Text style={styles.sidebarText}>Minhas Viagens</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarItem, { backgroundColor: '#ffe6e6' }]} onPress={toggleSidebar}>
          <Text style={{ color: 'red', textAlign: 'center' }}>Fechar</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Recomendados</Text>
        {filteredRecommended.length > 0 ? (
          filteredRecommended.map(item => renderCard(item))
        ) : (
          <Text style={styles.emptyText}>Nenhum evento recomendado encontrado</Text>
        )}

        <Text style={styles.popularesTxt}>Populares recentemente</Text>
        {filteredPopular.length > 0 ? (
          filteredPopular.map(item => renderCard(item))
        ) : (
          <Text style={styles.emptyText}>Nenhum evento popular encontrado</Text>
        )}
      </ScrollView>

      <TelaPost
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1b21',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#363942',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f37100',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#2b2c33',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 12,
    fontSize: 16,
    color: '#e4e4e4',
    borderWidth: 1,
    borderColor: '#f37100',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginVertical: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#363942',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f37100',
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#f0f2f5',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#a0a4ad',
    lineHeight: 20,
  },
  cardIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f9fafb',
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
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    left: -30,
    width: 280,
    height: '100%',
    backgroundColor: '#363942',
    padding: 24,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sidebarText: {
    color: "#e4e4e4",
    marginHorizontal: 'auto'
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
    marginTop: 16,
  },
  sidebarItem: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#2b2c33',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 99,
  },
  emptyText: {
    fontSize: 16,
    color: '#a0a4ad',
    textAlign: 'center',
    marginVertical: 20,
  },
});