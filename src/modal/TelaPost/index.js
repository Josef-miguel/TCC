import React, { useState, useEffect, useContext } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  StyleSheet,
  FlatList,
  Dimensions,
  Alert,
  Animated,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import SimpleRouteMap from "../../components/SimpleRouteMap";
import { ThemeContext } from "../../context/ThemeContext";
import { db } from "../../../services/firebase";
import { doc, updateDoc, onSnapshot, arrayUnion, collection, query, where, getDocs, addDoc, serverTimestamp, increment } from "firebase/firestore";
import ReportarProblema from "../ReportarProblema";
import { auth } from "../../../services/firebase";
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get("window");

const PostScreen = ({
  modalVisible,
  setModalVisible,
  selectedPost,
  setSelectedPost,
}) => {
  const navigation = useNavigation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { t } = useTranslation();

  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [comments, setComments] = useState([]);
  const [whoTravels, setWhoTravels] = useState("Sou eu");
  const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoomVisible, setImageZoomVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [reportarProblemaVisible, setReportarProblemaVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [participants, setParticipants] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);
  const [activeTab, setActiveTab] = useState("info");

  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  // Função para converter Firebase Timestamp para string de data
  const formatFirebaseTimestamp = (timestamp) => {
    if (!timestamp) return 'Data não disponível';
    
    try {
      // Se for um objeto Timestamp do Firebase
      if (timestamp.seconds && timestamp.nanoseconds !== undefined) {
        const date = new Date(timestamp.seconds * 1000);
        return date.toLocaleDateString('pt-BR');
      }
      
      // Se for uma função toDate (Timestamp do Firebase)
      if (typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString('pt-BR');
      }
      
      // Se já for uma string ou Date
      return new Date(timestamp).toLocaleDateString('pt-BR');
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  // Função para garantir que todos os valores sejam strings antes da renderização
  const safeRender = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') {
      // Se for um objeto Timestamp, formata
      if (value.seconds !== undefined || value.toDate) {
        return formatFirebaseTimestamp(value);
      }
      // Para outros objetos, converte para string JSON ou retorna string vazia
      try {
        return JSON.stringify(value);
      } catch {
        return '';
      }
    }
    return String(value);
  };

  const fetchParticipants = async () => {
    if (!selectedPost?.id) return;
    
    try {
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('joinedEvents', 'array-contains', selectedPost.id));
      const querySnapshot = await getDocs(q);
      
      const participantsList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        participantsList.push({
          id: doc.id,
          nome: userData.nome || userData.userInfo?.nome || 'Usuário',
        });
      });
      
      setParticipants(participantsList);
      const totalSlots = selectedPost?.numSlots || 0;
      const available = Math.max(0, totalSlots - participantsList.length);
      setAvailableSlots(available);
      
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
    }
  };

  useEffect(() => {
    if (modalVisible && selectedPost) {
      fetchParticipants();
    }
  }, [modalVisible, selectedPost]);

  const handleOpenPrivateChat = async () => {
    try {
      let targetUserId = selectedPost?.uid || selectedPost?.creator?.id || null;

      if (!auth.currentUser) {
        Alert.alert('Atenção', 'Faça login para conversar com o organizador.');
        return;
      }

      if (!targetUserId) {
        Alert.alert('Chat indisponível', 'Organizador não encontrado.');
        return;
      }

      const myUid = auth.currentUser.uid;
      const chatId = [myUid, targetUserId].sort().join('_');
      navigation.navigate('Chat', { chatId, otherUid: targetUserId });
      setModalVisible(false);
    } catch (e) {
      console.error('Erro ao abrir chat:', e);
    }
  };

  const handleParticipar = async () => {
    if (!auth.currentUser || !selectedPost?.id) {
      Alert.alert('Erro', 'Usuário não autenticado ou evento sem ID');
      return;
    }

    try {
      const userRef = doc(db, "user", auth.currentUser.uid);
      await updateDoc(userRef, {
        joinedEvents: arrayUnion(selectedPost.id),
      });

      await fetchParticipants();
      setParticipationModalVisible(false);
      setPaymentModalVisible(true);
    } catch (error) {
      console.error("Erro ao salvar participação:", error);
      Alert.alert('Erro', 'Não foi possível realizar a inscrição');
    }
  };

  const handleSendComment = async () => {
    if (newText.trim() === "") return;

    const postId = selectedPost?.id;
    if (!postId) return;

    const user = auth.currentUser;
    const commentObj = {
      user_id: user?.uid,
      username: user?.displayName || user?.email || "Usuário",
      comment_text: newText.trim(),
      nota: starRating || 0,
      createdAt: serverTimestamp()
    };

    try {
      const colRef = collection(db, "events", postId, "avaliacoes");
      await addDoc(colRef, commentObj);

      const eventRef = doc(db, "events", postId);
      await updateDoc(eventRef, {
        ratingCount: increment(1),
        ratingSum: increment(commentObj.nota),
        commentCount: increment(1)
      });

      setNewText("");
      setStarRating(0);
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
    }
  };

  useEffect(() => {
    if (!selectedPost?.id) return;

    const unsub = onSnapshot(
      collection(db, "events", selectedPost.id, "avaliacoes"),
      (querySnapshot) => {
        const commentsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          commentsData.push({ 
            id: doc.id, 
            ...data,
            // Garante que temos valores seguros para renderização
            username: safeRender(data.username),
            comment_text: safeRender(data.comment_text),
            nota: Number(data.nota) || 0,
            // Mantém o timestamp original para formatação
            createdAt: data.createdAt
          });
        });
        
        // Ordena por data (mais recentes primeiro)
        commentsData.sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        });
        
        setComments(commentsData);
      },
      (error) => {
        console.error("Erro ao buscar comentários:", error);
      }
    );

    return () => unsub();
  }, [selectedPost]);

  const handleCloseModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setCurrentImageIndex(0);
      setStarRating(0);
      setNewText("");
      setActiveTab("info");
    });
  };

  if (!selectedPost || !modalVisible) return null;

  const renderHeader = () => (
    <View style={[styles.header, { backgroundColor: theme?.background }]}>
      <TouchableOpacity onPress={handleCloseModal} style={styles.backButton}>
        <Ionicons name="chevron-down" size={28} color={theme?.textPrimary} />
      </TouchableOpacity>
      
      <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
        Detalhes do Evento
      </Text>
      
      <TouchableOpacity 
        onPress={() => setReportarProblemaVisible(true)}
        style={styles.reportButton}
      >
        <Ionicons name="flag-outline" size={22} color={theme?.textTertiary} />
      </TouchableOpacity>
    </View>
  );

  const renderImageCarousel = () => (
    <View style={styles.carouselContainer}>
      <FlatList
        data={selectedPost.images || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentImageIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setZoomedImage(item);
              setImageZoomVisible(true);
            }}
            activeOpacity={0.9}
          >
            <Image source={{ uri: item }} style={styles.carouselImage} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={() => (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={64} color={theme?.textTertiary} />
            <Text style={[styles.noImageText, { color: theme?.textTertiary }]}>
              {t('post.noImages')}
            </Text>
          </View>
        )}
      />
      
      {selectedPost.images && selectedPost.images.length > 1 && (
        <View style={styles.pagination}>
          {selectedPost.images.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor: index === currentImageIndex 
                    ? theme?.primary 
                    : theme?.textTertiary + '40'
                }
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );

  const renderEventInfo = () => (
    <View style={styles.infoSection}>
      <Text style={[styles.eventTitle, { color: theme?.textPrimary }]}>
        {safeRender(selectedPost.title) || t('home.noTitle')}
      </Text>
      
      <View style={styles.priceContainer}>
        <Text style={[styles.price, { color: theme?.primary }]}>
          R$ {safeRender(selectedPost.price) || "0"}
        </Text>
        <Text style={[styles.priceLabel, { color: theme?.textSecondary }]}>
          por pessoa
        </Text>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="calendar-outline" size={20} color={theme?.primary} />
          <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
            {safeRender(selectedPost.exit_date) || "Data não definida"}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={20} color={theme?.primary} />
          <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
            {safeRender(selectedPost.location) || "Local não definido"}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="people-outline" size={20} color={theme?.primary} />
          <Text style={[styles.detailText, { color: availableSlots > 0 ? theme?.primary : '#ff4444' }]}>
            {safeRender(availableSlots)} vagas restantes
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={20} color={theme?.primary} />
          <Text style={[styles.detailText, { color: theme?.textSecondary }]}>
            {selectedPost.type === 1 ? "Viagem" : 
             selectedPost.type === 2 ? "Excursão" : 
             selectedPost.type === 3 ? "Show" : "Evento"}
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: theme?.textSecondary }]}>
        {safeRender(selectedPost.desc) || t('home.noDescription')}
      </Text>
    </View>
  );

  const renderTabs = () => (
    <View style={[styles.tabContainer, { backgroundColor: theme?.backgroundSecondary }]}>
      {["info", "route", "reviews"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && [styles.activeTab, { backgroundColor: theme?.primary }]
          ]}
          onPress={() => setActiveTab(tab)}
        >
          <Text style={[
            styles.tabText,
            { color: theme?.textSecondary },
            activeTab === tab && [styles.activeTabText, { color: theme?.textInverted }]
          ]}>
            {tab === "info" ? "Informações" : 
             tab === "route" ? "Rota" : "Avaliações"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "route":
        return (
          <View style={styles.routeSection}>
            {selectedPost.route?.start ? (
              <>
                <View style={styles.routeInfo}>
                  <View style={styles.routeStep}>
                    <View style={[styles.stepIcon, { backgroundColor: theme?.primary }]}>
                      <Ionicons name="play" size={16} color="#fff" />
                    </View>
                    <Text style={[styles.routeText, { color: theme?.textPrimary }]}>
                      {safeRender(selectedPost.route.display_start) || "Ponto de partida"}
                    </Text>
                  </View>
                  
                  <View style={styles.routeStep}>
                    <View style={[styles.stepIcon, { backgroundColor: theme?.primary }]}>
                      <Ionicons name="flag" size={16} color="#fff" />
                    </View>
                    <Text style={[styles.routeText, { color: theme?.textPrimary }]}>
                      {safeRender(selectedPost.route.display_end) || "Destino"}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.mapContainer}>
                  <SimpleRouteMap
                    startCoordinate={selectedPost.route.start}
                    endCoordinate={selectedPost.route.end}
                    height={200}
                  />
                </View>
              </>
            ) : (
              <Text style={[styles.noRouteText, { color: theme?.textTertiary }]}>
                Rota não disponível
              </Text>
            )}
          </View>
        );

      case "reviews":
        return (
          <View style={styles.reviewsSection}>
            <View style={styles.ratingContainer}>
              <Text style={[styles.ratingTitle, { color: theme?.textPrimary }]}>
                Sua Avaliação
              </Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setStarRating(star)}
                    style={styles.starButton}
                  >
                    <Ionicons
                      name={star <= starRating ? "star" : "star-outline"}
                      size={28}
                      color={theme?.primary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.commentInputContainer}>
              <TextInput
                style={[styles.commentInput, { 
                  backgroundColor: theme?.backgroundSecondary,
                  color: theme?.textPrimary,
                  borderColor: theme?.border 
                }]}
                placeholder="Deixe seu comentário..."
                placeholderTextColor={theme?.textTertiary}
                value={newText}
                onChangeText={setNewText}
                multiline
              />
              <TouchableOpacity 
                onPress={handleSendComment}
                style={[styles.sendButton, { backgroundColor: theme?.primary }]}
                disabled={!newText.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.commentsList}>
              {comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <Text style={[styles.commentAuthor, { color: theme?.textPrimary }]}>
                        {safeRender(comment.username)}
                      </Text>
                      <Text style={[styles.commentDate, { color: theme?.textTertiary }]}>
                        {formatFirebaseTimestamp(comment.createdAt)}
                      </Text>
                    </View>
                    {comment.nota > 0 && (
                      <View style={styles.ratingStars}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Ionicons
                            key={star}
                            name={star <= comment.nota ? "star" : "star-outline"}
                            size={16}
                            color={theme?.primary}
                          />
                        ))}
                      </View>
                    )}
                    <Text style={[styles.commentText, { color: theme?.textSecondary }]}>
                      {safeRender(comment.comment_text)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={[styles.noCommentsText, { color: theme?.textTertiary }]}>
                  Nenhum comentário ainda. Seja o primeiro a avaliar!
                </Text>
              )}
            </ScrollView>
          </View>
        );

      default:
        return renderEventInfo();
    }
  };

  const renderActionButtons = () => (
    <View style={[styles.actionButtons, { backgroundColor: theme?.background }]}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          styles.primaryButton,
          { 
            backgroundColor: availableSlots > 0 ? theme?.primary : '#666',
            opacity: availableSlots > 0 ? 1 : 0.6
          }
        ]}
        onPress={() => availableSlots > 0 && setParticipationModalVisible(true)}
        disabled={availableSlots === 0}
      >
        <Ionicons 
          name="checkmark-circle" 
          size={22} 
          color="#fff" 
          style={styles.buttonIcon}
        />
        <Text style={styles.primaryButtonText}>
          {availableSlots > 0 ? "Participar do Evento" : "Vagas Esgotadas"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.secondaryButton, { borderColor: theme?.primary }]}
        onPress={handleOpenPrivateChat}
      >
        <Ionicons 
          name="chatbubble-ellipses" 
          size={20} 
          color={theme?.primary} 
          style={styles.buttonIcon}
        />
        <Text style={[styles.secondaryButtonText, { color: theme?.primary }]}>
          Falar com Organizador
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <View style={[styles.container, { backgroundColor: theme?.background }]}>
          {renderHeader()}
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {renderImageCarousel()}
            {renderTabs()}
            {renderTabContent()}
          </ScrollView>
          {renderActionButtons()}
        </View>
      </Modal>

      {/* Modal de Participação */}
      <Modal visible={participationModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.participationModal, { backgroundColor: theme?.background }]}>
            <Text style={[styles.modalTitle, { color: theme?.textPrimary }]}>
              Confirmar Participação
            </Text>
            
            <Text style={[styles.modalSubtitle, { color: theme?.textSecondary }]}>
              Preencha as informações para participar deste evento
            </Text>

            <View style={styles.participationForm}>
              <Text style={[styles.formLabel, { color: theme?.textPrimary }]}>Quem vai viajar?</Text>
              {['Sou eu', 'Outra pessoa'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => setWhoTravels(option)}
                >
                  <View style={[styles.radio, { borderColor: theme?.primary }]}>
                    {whoTravels === option && (
                      <View style={[styles.radioSelected, { backgroundColor: theme?.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: theme?.textPrimary }]}>{option}</Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.formLabel, { color: theme?.textPrimary }]}>Categoria</Text>
              {[
                'Criança de colo (com acompanhante)',
                'Criança 6-14 anos (com acompanhante)',
                'Jovem 15-17 anos (com acompanhante)',
                'Adulto (18-59 anos)',
                'Idoso (60+ anos)'
              ].map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.radioOption}
                  onPress={() => setWhoGoes(option)}
                >
                  <View style={[styles.radio, { borderColor: theme?.primary }]}>
                    {whoGoes === option && (
                      <View style={[styles.radioSelected, { backgroundColor: theme?.primary }]} />
                    )}
                  </View>
                  <Text style={[styles.radioLabel, { color: theme?.textPrimary }]}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: theme?.border }]}
                onPress={() => setParticipationModalVisible(false)}
              >
                <Text style={[styles.cancelButtonText, { color: theme?.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, { backgroundColor: theme?.primary }]}
                onPress={handleParticipar}
              >
                <Text style={styles.confirmButtonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Zoom da Imagem */}
      <Modal visible={imageZoomVisible} transparent animationType="fade">
        <View style={styles.zoomOverlay}>
          <TouchableOpacity 
            style={styles.zoomCloseButton}
            onPress={() => setImageZoomVisible(false)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: zoomedImage }} style={styles.zoomedImage} resizeMode="contain" />
        </View>
      </Modal>

      <ReportarProblema 
        visible={reportarProblemaVisible} 
        setVisible={setReportarProblemaVisible} 
      />
    </Animated.View>
  );
};

