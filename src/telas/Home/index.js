import React, { useRef, useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  Dimensions, 
  StatusBar, 
  Platform,
  FlatList,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import TelaPost from '../../modal/TelaPost';
import { db, auth } from '../../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

export default function Home({ navigation, route }) {
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { totalUnread } = useNotifications();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' ou 'popular'

  const { width, height } = Dimensions.get("window");

  // Filtros para busca
  const filteredPosts = posts.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.location?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.type !== undefined && item.type.toString().includes(searchQuery))
  );

  // Ordenar posts por data (mais recentes primeiro)
  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  // Posts populares (baseado em favoritos)
  const popularPosts = [...filteredPosts]
    .filter(post => post.favCount > 0)
    .sort((a, b) => (b.favCount || 0) - (a.favCount || 0))
    .slice(0, 10);

  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        fav: false,
        theme: doc.data().theme || '',
        favCount: doc.data().favoriteCount || 0
      }));
      
      // Verifica favoritos do usuário
      if (auth.currentUser) {
        try {
          const userRef = doc(db, 'user', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const favoritePostIds = userData.favoritePosts || [];
            
            fetchedPosts.forEach(post => {
              post.fav = favoritePostIds.includes(post.id);
            });
          }
        } catch (error) {
          console.error('Erro ao verificar favoritos:', error);
        }
      }
      
      setPosts(fetchedPosts);
    }, (error) => {
      console.error('Erro ao buscar eventos:', error);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (route.params?.eventId) {
      const id = route.params.eventId;
      const ref = doc(db, "events", id);
      getDoc(ref).then((snap) => {
        if (snap.exists()) {
          setSelectedPost({ id: snap.id, ...snap.data() });
          setModalVisible(true);
        }
      });
    }
  }, [route.params?.eventId]);

  const toggleFav = async (id) => {
    if (!auth.currentUser) {
      console.log(t('favorites.userNotAuthenticated'));
      return;
    }

    try {
      const userRef = doc(db, "user", auth.currentUser.uid);
      const post = posts.find(p => p.id === id);
      
      if (post?.fav) {
        await updateDoc(userRef, {
          favoritePosts: arrayRemove(id)
        });
        // Atualizar contagem de favoritos no post
        await updateDoc(doc(db, 'events', id), {
          favoriteCount: (post.favCount || 0) - 1
        });
      } else {
        await updateDoc(userRef, {
          favoritePosts: arrayUnion(id)
        });
        // Atualizar contagem de favoritos no post
        await updateDoc(doc(db, 'events', id), {
          favoriteCount: (post.favCount || 0) + 1
        });
      }
      
      setPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    } catch (error) {
      console.error(t('favorites.errorFavoriting'), error);
    }
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

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular recarregamento
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Componente de cabeçalho do post (estilo Instagram)
  const PostHeader = ({ post }) => (
    <View style={[styles.postHeader, { borderBottomColor: theme?.border }]}>
      <View style={styles.headerLeft}>
        <Image
          source={{ uri: post.creatorAvatar || 'https://via.placeholder.com/40' }}
          style={styles.avatar}
        />
        <View>
          <Text style={[styles.username, { color: theme?.textPrimary }]}>
            {post.creatorName || 'Organizador'}
          </Text>
          <Text style={[styles.postTime, { color: theme?.textTertiary }]}>
            {post.date ? new Date(post.date).toLocaleDateString('pt-BR') : 'Data não definida'}
          </Text>
        </View>
      </View>
      <TouchableOpacity>
        <Ionicons name="ellipsis-horizontal" size={20} color={theme?.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  // Componente de ações do post (curtir, comentar, compartilhar)
  const PostActions = ({ post }) => (
    <View style={styles.postActions}>
      <View style={styles.actionsLeft}>
        <TouchableOpacity onPress={() => toggleFav(post.id)} style={styles.actionButton}>
          <Ionicons 
            name={post.fav ? 'heart' : 'heart-outline'} 
            size={26} 
            color={post.fav ? '#ff3040' : theme?.textPrimary} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => openModal(post)}>
          <Ionicons name="chatbubble-outline" size={24} color={theme?.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={24} color={theme?.textPrimary} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity>
        <Ionicons name="bookmark-outline" size={24} color={theme?.textPrimary} />
      </TouchableOpacity>
    </View>
  );

  // Componente de informações do evento
  const PostInfo = ({ post }) => (
    <View style={styles.postInfo}>
      <Text style={[styles.postTitle, { color: theme?.textPrimary }]}>
        {post.title || t('home.noTitle')}
      </Text>
      
      <View style={styles.eventDetails}>
        {post.location && (
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={theme?.textTertiary} />
            <Text style={[styles.detailText, { color: theme?.textSecondary }]}>{post.location}</Text>
          </View>
        )}
        
        {post.price && (
          <View style={styles.detailItem}>
            <Ionicons name="pricetag-outline" size={16} color={theme?.textTertiary} />
            <Text style={[styles.detailText, { color: theme?.primary }]}>R$ {post.price}</Text>
          </View>
        )}
        
        {post.date && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={theme?.textTertiary} />
            <Text style={[styles.detailText, { color: theme?.textSecondary }]}>{post.exit_date}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.postDescription, { color: theme?.textSecondary }]} numberOfLines={3}>
        {post.desc || t('home.noDescription')}
      </Text>
    </View>
  );

  // Item de post individual
  const renderPostItem = ({ item }) => (
    <View style={[styles.postContainer, { backgroundColor: theme?.cardBackground }]}>
      <PostHeader post={item} />
      
      {/* Carrossel de imagens */}
      <TouchableOpacity onPress={() => openModal(item)} activeOpacity={0.9}>
        <Image
          source={{ uri: item.images && item.images[0] ? item.images[0] : 'https://via.placeholder.com/400' }}
          style={styles.postImage}
          resizeMode="cover"
        />
      </TouchableOpacity>
      
      <PostActions post={item} />
      <PostInfo post={item} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Header Fixo */}
      <View style={[styles.header, { backgroundColor: theme?.background }]}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={28} color={theme?.primary} />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
          {t('home.title')}
        </Text>
        
        <TouchableOpacity onPress={() => navigation.navigate('Notificacoes')}>
          <View style={{ position: 'relative' }}>
            <Ionicons name="notifications-outline" size={28} color={theme?.primary} />
            {typeof totalUnread === 'number' && totalUnread > 0 && (
              <View style={[styles.notificationBadge, { backgroundColor: '#ff3b30' }]}>
                <Text style={styles.notificationBadgeText}>
                  {totalUnread > 99 ? '99+' : totalUnread.toString()}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa */}
      <View style={[styles.searchContainer, { backgroundColor: theme?.background }]}>
        <TextInput
          style={[styles.searchInput, { 
            backgroundColor: theme?.backgroundSecondary,
            color: theme?.textPrimary,
          }]}
          placeholder={t('home.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={theme?.textTertiary}
        />
        <Ionicons name="search" size={20} color={theme?.textTertiary} style={styles.searchIcon} />
      </View>

      {/* Tabs */}
      <View style={[styles.tabContainer, { backgroundColor: theme?.background }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme?.textPrimary },
            activeTab === 'timeline' && styles.activeTabText
          ]}>
            {t('home.timeline')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme?.textPrimary },
            activeTab === 'popular' && styles.activeTabText
          ]}>
            {t('home.popular')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sidebar */}
      {sidebarVisible && (
        <TouchableOpacity 
          style={[styles.overlay, { backgroundColor: theme?.overlay }]} 
          onPress={toggleSidebar} 
          activeOpacity={1} 
        />
      )}

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

      {/* Timeline de Posts */}
      <FlatList
        data={activeTab === 'timeline' ? sortedPosts : popularPosts}
        renderItem={renderPostItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme?.primary]}
            tintColor={theme?.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={theme?.textTertiary} />
            <Text style={[styles.emptyText, { color: theme?.textTertiary }]}>
              {t('home.noEvents')}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    padding: 16,
    position: 'relative',
  },
  searchInput: {
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    position: 'absolute',
    left: 32,
    top: 28,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#f37100',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#f37100',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  postContainer: {
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    paddingBottom: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  postTime: {
    fontSize: 12,
  },
  postImage: {
    width: '100%',
    height: 400,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    marginRight: 16,
  },
  postInfo: {
    paddingHorizontal: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  eventDetails: {
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  postDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
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
  },
  sidebarText: {
    fontSize: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});