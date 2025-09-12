import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Dimensions
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
  // normalize uid param (trim strings) and log
  const rawUid = route?.params?.uid;
  const uid = typeof rawUid === 'string' ? rawUid.trim() : rawUid;

  // resolved uid from navigation params
  const { t } = useTranslation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  // keep auth context for minor UI comparisons only
  const { userData: authUser } = useAuth();

  useEffect(() => {
    let unsubscribes = [];

    const fetchUserData = async () => {
      try {
        if (!uid) {
          setLoading(false);
          return;
        }

        // Fetch the user document with id === uid
        const userRef = doc(db, 'user', uid);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
          // not found
          setUserData(null);
          setLoading(false);
          return;
        }

        const data = userDoc.data();
        setUserData({ uid: uid, userInfo: data, isOrganizer: !!data?.isOrganizer });

        // If organizer, subscribe to their posts using historical fields
        if (data?.isOrganizer) {
          const fields = ['uid', 'creatorId', 'userUID'];
          const docsMap = new Map();
          fields.forEach((field) => {
            const q = query(collection(db, 'events'), where(field, '==', uid));
            const unsub = onSnapshot(q, (snapshot) => {
              snapshot.docs.forEach(d => docsMap.set(d.id, { id: d.id, ...d.data() }));
              setPosts(Array.from(docsMap.values()));
            });
            unsubscribes.push(unsub);
          });
        }

      } catch (error) {
        console.error('VisualizarPerfil: error fetching user by uid', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();

    return () => {
      if (unsubscribes && unsubscribes.length) {
        unsubscribes.forEach(u => { try { u(); } catch (e) {} });
      }
    };
  }, [uid]);

  // Small UI debug box to show resolved userData for quick visual confirmation
  const DebugBox = () => {
    if (!userData) return null;
    return (
      <View style={{ position: 'absolute', right: 8, top: 80, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', padding: 8, borderRadius: 6 }}>
        <Text style={{ color: '#fff', fontSize: 12 }}>resolved uid: {userData.uid}</Text>
        <Text style={{ color: '#fff', fontSize: 11 }}>name: {userData.userInfo?.nome || userData.userInfo?.userInfo?.nome || ''}</Text>
      </View>
    );
  };

  const renderPost = (post) => (
    <TouchableOpacity
      key={post.id}
      style={[styles.postCard, { backgroundColor: theme?.cardBackground, borderColor: theme?.primary }]}
      onPress={() => {
        setSelectedPost(post);
        setModalVisible(true);
      }}
    >
      {post.images && post.images[0] && (
        <Image source={{ uri: post.images[0] }} style={styles.postImage} />
      )}
      <View style={styles.postContent}>
        <Text style={[styles.postTitle, { color: theme?.textPrimary }]}>{post.title}</Text>
        <Text style={[styles.postDesc, { color: theme?.textTertiary }]}>
          {post.desc?.length > 50 ? post.desc.slice(0, 50) + '...' : post.desc}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme?.textPrimary }]}>{t('profile.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme?.textPrimary }]}>{t('profile.userNotFound')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Small label to indicate when viewing another user's profile */}
        {userData && authUser && userData.uid !== authUser.uid && (
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <Text style={{ color: theme?.textTertiary, fontSize: 12 }}>Viewing profile for uid: {userData.uid}</Text>
          </View>
        )}
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme?.primary || "#f37100"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>{t('profile.profile')}</Text>
          {userData && authUser && userData.uid !== authUser.uid && (
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { targetUid: userData.uid, targetUser: userData.userInfo })}
              style={styles.chatButton}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme?.primary || "#f37100"} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
          {(
            userData.userInfo?.profileImage
            || userData.userInfo?.photoURL
            || userData.userInfo?.avatar
          ) ? (
            <Avatar.Image
              source={{ uri: userData.userInfo?.profileImage || userData.userInfo?.photoURL || userData.userInfo?.avatar }}
              size={120}
              style={[styles.avatar, { borderColor: theme?.primary }]}
            />
          ) : (
            <Avatar.Text
              label={(userData.userInfo?.nome || userData.userInfo?.name || (userData.userInfo?.userInfo && userData.userInfo.userInfo.nome) || 'U').charAt(0) || 'U'}
              size={120}
              style={[styles.avatar, { borderColor: theme?.primary }]}
            />
          )}

          <Text style={[styles.name, { color: theme?.textPrimary }]}>
            {(
              userData.userInfo?.nome
              || userData.userInfo?.name
              || userData.userInfo?.userInfo?.nome
              || userData.userInfo?.displayName
            ) || t('profile.unknownUser')}
          </Text>

          {(
            userData.userInfo?.desc
            || userData.userInfo?.description
            || userData.userInfo?.bio
          ) ? (
            <Text style={[styles.description, { color: theme?.textSecondary }]}>
              {userData.userInfo?.desc || userData.userInfo?.description || userData.userInfo?.bio}
            </Text>
          ) : null}

          {userData.isOrganizer && (
            <View style={[styles.organizerBadge, { backgroundColor: theme?.primary }]}>
              <Text style={[styles.organizerText, { color: theme?.textInverted }]}>{t('profile.organizer')}</Text>
            </View>
          )}
        </View>

        {/* Posts Section - Only for organizers */}
        {userData.isOrganizer && (
          <View style={styles.postsSection}>
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('profile.posts')}</Text>
            {posts.length > 0 ? (
              posts.map(renderPost)
            ) : (
              <Text style={[styles.emptyText, { color: theme?.textTertiary }]}>{t('profile.noPosts')}</Text>
            )}
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chatButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatar: {
    backgroundColor: '#191919',
    borderWidth: 2,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  organizerBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  organizerText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  postsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  postCard: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  postContent: {
    flex: 1,
    marginLeft: 12,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});
