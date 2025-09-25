import React, { useState, useLayoutEffect, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../../services/AuthContext';
import { db } from '../../../services/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot, collection, query, where, getDocs } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import GerenciarViagem from '../../modal/GerenciarViagem';

// Tela de Minhas Viagens (posts salvos e favoritados)
export default function MinhasViagens({ navigation, route }) {
  const { userData } = useAuth();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  
  // Estados para posts criados por mim e viagens que participo
  const [myPosts, setMyPosts] = useState([]);
  const [participatingPosts, setParticipatingPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('mine'); // 'mine' | 'participating'
  const [loading, setLoading] = useState(true);
  
  // Estados para o modal de gerenciamento
  const [managementModalVisible, setManagementModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Função para buscar viagens que o usuário participa
  const fetchParticipatingPosts = async () => {
    if (!userData?.uid) return;
    
    try {
      const userRef = doc(db, 'user', userData.uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        // Busca pelo campo joinedEvents que é usado quando o usuário participa de uma viagem
        const joinedEventIds = userData.joinedEvents || [];
        
        if (joinedEventIds.length > 0) {
          // Busca as viagens que o usuário participa
          const postsQuery = query(collection(db, 'events'), where('__name__', 'in', joinedEventIds));
          const postsSnapshot = await getDocs(postsQuery);
          const posts = postsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            isParticipating: true
          }));
          setParticipatingPosts(posts);
        } else {
          setParticipatingPosts([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar viagens participadas:', error);
    }
  };

  // Função para buscar posts criados pelo usuário logado
  const fetchMyPosts = async () => {
    if (!userData?.uid) return;
    try {
      const uid = userData.uid.trim();
      const postsMap = new Map();

      // Tente múltiplos campos conhecidos para o autor
      const authorFields = ['uid', 'creatorId', 'userUID', 'userId', 'ownerId'];
      for (const field of authorFields) {
        try {
          const q = query(collection(db, 'events'), where(field, '==', uid));
          const snap = await getDocs(q);
          snap.forEach(d => postsMap.set(d.id, { id: d.id, ...d.data() }));
        } catch (e) {
          // ignore field errors
        }
      }

      // Se nada foi encontrado (ou para cobrir campos aninhados), faça um fallback lendo e filtrando
      if (postsMap.size === 0) {
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        eventsSnapshot.docs.forEach(docSnap => {
          const ev = { id: docSnap.id, ...docSnap.data() };
          const candidates = [
            ev?.creator?.uid,
            ev?.creator?.id,
            ev?.user?.uid,
            ev?.user?.id,
          ].filter(Boolean);
          if (candidates.some(v => (typeof v === 'string' ? v.trim() : String(v)) === uid)) {
            postsMap.set(ev.id, ev);
          }
        });
      }

      setMyPosts(Array.from(postsMap.values()));
    } catch (error) {
      console.error('Erro ao buscar posts do usuário:', error);
    }
  };

  // Carrega dados quando a tela ganha foco
  useFocusEffect(
    React.useCallback(() => {
      if (userData?.uid) {
        setLoading(true);
        Promise.all([fetchMyPosts(), fetchParticipatingPosts()])
          .finally(() => setLoading(false));
      }
    }, [userData?.uid])
  );

  // Remove header default e configura custom header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // Função para sair de uma viagem que o usuário participa
  const leaveTrip = async (postId) => {
    if (!userData?.uid) return;
    
    try {
      const userRef = doc(db, 'user', userData.uid);
      await updateDoc(userRef, {
        joinedEvents: arrayRemove(postId)
      });
      
      // Atualiza o estado local
      setParticipatingPosts(prev => prev.filter(post => post.id !== postId));
      Alert.alert('Sucesso', 'Você saiu da viagem!');
    } catch (error) {
      console.error('Erro ao sair da viagem:', error);
      Alert.alert('Erro', 'Não foi possível sair da viagem.');
    }
  };

  // Função para abrir modal de gerenciamento
  const openManagementModal = (post) => {
    setSelectedPost(post);
    setManagementModalVisible(true);
  };

  // Função para renderizar cada item no FlatList
  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}
      onPress={() => activeTab === 'mine' ? openManagementModal(item) : null}
      disabled={activeTab !== 'mine'}
    >
      {/* Imagem de capa da viagem */}
      <Image 
        source={{ uri: item.images?.[0] || 'https://via.placeholder.com/60' }} 
        style={styles.cardImage} 
      />
      {/* Conteúdo: título, tipo e rota */}
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, { color: theme?.textPrimary }]}>{item.title || 'Sem título'}</Text>
        <Text style={[styles.cardSubtitle, { color: theme?.textSecondary }]}>
          {item.type === 1 ? 'Viagem' : item.type === 2 ? 'Excursão' : item.type === 3 ? 'Show' : 'Evento'}
        </Text>
        <Text style={[styles.cardRoute, { color: theme?.textTertiary }]}>
          {item.route?.display_start} → {item.route?.display_end}
        </Text>
        {/* Mostrar vagas disponíveis na aba "Criadas por mim" */}
        {activeTab === 'mine' && (
          <Text style={[styles.cardSlots, { color: theme?.primary }]}>
            {item.numSlots || 0} vagas disponíveis
          </Text>
        )}
      </View>
      {/* Ícone para gerenciar (aba mine) ou sair da viagem (aba participating) */}
      {activeTab === 'mine' && (
        <View style={styles.cardIcon}>
          <Ionicons 
            name="settings-outline" 
            size={24} 
            color={theme?.textTertiary} 
          />
        </View>
      )}
      {activeTab === 'participating' && (
        <TouchableOpacity 
          onPress={() => leaveTrip(item.id)} 
          style={styles.cardIcon}
        >
          <Ionicons 
            name="exit-outline" 
            size={24} 
            color="red" 
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const currentData = activeTab === 'mine' ? myPosts : participatingPosts;

  return (
    <View style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Header com botão de voltar */}
      <View style={[styles.header, { backgroundColor: theme?.backgroundSecondary, borderBottomColor: theme?.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme?.textPrimary} />
          <Text style={[styles.backText, { color: theme?.textPrimary }]}>Minhas Viagens</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs para alternar entre criadas por mim e participando */}
      <View style={[styles.tabContainer, { backgroundColor: theme?.backgroundSecondary, borderBottomColor: theme?.border }]}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'mine' && styles.activeTab, { borderBottomColor: theme?.primary }]}
          onPress={() => setActiveTab('mine')}
        >
          <Ionicons name="create-outline" size={20} color={activeTab === 'mine' ? theme?.primary : theme?.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'mine' ? theme?.primary : theme?.textSecondary }]}>
            Criadas por mim ({myPosts.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'participating' && styles.activeTab, { borderBottomColor: theme?.primary }]}
          onPress={() => setActiveTab('participating')}
        >
          <Ionicons name="people-outline" size={20} color={activeTab === 'participating' ? theme?.primary : theme?.textSecondary} />
          <Text style={[styles.tabText, { color: activeTab === 'participating' ? theme?.primary : theme?.textSecondary }]}>
            Participando ({participatingPosts.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Lista de posts */}
      {loading ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: theme?.textSecondary }]}>Carregando...</Text>
        </View>
      ) : currentData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons 
            name={activeTab === 'mine' ? 'create-outline' : 'people-outline'} 
            size={64} 
            color={theme?.textTertiary} 
          />
          <Text style={[styles.emptyText, { color: theme?.textSecondary }]}>
            {activeTab === 'mine' ? 'Nenhuma viagem criada.' : 'Nenhuma viagem participada.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Modal de Gerenciamento de Viagem */}
      <GerenciarViagem
        modalVisible={managementModalVisible}
        setModalVisible={setManagementModalVisible}
        selectedPost={selectedPost}
      />
    </View>
  );
}

// Estilos da tela de Minhas Viagens
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
  },
  backText: { 
    fontSize: 18, 
    fontWeight: 'bold',
    marginLeft: 8 
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  listContent: { padding: 16 },
  card: {
    flexDirection: 'row',         
    alignItems: 'center',
    borderRadius: 12,
    elevation: 2,                
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.2,
    shadowRadius: 2,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
  },
  cardImage: { 
    width: 60, 
    height: 60, 
    borderRadius: 8,
    backgroundColor: '#f0f0f0'
  },
  cardContent: { 
    flex: 1, 
    marginLeft: 12 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold',
    marginBottom: 4
  },
  cardSubtitle: { 
    fontSize: 14,
    marginBottom: 2
  },
  cardRoute: { 
    fontSize: 12,
    fontStyle: 'italic'
  },
  cardSlots: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4
  },
  cardIcon: { 
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)'
  },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyText: { 
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center'
  },
});
