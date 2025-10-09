import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../services/firebase';
import { useAuth } from '../../../services/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import TelaPost from '../../modal/TelaPost';

const { width } = Dimensions.get('window');

export default function VisualizarPerfil({ route, navigation }) {
  const rawUid = route?.params?.uid;
  const uid = typeof rawUid === 'string' ? rawUid.trim() : rawUid;

  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const { userData: authUser } = useAuth();

  const fetchUserData = async () => {
    try {
      if (!uid) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'user', uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const data = userDoc.data();
      setUserData({ 
        uid: uid, 
        userInfo: data, 
        isOrganizer: !!data?.isOrganizer 
      });

      // Buscar posts do organizador
      if (data?.isOrganizer) {
        const fields = ['uid', 'creatorId', 'userUID', 'creatorUid'];
        const docsMap = new Map();
        
        for (const field of fields) {
          const q = query(collection(db, 'events'), where(field, '==', uid));
          const unsub = onSnapshot(q, (snapshot) => {
            snapshot.docs.forEach(d => docsMap.set(d.id, { 
              id: d.id, 
              ...d.data(),
              favoriteCount: d.data().favoriteCount || 0,
              commentCount: d.data().commentCount || 0
            }));
            setPosts(Array.from(docsMap.values()));
          });
        }
      }

    } catch (error) {
      console.error('VisualizarPerfil: error fetching user by uid', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [uid]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const isOwnProfile = userData && authUser && userData.uid === authUser.uid;

  const renderStats = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme?.primary }]}>
          {posts.length}
        </Text>
        <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
          Excursões
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme?.primary }]}>
          {posts.reduce((total, post) => total + (post.favoriteCount || 0), 0)}
        </Text>
        <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
          Curtidas
        </Text>
      </View>
      <View style={styles.statItem}>
        <Text style={[styles.statNumber, { color: theme?.primary }]}>
          {posts.reduce((total, post) => total + (post.commentCount || 0), 0)}
        </Text>
        <Text style={[styles.statLabel, { color: theme?.textSecondary }]}>
          Comentários
        </Text>
      </View>
    </View>
  );

  const renderPost = (post, index) => (
    <TouchableOpacity
      key={post.id || index}
      style={[styles.postCard, { 
        backgroundColor: theme?.cardBackground,
        borderColor: theme?.border 
      }]}
      onPress={() => {
        setSelectedPost(post);
        setModalVisible(true);
      }}
    >
      {post.images && post.images[0] ? (
        <Image 
          source={{ uri: post.images[0] }} 
          style={styles.postImage}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.postImagePlaceholder, { backgroundColor: theme?.primary + '20' }]}>
          <Ionicons name="images" size={32} color={theme?.primary} />
        </View>
      )}
      
      <View style={styles.postContent}>
        <Text style={[styles.postTitle, { color: theme?.textPrimary }]} 
              numberOfLines={1}>
          {post.title || 'Excursão sem título'}
        </Text>
        
        <Text style={[styles.postDesc, { color: theme?.textSecondary }]} 
              numberOfLines={2}>
          {post.desc || 'Descrição não disponível'}
        </Text>
        
        <View style={styles.postStats}>
          <View style={styles.postStat}>
            <Ionicons name="heart" size={14} color={theme?.primary} />
            <Text style={[styles.postStatText, { color: theme?.textTertiary }]}>
              {post.favoriteCount || 0}
            </Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble" size={14} color={theme?.primary} />
            <Text style={[styles.postStatText, { color: theme?.textTertiary }]}>
              {post.commentCount || 0}
            </Text>
          </View>
          {post.price && (
            <View style={styles.postStat}>
              <Ionicons name="pricetag" size={14} color={theme?.primary} />
              <Text style={[styles.postStatText, { color: theme?.textTertiary }]}>
                R$ {post.price}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme?.primary} />
          <Text style={[styles.loadingText, { color: theme?.textPrimary }]}>
            Carregando perfil...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="person-circle-outline" size={80} color={theme?.textTertiary} />
          <Text style={[styles.errorText, { color: theme?.textPrimary }]}>
            Perfil não encontrado
          </Text>
          <Text style={[styles.errorSubtext, { color: theme?.textSecondary }]}>
            O usuário pode ter excluído a conta ou o link está incorreto.
          </Text>
          <TouchableOpacity 
            style={[styles.backButton, { backgroundColor: theme?.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: '#fff' }]}>
              Voltar
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = (
    userData.userInfo?.nome ||
    userData.userInfo?.name ||
    userData.userInfo?.userInfo?.nome ||
    userData.userInfo?.displayName ||
    'Usuário'
  );

  const displayBio = (
    userData.userInfo?.desc ||
    userData.userInfo?.description ||
    userData.userInfo?.bio ||
    (isOwnProfile ? 'Adicione uma bio no seu perfil!' : 'Este usuário ainda não adicionou uma bio.')
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme?.primary]}
            tintColor={theme?.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme?.cardBackground }]}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={[styles.backButton, { backgroundColor: theme?.background }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme?.primary} />
          </TouchableOpacity>
          
          <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
            Perfil
          </Text>
          
          {!isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { 
                targetUid: userData.uid, 
                targetUser: userData.userInfo 
              })}
              style={[styles.chatButton, { backgroundColor: theme?.primary }]}
            >
              <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Info */}
        <View style={[styles.profileSection, { backgroundColor: theme?.cardBackground }]}>
          <View style={styles.avatarContainer}>
            {(
              userData.userInfo?.profileImage ||
              userData.userInfo?.photoURL ||
              userData.userInfo?.avatar
            ) ? (
              <Image
                source={{ uri: userData.userInfo?.profileImage || userData.userInfo?.photoURL || userData.userInfo?.avatar }}
                style={[styles.avatar, { borderColor: theme?.primary }]}
              />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback, { borderColor: theme?.primary }]}>
                <Text style={[styles.avatarText, { color: theme?.primary }]}>
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            
            {userData.isOrganizer && (
              <View style={[styles.organizerBadge, { backgroundColor: theme?.primary }]}>
                <Ionicons name="star" size={12} color="#fff" />
                <Text style={styles.organizerText}>Organizador</Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: theme?.textPrimary }]}>
            {displayName}
          </Text>

          <Text style={[styles.description, { color: theme?.textSecondary }]}>
            {displayBio}
          </Text>

          {/* Stats */}
          {userData.isOrganizer && renderStats()}
        </View>

        {/* Posts Section - Only for organizers */}
        {userData.isOrganizer && (
          <View style={styles.postsSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Excursões Criadas ({posts.length})
              </Text>
            </View>
            
            {posts.length > 0 ? (
              <View style={styles.postsGrid}>
                {posts.map(renderPost)}
              </View>
            ) : (
              <View style={styles.emptyPosts}>
                <Ionicons name="map-outline" size={64} color={theme?.textTertiary} />
                <Text style={[styles.emptyText, { color: theme?.textTertiary }]}>
                  Nenhuma excursão criada ainda
                </Text>
                <Text style={[styles.emptySubtext, { color: theme?.textTertiary }]}>
                  {isOwnProfile 
                    ? 'Crie sua primeira excursão para compartilhar com outros viajantes!' 
                    : 'Este organizador ainda não criou nenhuma excursão.'
                  }
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Non-organizer message */}
        {!userData.isOrganizer && (
          <View style={[styles.nonOrganizerSection, { backgroundColor: theme?.cardBackground }]}>
            <Ionicons name="people-outline" size={48} color={theme?.textTertiary} />
            <Text style={[styles.nonOrganizerText, { color: theme?.textPrimary }]}>
              {isOwnProfile 
                ? 'Torne-se um organizador para criar excursões!' 
                : 'Este usuário ainda não é um organizador'
              }
            </Text>
            <Text style={[styles.nonOrganizerSubtext, { color: theme?.textSecondary }]}>
              {isOwnProfile 
                ? 'Crie excursões incríveis e compartilhe com outros viajantes.' 
                : 'Quando se tornar organizador, as excursões aparecerão aqui.'
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Modal TelaPost */}
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  backButton: {
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatButton: {
    padding: 8,
    borderRadius: 20,
    elevation: 2,
  },
  profileSection: {
    padding: 24,
    margin: 16,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
  },
  avatarFallback: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  organizerBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
  },
  organizerText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  postsSection: {
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  postsGrid: {
    gap: 12,
  },
  postCard: {
    borderRadius: 16,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  postImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  postStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyPosts: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 0,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 0,
    textAlign: 'center',
    lineHeight: 20,
  },
  nonOrganizerSection: {
    padding: 32,
    margin: 16,
    borderRadius: 20,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nonOrganizerText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    textAlign: 'center',
  },
  nonOrganizerSubtext: {
    fontSize: 14,
    marginTop: 0,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});