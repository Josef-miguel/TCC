// src/telas/Avaliacoes/index.js
import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db, auth } from '../../../services/firebase';
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

export default function Avaliacoes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId, userId, viewType } = route.params || {}; // eventId, userId ou viewType
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [userAvaliacoes, setUserAvaliacoes] = useState([]);
  const [tripAvaliacoes, setTripAvaliacoes] = useState([]);
  const [activeTab, setActiveTab] = useState('received'); // 'received' ou 'given'

  // Função para buscar avaliações recebidas pelo usuário
  const fetchUserReceivedReviews = async (userId) => {
    try {
      const userRef = doc(db, 'user', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const receivedReviews = userData.receivedReviews || [];
        setUserAvaliacoes(receivedReviews);
      }
    } catch (error) {
      console.error('Erro ao buscar avaliações recebidas:', error);
    }
  };

  // Função para buscar avaliações das viagens criadas pelo usuário
  const fetchUserTripReviews = async (userId) => {
    try {
      // Buscar todos os eventos criados pelo usuário
      const eventsQuery = query(
        collection(db, 'events'),
        where('uid', '==', userId)
      );
      
      const eventsSnapshot = await getDocs(eventsQuery);
      const allTripReviews = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventId = eventDoc.id;
        const eventData = eventDoc.data();
        
        // Buscar avaliações deste evento
        const reviewsQuery = query(
          collection(db, 'events', eventId, 'avaliacoes'),
          orderBy('createdAt', 'desc')
        );
        
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const eventReviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          eventTitle: eventData.title,
          eventId: eventId
        }));
        
        allTripReviews.push(...eventReviews);
      }

      setTripAvaliacoes(allTripReviews);
    } catch (error) {
      console.error('Erro ao buscar avaliações das viagens:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      if (eventId) {
        // Modo original: avaliações de um evento específico
        const q = query(
          collection(db, "events", eventId, "avaliacoes"),
          orderBy("createdAt", "desc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
          const arr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAvaliacoes(arr);
          setLoading(false);
        }, (error) => {
          console.error("Erro ao buscar avaliações:", error);
          setLoading(false);
        });

        return () => unsub();
      } else if (userId) {
        // Modo usuário: avaliações recebidas e das viagens criadas
        await Promise.all([
          fetchUserReceivedReviews(userId),
          fetchUserTripReviews(userId)
        ]);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    loadData();
  }, [eventId, userId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme?.background }]}>
        <ActivityIndicator size="large" color={theme?.primary} />
      </View>
    );
  }

  // Determinar qual título mostrar
  const getTitle = () => {
    if (eventId) return t("reviews.title");
    if (userId) return "Minhas Avaliações";
    return t("reviews.title");
  };

  // Determinar qual navegação usar
  const handleBackPress = () => {
    if (eventId) {
      navigation.navigate('Home', { eventId });
    } else {
      navigation.goBack();
    }
  };

  // Renderizar avaliação individual
  const renderReview = (item, isTripReview = false) => (
    <View style={[styles.card, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}>
      {isTripReview && item.eventTitle && (
        <View style={styles.eventInfo}>
          <Ionicons name="airplane" size={16} color={theme?.primary} />
          <Text style={[styles.eventTitle, { color: theme?.primary }]}>{item.eventTitle}</Text>
        </View>
      )}
      <Text style={[styles.userName, { color: theme?.textPrimary }]}>{item.username || t('reviews.user')}</Text>
      <Text style={[styles.nota, { color: theme?.primary }]}>{t('reviews.rating')}: {item.nota}/5</Text>
      {item.comment_text ? (
        <Text style={[styles.comentario, { color: theme?.textSecondary }]}>
          {item.comment_text}
        </Text>
      ) : null}
      <Text style={[styles.dateText, { color: theme?.textTertiary }]}>
        {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : (item.createdAt || "")}
      </Text>
    </View>
  );

  // Renderizar conteúdo baseado no tipo
  const renderContent = () => {
    if (eventId) {
      // Modo original: avaliações de um evento específico
      if (avaliacoes.length === 0) {
        return (
          <View style={styles.center}>
            <Icon name="emoticon-sad-outline" size={60} color={theme?.textSecondary} />
            <Text style={{ color: theme?.textSecondary, marginTop: 0 }}>
              {t('reviews.noReviews')}
            </Text>
          </View>
        );
      }

      return (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={avaliacoes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => renderReview(item)}
        />
      );
    } else if (userId) {
      // Modo usuário: abas para avaliações recebidas e das viagens
      return (
        <View style={{ flex: 1 }}>
          {/* Abas */}
          <View style={[styles.tabContainer, { backgroundColor: theme?.background }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'received' && styles.activeTab]}
              onPress={() => setActiveTab('received')}
            >
              <Text style={[
                styles.tabText,
                { color: theme?.textSecondary },
                activeTab === 'received' && [styles.activeTabText, { color: theme?.primary }]
              ]}>
                Recebidas ({userAvaliacoes.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.tab, activeTab === 'trips' && styles.activeTab]}
              onPress={() => setActiveTab('trips')}
            >
              <Text style={[
                styles.tabText,
                { color: theme?.textSecondary },
                activeTab === 'trips' && [styles.activeTabText, { color: theme?.primary }]
              ]}>
                Minhas Viagens ({tripAvaliacoes.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conteúdo das abas */}
          <ScrollView contentContainerStyle={{ padding: 16 }}>
            {activeTab === 'received' ? (
              userAvaliacoes.length === 0 ? (
                <View style={styles.center}>
                  <Icon name="emoticon-sad-outline" size={60} color={theme?.textSecondary} />
                  <Text style={{ color: theme?.textSecondary, marginTop: 0 }}>
                    Nenhuma avaliação recebida ainda
                  </Text>
                </View>
              ) : (
                userAvaliacoes.map((item, index) => (
                  <View key={index}>
                    {renderReview(item)}
                  </View>
                ))
              )
            ) : (
              tripAvaliacoes.length === 0 ? (
                <View style={styles.center}>
                  <Icon name="emoticon-sad-outline" size={60} color={theme?.textSecondary} />
                  <Text style={{ color: theme?.textSecondary, marginTop: 0 }}>
                    Nenhuma avaliação nas suas viagens ainda
                  </Text>
                </View>
              ) : (
                tripAvaliacoes.map((item) => (
                  <View key={item.id}>
                    {renderReview(item, true)}
                  </View>
                ))
              )
            )}
          </ScrollView>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 0 }]}>
        <TouchableOpacity onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={32} color={theme?.primary || "#f37100"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme?.primary }]}>{getTitle()}</Text>
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  userName: { fontWeight: 'bold', marginBottom: 6 },
  nota: { fontWeight: '600', marginBottom: 6 },
  comentario: { fontStyle: 'italic', marginBottom: 6 },
  dateText: { fontSize: 12, color: '#999' },
  
  // Estilos para abas
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#f37100',
  },
  
  // Estilos para informações do evento
  eventInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});
