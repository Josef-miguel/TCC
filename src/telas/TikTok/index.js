import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  ImageBackground,
  Modal,
  Animated,
  PanResponder,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Constantes para imagens padrão
const DEFAULT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
const DEFAULT_EVENT_IMAGE = 'https://cdn.pixabay.com/photo/2016/11/22/19/08/hills-1850025_1280.jpg';

const TikTokScreen = () => {
  const { isDarkMode } = React.useContext(ThemeContext);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  // Effect para buscar posts do Firebase
  useEffect(() => {
    const q = query(collection(db, 'events'));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        setLoading(true);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Buscar dados dos organizadores para cada post
        const postsWithCreatorData = await Promise.all(
          fetchedPosts.map(async (post) => {
            try {
              if (post.uid) {
                const creatorRef = doc(db, 'user', post.uid);
                const creatorDoc = await getDoc(creatorRef);
                
                if (creatorDoc.exists()) {
                  const creatorData = creatorDoc.data();
                  return {
                    ...post,
                    creatorName: creatorData.nome || 'Organizador',
                    creatorAvatar: creatorData.profileImage || DEFAULT_AVATAR
                  };
                }
              }
              return {
                ...post,
                creatorName: 'Organizador',
                creatorAvatar: DEFAULT_AVATAR
              };
            } catch (error) {
              console.error('Erro ao buscar dados do organizador:', error);
              return {
                ...post,
                creatorName: 'Organizador',
                creatorAvatar: DEFAULT_AVATAR
              };
            }
          })
        );
        
        // Processar posts para formato TikTok
        const processedPosts = postsWithCreatorData.map(post => ({
          id: post.id,
          type: 'image', // Por enquanto todos são imagens, pode ser expandido para vídeos
          uri: post.images && post.images.length > 0 ? post.images[0] : DEFAULT_EVENT_IMAGE,
          title: post.title || 'Sem título',
          author: post.creatorName || 'Organizador',
          description: post.desc || 'Sem descrição',
          likes: post.favoriteCount || 0,
          comments: post.commentCount || 0,
          shares: Math.floor(Math.random() * 50), // Mock para compartilhamentos
          date: post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : 'Data não disponível',
          price: post.price || 0,
          numSlots: post.numSlots || 0,
          tripType: post.type || 1,
          tags: post.tags || [],
          exitDate: post.exit_date,
          returnDate: post.return_date,
          route: post.route || null,
        }));
        
        setPosts(processedPosts);
      } catch (error) {
        console.error('Erro ao buscar posts:', error);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, []);

  const handleViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index;
      setCurrentIndex(newIndex);
      
      // Pausar todos os vídeos exceto o atual
      Object.keys(videoRefs.current).forEach((key) => {
        if (videoRefs.current[key] && parseInt(key) !== newIndex) {
          videoRefs.current[key].pauseAsync();
        }
      });
      
      // Reproduzir o vídeo atual se for um vídeo
      if (posts[newIndex]?.type === 'video' && videoRefs.current[newIndex]) {
        videoRefs.current[newIndex].playAsync();
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleLike = (postId) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handlePostPress = (post) => {
    setSelectedPost(post);
    setModalVisible(true);
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedPost(null);
      fadeAnim.setValue(1);
    });
  };

  const renderPost = ({ item, index }) => {
    const isLiked = likedPosts.has(item.id);
    
    return (
      <View style={styles.postContainer}>
        {/* Conteúdo de vídeo ou imagem */}
        {item.type === 'video' ? (
          <Video
            ref={(ref) => {
              videoRefs.current[index] = ref;
            }}
            source={{ uri: item.uri }}
            style={styles.media}
            resizeMode={ResizeMode.COVER}
            shouldPlay={index === currentIndex}
            isLooping
            isMuted={false}
            volume={1.0}
          />
        ) : (
          <ImageBackground
            source={{ uri: item.uri }}
            style={styles.media}
            resizeMode="cover"
          />
        )}

        {/* Overlay gradiente */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gradientOverlay}
        />

        {/* Conteúdo do post */}
        <TouchableOpacity
          style={styles.postContent}
          onPress={() => handlePostPress(item)}
          activeOpacity={0.9}
        >
          <View style={styles.postInfo}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postDescription}>{item.description}</Text>
            <Text style={styles.postAuthor}>@{item.author}</Text>
          </View>
        </TouchableOpacity>

        {/* Ícones flutuantes laterais */}
        <View style={styles.floatingIcons}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={32}
              color={isLiked ? "#ff3040" : "#ffffff"}
            />
            <Text style={styles.iconText}>{item.likes + (isLiked ? 1 : 0)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="chatbubble-outline" size={28} color="#ffffff" />
            <Text style={styles.iconText}>{item.comments}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="arrow-redo-outline" size={28} color="#ffffff" />
            <Text style={styles.iconText}>{item.shares}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="bookmark-outline" size={28} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderModal = () => {
    if (!selectedPost) return null;

    return (
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <BlurView intensity={20} style={styles.modalOverlay}>
          <Animated.View style={[styles.modalContainer, { opacity: fadeAnim }]}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>

            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{selectedPost.title}</Text>
              <Text style={styles.modalDescription}>{selectedPost.description}</Text>
              
              {/* Informações da viagem */}
              {selectedPost.price > 0 && (
                <View style={styles.tripInfo}>
                  <Text style={styles.tripInfoText}>💰 Preço: R$ {selectedPost.price.toFixed(2)}</Text>
                  <Text style={styles.tripInfoText}>👥 Vagas: {selectedPost.numSlots}</Text>
                </View>
              )}
              
              {/* Tags */}
              {selectedPost.tags && selectedPost.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  <Text style={styles.tagsTitle}>Tags:</Text>
                  <View style={styles.tagsList}>
                    {selectedPost.tags.map((tag, index) => (
                      <Text key={index} style={styles.tag}>#{tag}</Text>
                    ))}
                  </View>
                </View>
              )}
              
              <View style={styles.modalAuthorInfo}>
                <Text style={styles.modalAuthor}>@{selectedPost.author}</Text>
                <Text style={styles.modalDate}>{selectedPost.date}</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalActionButton}
                  onPress={() => handleLike(selectedPost.id)}
                >
                  <Ionicons
                    name={likedPosts.has(selectedPost.id) ? "heart" : "heart-outline"}
                    size={24}
                    color={likedPosts.has(selectedPost.id) ? "#ff3040" : "#ffffff"}
                  />
                  <Text style={styles.modalActionText}>
                    {selectedPost.likes + (likedPosts.has(selectedPost.id) ? 1 : 0)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="chatbubble-outline" size={24} color="#ffffff" />
                  <Text style={styles.modalActionText}>{selectedPost.comments}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.modalActionButton}>
                  <Ionicons name="arrow-redo-outline" size={24} color="#ffffff" />
                  <Text style={styles.modalActionText}>{selectedPost.shares}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </BlurView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#000000' : '#000000' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando posts...</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          pagingEnabled
          showsVerticalScrollIndicator={false}
          snapToInterval={screenHeight}
          snapToAlignment="start"
          decelerationRate="fast"
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          getItemLayout={(data, index) => ({
            length: screenHeight,
            offset: screenHeight * index,
            index,
          })}
        />
      )}

      {/* Ícone de perfil no canto superior direito */}
      <TouchableOpacity style={styles.profileButton}>
        <Ionicons name="person-circle-outline" size={32} color="#ffffff" />
      </TouchableOpacity>

      {renderModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  postContainer: {
    width: screenWidth,
    height: screenHeight,
    position: 'relative',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  postContent: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 80,
    zIndex: 2,
  },
  postInfo: {
    marginBottom: 20,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  postDescription: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  floatingIcons: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
    zIndex: 3,
  },
  iconButton: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 8,
  },
  iconText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  profileButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxWidth: screenWidth - 40,
    width: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
    padding: 8,
  },
  modalContent: {
    paddingTop: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#ffffff',
    marginBottom: 20,
    lineHeight: 24,
    textAlign: 'center',
  },
  modalAuthorInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  modalAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  modalDate: {
    fontSize: 14,
    color: '#cccccc',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  modalActionButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    minWidth: 80,
  },
  modalActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  tripInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  tripInfoText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  tagsContainer: {
    marginBottom: 20,
  },
  tagsTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  tagsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    color: '#ffffff',
    fontSize: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
});

export default TikTokScreen;
