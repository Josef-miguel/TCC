import React, { useRef, useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Animated, Image, ScrollView, SafeAreaView, Dimensions, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

import TelaPost from '../../modal/TelaPost';
import { db, auth } from '../../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';
// import { platform } from 'os';
// import { Platform } from 'react-native';


export default function Home({ navigation }) {
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  // Populares passam a ser derivados de posts

  useEffect(() => {
    if (!auth.currentUser) {
      signInAnonymously(auth)
      .then(() => console.log('Usuário logado anonimamente:', auth.currentUser?.uid))
      .catch(error => console.error('Erro ao logar anonimamente:', error));
    }
  }, []);
  
  
  const { width, height } = Dimensions.get("window");
  
  const filteredRecommended = posts.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type !== undefined && item.type.toString().includes(searchQuery))
  );
  
  const filteredPopular = posts.filter(item =>
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
    }, (error) => {
      console.error('Erro ao buscar eventos:', error);
    });
    return () => unsubscribe();
  }, []);
  
  
  // Log para verificar atualizações no estado
  useEffect(() => {
    // Logs removidos para limpeza do código
  }, [posts, filteredRecommended, filteredPopular]);
  
  // Alterna o estado de favorito de um post (Ajustar o id para o firebase)
  
  const toggleFav = (id) => {
    setPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
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
  
  const renderCard = (item) => {
    return (
      <TouchableOpacity key={item.id} onPress={() => openModal(item)} style={[styles.card, { 
        backgroundColor: theme?.cardBackground,
        borderColor: theme?.primary
      }]}>
        <Image
          source={{ uri: item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/60' }}
          style={styles.cardImage}
          />
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: theme?.textPrimary }]}>{item.title || t('home.noTitle')}</Text>
          <Text style={[styles.cardSubtitle, { color: theme?.textTertiary }]}>
            {typeof item.desc === 'string'
              ? (item.desc.length > 35 ? item.desc.slice(0, 35) + '...' : item.desc)
              : t('home.noDescription')}
          </Text>
        </View>
        <TouchableOpacity onPress={() => toggleFav(item.id)} style={styles.cardIcon}>
          <Ionicons name={item.fav ? 'heart' : 'heart-outline'} size={24} color={theme?.primary || "#f37100"} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme?.primary }]}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={32} color={theme?.primary || "#f37100"} />
        </TouchableOpacity>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme?.backgroundSecondary,
            color: theme?.textPrimary,
            borderColor: theme?.primary
          }]}
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
          />
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-circle-outline" size={32} color={theme?.primary || "#f37100"} />
        </TouchableOpacity>
      </View>

      {sidebarVisible && <TouchableOpacity style={[styles.overlay, { backgroundColor: theme?.overlay }]} onPress={toggleSidebar} activeOpacity={1} />}

      <Animated.View style={[styles.sidebar, { 
        backgroundColor: theme?.backgroundDark,
        transform: [{ translateX: sidebarAnimation }] 
      }]}>
        <Text style={[styles.sidebarTitle, { color: theme?.textPrimary }]}>{t('home.menu')}</Text>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => { navigation.navigate('Agenda'); toggleSidebar(); }}>
          <Text style={[styles.sidebarText, { color: theme?.textSecondary }]}>{t('home.agenda')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.sidebarItem} onPress={() => {
          const favoritos = posts.filter(p => p.fav);
          navigation.navigate('Favoritos', { favoritos });
          toggleSidebar();
        }}>
          <Text style={[styles.sidebarText, { color: theme?.textSecondary }]}>{t('home.favorites')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.sidebarItem, { backgroundColor: theme?.primary }]} onPress={toggleSidebar}>
          <Text style={{ color: theme?.textInverted, textAlign: 'center' }}>{t('home.close')}</Text>
        </TouchableOpacity>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('home.recommended')}</Text>
        {posts.length > 0 ? (
          filteredRecommended.map(item => renderCard(item))
        ) : (
          <Text style={[styles.emptyText, { color: theme?.textTertiary }]}>{t('home.loadingEvents')}</Text>
        )}

        <Text style={[styles.popularesTxt, { color: theme?.textPrimary }]}>{t('home.popularRecently')}</Text>
        {posts.length > 0 ? (
          filteredPopular.map(item => renderCard(item))
        ) : (
          <Text style={[styles.emptyText, { color: theme?.textTertiary }]}>{t('home.loadingEvents')}</Text>
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
  },
  topBar: {
    paddingTop: 40,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'transparent',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderBottomWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 15,
    marginHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginVertical: 12,
    marginLeft: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
  },
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardIcon: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  popularesTxt: {
    fontWeight: '600',
    fontSize: 16,
    marginVertical: 12,
    marginLeft: 16,
  },
  sidebar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    left: -30,
    width: 280,
    height: '100%',
    padding: 24,
    zIndex: 100,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sidebarText: {
    marginHorizontal: 'auto'
  },
  sidebarTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    marginTop: 16,
  },
  sidebarItem: {
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'transparent',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
});