// Os estilos permanecem os mesmos do código anterior...
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'ios' ? 60 : StatusBar.currentHeight + 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  reportButton: {
    padding: 8,
  },
  carouselContainer: {
    height: 300,
  },
  carouselImage: {
    width: width,
    height: 300,
  },
  noImageContainer: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 10,
    fontSize: 16,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  infoSection: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 5,
  },
  priceLabel: {
    fontSize: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 25,
    marginHorizontal: 5,
  },
  activeTab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '600',
  },
  routeSection: {
    padding: 20,
  },
  routeInfo: {
    marginBottom: 20,
  },
  routeStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  stepIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  routeText: {
    fontSize: 16,
    flex: 1,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  noRouteText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  reviewsSection: {
    padding: 20,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starButton: {
    padding: 5,
  },
  commentInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentsList: {
    maxHeight: 200,
  },
  commentItem: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentDate: {
    fontSize: 12,
  },
  ratingStars: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noCommentsText: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 20,
    fontStyle: 'italic',
  },
  actionButtons: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 10,
  },
  primaryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    borderWidth: 2,
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  participationModal: {
    width: '90%',
    borderRadius: 20,
    padding: 25,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },
  participationForm: {
    marginBottom: 25,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    marginTop: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  radioLabel: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    marginHorizontal: 5,
  },
  cancelButton: {
    borderWidth: 2,
  },
  confirmButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 1000,
    padding: 10,
  },
  zoomedImage: {
    width: width * 0.9,
    height: height * 0.7,
  },
  scrollView: {
    flex: 1,
  },
});

export default PostScreen;