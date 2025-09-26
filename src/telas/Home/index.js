import React, { useRef, useState, useEffect, useContext } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  Image, 
  SafeAreaView, 
  Dimensions, 
  StatusBar, 
  Platform,
  FlatList,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onSnapshot, collection, query, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { useTranslation } from 'react-i18next';

import TelaPost from '../../modal/TelaPost';
import { db, auth } from '../../../services/firebase';
import { ThemeContext } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';

// CONSTANTES PARA IMAGENS PADRÃO
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const DEFAULT_EVENT_IMAGE = 'https://cdn.pixabay.com/photo/2016/11/22/19/08/hills-1850025_1280.jpg';

// FUNÇÃO PARA CONVERTER TIMESTAMP DO FIREBASE
const formatFirebaseTimestamp = (timestamp) => {
  if (!timestamp) return 'Data não definida';
  
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate().toLocaleDateString('pt-BR');
    }
    
    if (typeof timestamp === 'string') {
      return new Date(timestamp).toLocaleDateString('pt-BR');
    }
    
    if (timestamp.seconds && timestamp.nanoseconds) {
      return new Date(timestamp.seconds * 1000).toLocaleDateString('pt-BR');
    }
    
    return 'Data não definida';
  } catch (error) {
    console.error('Erro ao formatar timestamp:', error);
    return 'Data não definida';
  }
};

const formatTripDate = (dateString) => {
  if (!dateString) return 'Data não definida';
  
  try {
    if (typeof dateString === 'string') {
      return new Date(dateString).toLocaleDateString('pt-BR');
    }
    return formatFirebaseTimestamp(dateString);
  } catch (error) {
    return 'Data não definida';
  }
};

// COMPONENTE PARA IMAGEM COM FALLBACK
const AvatarImage = ({ source, style }) => {
  const [imageError, setImageError] = useState(false);
  
  return (
    <Image
      source={{ uri: imageError ? DEFAULT_AVATAR : (source || DEFAULT_AVATAR) }}
      style={style}
      onError={() => setImageError(true)}
      defaultSource={{ uri: DEFAULT_AVATAR }}
    />
  );
};

// COMPONENTE PARA IMAGEM DO POST COM FALLBACK
const PostImageWithFallback = ({ post, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = post.images && post.images[0] ? post.images[0] : DEFAULT_EVENT_IMAGE;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageError ? DEFAULT_EVENT_IMAGE : imageUrl }}
          style={styles.postImage}
          resizeMode="cover"
          onError={() => setImageError(true)}
          defaultSource={{ uri: DEFAULT_EVENT_IMAGE }}
        />
        <View style={styles.imageOverlay}>
          <View style={styles.priceTag}>
            <Text style={styles.priceText}>R$ {post.price || '0'}</Text>
          </View>
          {post.favCount > 0 && (
            <View style={styles.popularBadge}>
              <Ionicons name="flame" size={14} color="#FFF" />
              <Text style={styles.popularText}>{post.favCount}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function Home({ navigation, route }) {
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { totalUnread } = useNotifications();
  
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-Dimensions.get('window').width)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [showPostMenu, setShowPostMenu] = useState(false);
  const [selectedPostForMenu, setSelectedPostForMenu] = useState(null);

  // FUNÇÃO MELHORADA PARA TOGGLE DO SIDEBAR
  const toggleSidebar = () => {
    if (sidebarVisible) {
      // Fechar sidebar
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: -Dimensions.get('window').width,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start(() => {
        setSidebarVisible(false);
      });
    } else {
      // Abrir sidebar
      setSidebarVisible(true);
      Animated.parallel([
        Animated.timing(sidebarAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  };

  const closeSidebar = () => {
    if (sidebarVisible) {
      toggleSidebar();
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular recarregamento dos dados
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  const openModal = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
    closeSidebar();
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPost(null);
  };

  const openPostMenu = (post) => {
    setSelectedPostForMenu(post);
    setShowPostMenu(true);
    closeSidebar();
  };

  const closePostMenu = () => {
    setShowPostMenu(false);
    setSelectedPostForMenu(null);
  };

  const processPosts = (postsData) => {
    return postsData.map(post => ({
      ...post,
      formattedDate: formatFirebaseTimestamp(post.date),
      formattedExitDate: formatTripDate(post.exit_date),
      formattedReturnDate: formatTripDate(post.return_date),
      formattedCreatedAt: formatFirebaseTimestamp(post.createdAt),
      creatorAvatar: post.creatorAvatar || DEFAULT_AVATAR,
      images: post.images && post.images[0] ? post.images : [DEFAULT_EVENT_IMAGE]
    }));
  };

  const toggleFav = async (id) => {
    if (!auth.currentUser) {
      console.log('Usuário não autenticado');
      return;
    }

    try {
      const userRef = doc(db, "user", auth.currentUser.uid);
      const post = posts.find(p => p.id === id);
      
      if (post?.fav) {
        await updateDoc(userRef, {
          favoritePosts: arrayRemove(id)
        });
        await updateDoc(doc(db, 'events', id), {
          favoriteCount: (post.favCount || 0) - 1
        });
      } else {
        await updateDoc(userRef, {
          favoritePosts: arrayUnion(id)
        });
        await updateDoc(doc(db, 'events', id), {
          favoriteCount: (post.favCount || 0) + 1
        });
      }
      
      setPosts(prev => prev.map(i => i.id === id ? { ...i, fav: !i.fav } : i));
    } catch (error) {
      console.error('Erro ao favoritar:', error);
      Alert.alert('Erro', 'Não foi possível favoritar o post');
    }
  };

  const toggleSave = async (id) => {
    if (!auth.currentUser) return;

    try {
      const userRef = doc(db, "user", auth.currentUser.uid);
      const post = posts.find(p => p.id === id);
      
      if (post?.saved) {
        await updateDoc(userRef, {
          savedPosts: arrayRemove(id)
        });
      } else {
        await updateDoc(userRef, {
          savedPosts: arrayUnion(id)
        });
      }
      
      setPosts(prev => prev.map(i => i.id === id ? { ...i, saved: !i.saved } : i));
    } catch (error) {
      console.error('Erro ao salvar post:', error);
      Alert.alert('Erro', 'Não foi possível salvar o post');
    }
  };

  const handleReportarProblema = () => {
    closePostMenu();
    Alert.alert('Reportar Problema', 'Funcionalidade em desenvolvimento.');
  };

  const handleSalvarPost = async () => {
    if (!auth.currentUser || !selectedPostForMenu?.id) return;

    try {
      closePostMenu();
      await toggleSave(selectedPostForMenu.id);
    } catch (error) {
      console.error("Erro ao salvar/remover post:", error);
    }
  };

  const handleVisualizarPerfil = () => {
    closePostMenu();
    Alert.alert('Visualizar Perfil', 'Funcionalidade em desenvolvimento.');
  };

  // Filtros e ordenação
  const filteredPosts = posts.filter(item =>
    (item.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.theme?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (item.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
    const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
    return dateB - dateA;
  });

  const popularPosts = [...filteredPosts]
    .filter(post => post.favCount > 0)
    .sort((a, b) => (b.favCount || 0) - (a.favCount || 0))
    .slice(0, 10);

  // EFFECT PARA BUSCAR POSTS
  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          fav: false,
          saved: false,
          theme: doc.data().theme || '',
          favCount: doc.data().favoriteCount || 0,
          commentCount: doc.data().commentCount || 0
        }));
        
        if (auth.currentUser) {
          try {
            const userRef = doc(db, 'user', auth.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const favoritePostIds = userData.favoritePosts || [];
              const savedPostIds = userData.savedPosts || [];
              
              fetchedPosts.forEach(post => {
                post.fav = favoritePostIds.includes(post.id);
                post.saved = savedPostIds.includes(post.id);
              });
            }
          } catch (error) {
            console.error('Erro ao verificar favoritos e salvos:', error);
          }
        }
        
        setPosts(processPosts(fetchedPosts));
      } catch (error) {
        console.error('Erro ao buscar posts:', error);
        Alert.alert('Erro', 'Não foi possível carregar os posts');
      }
    });
    
    return () => unsubscribe();
  }, []);

  // EFFECT PARA ABRIR POST ESPECÍFICO
  useEffect(() => {
    if (route.params?.eventId) {
      const id = route.params.eventId;
      const ref = doc(db, "events", id);
      getDoc(ref).then((snap) => {
        if (snap.exists()) {
          const postData = { id: snap.id, ...snap.data() };
          setSelectedPost(processPosts([postData])[0]);
          setModalVisible(true);
        }
      }).catch(error => {
        console.error('Erro ao abrir post:', error);
      });
    }
  }, [route.params?.eventId]);

  // ========== COMPONENTES DE CARD ==========
  const TripTypeBadge = ({ type }) => {
    const typeConfig = {
      1: { label: 'VIAGEM', color: '#10b981', icon: 'airplane' },
      2: { label: 'EXCURSÃO', color: '#f59e0b', icon: 'bus' },
      3: { label: 'SHOW', color: '#ef4444', icon: 'musical-notes' }
    };
    
    const config = typeConfig[type] || typeConfig[1];
    
    return (
      <View style={[styles.typeBadge, { backgroundColor: config.color + '20' }]}>
        <Ionicons name={config.icon} size={12} color={config.color} />
        <Text style={[styles.typeBadgeText, { color: config.color }]}>
          {config.label}
        </Text>
      </View>
    );
  };

  const PostHeader = ({ post }) => (
    <View style={[styles.postHeader, { backgroundColor: theme?.background }]}>
      <View style={styles.headerLeft}>
        <AvatarImage
          source={post.creatorAvatar}
          style={styles.avatar}
        />
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: theme?.textPrimary }]}>
            {post.creatorName || 'Organizador'}
          </Text>
          <Text style={[styles.postTime, { color: theme?.textTertiary }]}>
            {post.formattedDate || 'Em breve'}
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TripTypeBadge type={post.type} />
        <TouchableOpacity onPress={() => openPostMenu(post)} style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color={theme?.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const PostActions = ({ post }) => (
    <View style={[styles.postActions, { backgroundColor: theme?.background }]}>
      <View style={styles.actionsLeft}>
        <TouchableOpacity 
          onPress={() => toggleFav(post.id)} 
          style={[styles.actionButton, styles.favButton]}
        >
          <Ionicons 
            name={post.fav ? 'heart' : 'heart-outline'} 
            size={24} 
            color={post.fav ? '#ff3040' : theme?.textTertiary} 
          />
          <Text style={[
            styles.actionCount,
            { color: post.fav ? '#ff3040' : theme?.textTertiary }
          ]}>
            {post.favCount || 0}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.commentButton]}
          onPress={() => openModal(post)}
        >
          <Ionicons name="chatbubble-outline" size={22} color={theme?.textTertiary} />
          <Text style={[styles.actionCount, { color: theme?.textTertiary }]}>
            {post.commentCount || 0}
          </Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        onPress={() => toggleSave(post.id)}
        style={styles.saveButton}
      >
        <Ionicons 
          name={post.saved ? 'bookmark' : 'bookmark-outline'} 
          size={22} 
          color={post.saved ? theme?.primary : theme?.textTertiary} 
        />
      </TouchableOpacity>
    </View>
  );

  const PostInfo = ({ post }) => (
    <View style={[styles.postInfo, { backgroundColor: theme?.background }]}>
      <Text style={[styles.postTitle, { color: theme?.textPrimary }]}>
        {post.title || 'Viagem incrível!'}
      </Text>
      
      <View style={styles.eventDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="location-outline" size={16} color={theme?.primary} />
            <Text style={[styles.detailText, { color: theme?.textSecondary }]} numberOfLines={1}>
              {post.location || 'Local a definir'}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Ionicons name="people-outline" size={16} color={theme?.primary} />
            <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
              {post.numSlots || 0} vagas
            </Text>
          </View>
        </View>
        
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={16} color={theme?.primary} />
            <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
              {post.formattedExitDate || 'Data não definida'}
            </Text>
          </View>
          
          {post.formattedReturnDate && post.formattedReturnDate !== 'Data não definida' && (
            <View style={styles.detailItem}>
              <Ionicons name="arrow-redo-outline" size={16} color={theme?.primary} />
              <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
                {post.formattedReturnDate}
              </Text>
            </View>
          )}
        </View>
      </View>

      <Text style={[styles.postDescription, { color: theme?.textSecondary }]} numberOfLines={2}>
        {post.desc || 'Uma experiência única te aguarda! Não perca essa oportunidade.'}
      </Text>
      
      <TouchableOpacity 
        style={styles.viewDetailsButton}
        onPress={() => openModal(post)}
      >
        <Text style={[styles.viewDetailsText, { color: theme?.primary }]}>
          Ver detalhes completos
        </Text>
        <Ionicons name="arrow-forward" size={16} color={theme?.primary} />
      </TouchableOpacity>
    </View>
  );

  const renderPostItem = ({ item }) => (
    <View style={[styles.postCard, { 
      backgroundColor: theme?.cardBackground || theme?.background,
      shadowColor: theme?.mode === 'dark' ? '#000' : 'rgba(0,0,0,0.1)'
    }]}>
      <PostHeader post={item} />
      <PostImageWithFallback post={item} onPress={() => openModal(item)} />
      <PostActions post={item} />
      <PostInfo post={item} />
    </View>
  );

  const SidebarContent = () => (
    <Animated.View style={[styles.sidebar, { 
      backgroundColor: theme?.backgroundDark || theme?.background,
      transform: [{ translateX: sidebarAnimation }],
      shadowColor: theme?.mode === 'dark' ? '#fff' : '#000',
      shadowOffset: { width: 2, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 20,
    }]}>
      <View style={styles.sidebarHeader}>
        <Text style={[styles.sidebarTitle, { color: theme?.textPrimary }]}>Menu</Text>
        <TouchableOpacity onPress={closeSidebar} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme?.textPrimary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.sidebarContent}>
        <TouchableOpacity 
          style={[styles.sidebarItem]} 
          onPress={() => { navigation.navigate('Agenda'); closeSidebar(); }}
        >
          <Ionicons name="calendar-outline" size={22} color={theme?.textSecondary} />
          <Text style={[styles.sidebarText, { color: theme?.textSecondary }]}>Minha Agenda</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.sidebarItem]} 
          onPress={() => { navigation.navigate('Favoritos'); closeSidebar(); }}
        >
          <Ionicons name="heart-outline" size={22} color={theme?.textSecondary} />
          <Text style={[styles.sidebarText, { color: theme?.textSecondary }]}>Favoritos</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      <StatusBar 
        barStyle={theme?.mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme?.background} 
      />
      
      {/* Overlay animado para o sidebar */}
      {sidebarVisible && (
        <Animated.View 
          style={[
            styles.overlay, 
            { 
              opacity: overlayOpacity,
              backgroundColor: 'rgba(0, 0, 0, 0.5)'
            }
          ]} 
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFill} 
            onPress={closeSidebar} 
            activeOpacity={1} 
          />
        </Animated.View>
      )}
      
      <SidebarContent />

      {/* Header Principal */}
      <View style={[styles.header, { backgroundColor: theme?.background }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={toggleSidebar} style={styles.menuButton}>
            <Ionicons name="menu" size={28} color={theme?.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
              Excursões
            </Text>
          </View>
          
          <TouchableOpacity 
            onPress={() => { navigation.navigate('Notificacoes'); closeSidebar(); }} 
            style={styles.notificationButton}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="notifications-outline" size={24} color={theme?.primary} />
              {typeof totalUnread === 'number' && totalUnread > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: '#ff3b30' }]}>
                  <Text style={styles.notificationBadgeText}>
                    {totalUnread > 99 ? '99+' : totalUnread}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: theme?.background }]}>
          <View style={[styles.searchInputContainer, { backgroundColor: theme?.backgroundSecondary }]}>
            <Ionicons name="search" size={20} color={theme?.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme?.textPrimary }]}
              placeholder="Buscar excursões..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={theme?.textTertiary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme?.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Abas */}
      <View style={[styles.tabContainer, { backgroundColor: theme?.background }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'timeline' && styles.activeTab]}
          onPress={() => setActiveTab('timeline')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme?.textSecondary },
            activeTab === 'timeline' && [styles.activeTabText, { color: theme?.textPrimary }]
          ]}>
            Para você
          </Text>
          {activeTab === 'timeline' && <View style={[styles.tabIndicator, { backgroundColor: theme?.primary }]} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'popular' && styles.activeTab]}
          onPress={() => setActiveTab('popular')}
        >
          <Text style={[
            styles.tabText, 
            { color: theme?.textSecondary },
            activeTab === 'popular' && [styles.activeTabText, { color: theme?.textPrimary }]
          ]}>
            Populares
          </Text>
          {activeTab === 'popular' && <View style={[styles.tabIndicator, { backgroundColor: theme?.primary }]} />}
        </TouchableOpacity>
      </View>

      {/* Lista de Posts */}
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
              Nenhuma excursão encontrada
            </Text>
            <Text style={[styles.emptySubtext, { color: theme?.textTertiary }]}>
              {searchQuery ? 'Tente buscar com outros termos' : 'Novas excursões em breve!'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Modal do Post */}
      <TelaPost
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        selectedPost={selectedPost}
        setSelectedPost={setSelectedPost}
      />

      {/* Menu de Opções do Post */}
      {showPostMenu && selectedPostForMenu && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={styles.menuOverlayTouchable}
            onPress={closePostMenu}
            activeOpacity={1}
          />
          <View style={[styles.dropdownMenu, { backgroundColor: theme?.backgroundSecondary }]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleReportarProblema}>
              <Ionicons name="flag-outline" size={20} color={theme?.textPrimary} />
              <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>Reportar Problema</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={handleSalvarPost}>
              <Ionicons 
                name={selectedPostForMenu.saved ? "bookmark" : "bookmark-outline"} 
                size={20} 
                color={theme?.textPrimary} 
              />
              <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>
                {selectedPostForMenu.saved ? 'Remover dos Salvos' : 'Salvar Post'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.dropdownItem} onPress={handleVisualizarPerfil}>
              <Ionicons name="person-outline" size={20} color={theme?.textPrimary} />
              <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>Ver Perfil</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: Dimensions.get('window').width * 0.8,
    maxWidth: 300,
    height: '100%',
    padding: 20,
    zIndex: 100,
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 20,
  },
  sidebarContent: {
    flex: 1,
  },
  sidebarTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 8,
    paddingHorizontal: 12,
  },
  sidebarText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  menuButton: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  notificationButton: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  searchContainer: {
    marginTop: 4,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 16,
    height: 40,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '40%',
    borderRadius: 2,
  },
  postCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    fontSize: 12,
    opacity: 0.7,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 4,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priceTag: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priceText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  actionsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  actionCount: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 6,
  },
  postInfo: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    lineHeight: 24,
  },
  eventDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    marginLeft: 6,
    flex: 1,
  },
  postDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
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
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuOverlayTouchable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dropdownMenu: {
    borderRadius: 12,
    padding: 8,
    minWidth: 200,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  dropdownText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
});