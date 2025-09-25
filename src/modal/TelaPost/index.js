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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import LeafletMap from "../../components/LeafletMap";
import SimpleRouteMap from "../../components/SimpleRouteMap";
import axios from 'axios';
import { ThemeContext } from "../../context/ThemeContext";
import { db } from "../../../services/firebase";
import { doc, updateDoc, onSnapshot, arrayUnion, arrayRemove, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, increment } from "firebase/firestore";

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
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [comments, setComments] = useState(selectedPost?.comments || []);
  const [routeCoords, setRouteCoords] = useState((selectedPost?.route && selectedPost.route.coordinates) ? selectedPost.route.coordinates : []);
  const [whoTravels, setWhoTravels] = useState("Outra pessoa");
  const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoomVisible, setImageZoomVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [reportarProblemaVisible, setReportarProblemaVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cartão de Crédito");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [participants, setParticipants] = useState([]);
  const [availableSlots, setAvailableSlots] = useState(0);

  const handleStarPress = (rating) => {
    setStarRating(rating);
  };

  // Função para buscar participantes e calcular vagas disponíveis
  const fetchParticipants = async () => {
    if (!selectedPost?.id) return;
    
    try {
      // Buscar todos os usuários que têm este evento em joinedEvents
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('joinedEvents', 'array-contains', selectedPost.id));
      const querySnapshot = await getDocs(q);
      
      const participantsList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        participantsList.push({
          id: doc.id,
          nome: userData.nome || userData.userInfo?.nome || 'Usuário',
          email: userData.email || 'email@exemplo.com'
        });
      });
      
      setParticipants(participantsList);
      
      // Calcular vagas disponíveis
      const totalSlots = selectedPost?.numSlots || 0;
      const occupiedSlots = participantsList.length;
      const available = Math.max(0, totalSlots - occupiedSlots);
      setAvailableSlots(available);
      
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
    }
  };

  // Buscar participantes quando o modal abrir
  useEffect(() => {
    if (modalVisible && selectedPost) {
      fetchParticipants();
    }
  }, [modalVisible, selectedPost]);



// Abre chat privado com o organizador usando a coleção 'chats'
const handleOpenPrivateChat = async () => {
  try {
    // Resolve uid do organizador do post (mesma lógica de handleVisualizarPerfil)
    let targetUserId = selectedPost?.uid
      || selectedPost?.creator?.id
      || selectedPost?.creator?.uid
      || selectedPost?.userId
      || selectedPost?.user?.uid
      || selectedPost?.ownerId
      || null;

    if (targetUserId && typeof targetUserId !== 'string') {
      if (typeof targetUserId.uid === 'string') targetUserId = targetUserId.uid;
      else if (typeof targetUserId.id === 'string') targetUserId = targetUserId.id;
      else targetUserId = String(targetUserId);
    }
    if (typeof targetUserId === 'string') {
      targetUserId = targetUserId.trim();
      if (targetUserId === '') targetUserId = null;
    }

    // Requer usuário autenticado (não usar anônimo)
    if (!auth.currentUser) {
      Alert.alert('Atenção', 'Faça login para conversar com o organizador.');
      return;
    }
    const myUid = auth.currentUser?.uid || null;
    if (!myUid || !targetUserId) {
      console.warn('TelaPost: Chat privado indisponível. myUid=', myUid, 'targetUserId=', targetUserId);
      Alert.alert('Chat indisponível', 'Não foi possível iniciar a conversa.');
      return;
    }

    const makeChatId = (a, b) => [a, b].sort().join('_');
    const chatId = makeChatId(myUid, targetUserId);

    navigation.navigate('Chat', { chatId, otherUid: targetUserId });
  } catch (e) {
    // noop
  }
};


  
const handleParticipar = async () => {
  if (!auth.currentUser || !selectedPost?.id) {
    console.log("Usuário não autenticado ou evento sem ID");
    return;
  }

  try {
    console.log("Salvando participação para evento:", selectedPost.id);
    const userRef = doc(db, "user", auth.currentUser.uid);
    await updateDoc(userRef, {
      joinedEvents: arrayUnion(selectedPost.id),
    });

    console.log("Participação salva no Firebase!");
    
    // Recarregar participantes para atualizar vagas disponíveis
    await fetchParticipants();
    
    setParticipationModalVisible(false);
    setPaymentModalVisible(true);
  } catch (error) {
    console.error("Erro ao salvar participação:", error);
  }
};

  const handleSendComment = async () => {
  if (newText.trim() === "") return;

  const postId = selectedPost?.id;
  if (!postId) {
    alert("Post inválido.");
    return;
  }

  const user = auth.currentUser;
    const commentObj = {
      user_id: user?.uid || null,
      username: user?.displayName || user?.email || "Usuário",
      comment_text: newText.trim(),
      nota: starRating || 0,
      createdAt: serverTimestamp()
    };

    try {
      // 1) cria documento em events/{postId}/avaliacoes
      const colRef = collection(db, "events", postId, "avaliacoes");
      await addDoc(colRef, commentObj);

      // 2) opcionalmente atualizar agregados no doc do evento (contagem/soma)
      // (recomendo ter campos ratingCount e ratingSum no evento para cálculo rápido)
      const eventRef = doc(db, "events", postId);
      await updateDoc(eventRef, {
        ratingCount: increment(1),
        ratingSum: increment(commentObj.nota)
      });

      // 3) atualiza UI local imediatamente (opcional)
      setComments(prev => [
        ...prev,
        {
          ...commentObj,
          createdAt: new Date().toISOString() // mostrar instantaneamente (serverTimestamp é no servidor)
        }
      ]);
      setNewText("");
      setStarRating(0); // opcional: limpar estrelas
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      alert("Erro ao enviar avaliação: " + (error?.message || error));
    }
  };


  useEffect(() => {
    if (!selectedPost?.id) return;

    const unsub = onSnapshot(doc(db, "events", selectedPost.id), (docSnap) => {
      if (docSnap.exists()) {
        setComments(docSnap.data().comments || []);
      }
    });

    return () => unsub();
  }, [selectedPost]);


  useEffect(() => {
    if (!selectedPost?.id) return;

    // Escuta a subcoleção 'avaliacoes' em tempo real
    const unsub = onSnapshot(
      collection(db, "events", selectedPost.id, "avaliacoes"),
      (querySnapshot) => {
        const commentsData = [];
        querySnapshot.forEach((doc) => {
          commentsData.push({ id: doc.id, ...doc.data() });
        });
        setComments(commentsData);
      },
      (error) => {
        console.error("Erro ao buscar comentários:", error);
      }
    );

  return () => unsub();
}, [selectedPost]);

  // When selectedPost changes, ensure we have route coordinates derived from start/end
  useEffect(() => {
    if (selectedPost?.route?.start && selectedPost?.route?.end) {
      // If coordinates are already stored on the post, use them directly
      if (selectedPost.route.coordinates && selectedPost.route.coordinates.length) {
        setRouteCoords(selectedPost.route.coordinates);
      } else {
        // Use fallback to straight line instead of API call to avoid 404 errors
        setRouteCoords([selectedPost.route.start, selectedPost.route.end]);
      }
    } else {
      setRouteCoords([]);
    }
  }, [selectedPost]);


  // Verifica se o post está salvo quando carrega
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!auth.currentUser || !selectedPost?.id) return;
      
      try {
        const userRef = doc(db, "user", auth.currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const savedPosts = userData.savedPosts || [];
        }
      } catch (error) {
        console.error("Erro ao verificar se post está salvo:", error);
      }
    };

    checkIfSaved();
  }, [selectedPost?.id, auth.currentUser]);

  if (!selectedPost || !modalVisible) return null;

  // Centralized close handler to reset modal state when closing
  const handleCloseModal = () => {
    try {
      setModalVisible(false);
      // Reset transient states to ensure clean reopen
      // setSelectedPost(null);
      setCurrentImageIndex(0);
      setStarRating(0);
      setNewText("");
      setComments([]);
      setRouteCoords([]);
      setImageZoomVisible(false);
      setZoomedImage(null);
      setParticipationModalVisible(false);
      setChatModalVisible(false);
      setReportarProblemaVisible(false);
      setPaymentModalVisible(false);
    } catch (e) {
      // no-op fail safe
    }
  };
  

  return (
    <View style={{ flex: 1 }}>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={handleCloseModal}
        onDismiss={handleCloseModal}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme?.background }]}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>

            {/* Carrossel de imagens */}
            <View style={{ position: "relative" }}>
              <FlatList
                data={selectedPost.images || []}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                onMomentumScrollEnd={(event) => {
                  const index = Math.round(event.nativeEvent.contentOffset.x / width);
                  setCurrentImageIndex(index);
                }}
                getItemLayout={(data, index) => ({
                  length: width,
                  offset: width * index,
                  index,
                })}
                ref={(ref) => {
                  if (ref && currentImageIndex > 0) {
                    ref.scrollToIndex({ index: currentImageIndex, animated: true });
                  }
                }}
                renderItem={({ item, index }) => (
                  <View style={styles.imageContainer}>
                    <TouchableOpacity
                      onPress={() => {
                        setZoomedImage(item);
                        setImageZoomVisible(true);
                      }}
                      activeOpacity={0.9}
                    >
                      <Image 
                        source={{ uri: item }} 
                        style={styles.fullscreenImage} 
                        resizeMode="cover"
                        onError={() => console.log(`Erro ao carregar imagem ${index}`)}
                      />
                    </TouchableOpacity>
                    
                    {/* Overlay de informações da imagem */}
                    <View style={styles.imageOverlay}>
                      <Text style={styles.imageCounter}>
                        {index + 1} / {selectedPost.images?.length || 1}
                      </Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={() => (
                  <View style={[styles.imageContainer, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="image-outline" size={64} color="#ccc" />
                    <Text style={{ color: "#ccc", marginTop: 10, fontSize: 16 }}>
                      {t('post.noImages')}
                    </Text>
                  </View>
                )}
              />

              {/* Indicadores de página */}
              {selectedPost.images && selectedPost.images.length > 1 && (
                <View style={styles.paginationContainer}>
                  {selectedPost.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.paginationDot,
                        {
                          backgroundColor: index === currentImageIndex 
                            ? theme?.primary || "#f37100" 
                            : "rgba(255, 255, 255, 0.5)"
                        }
                      ]}
                    />
                  ))}
                </View>
              )}

              {/* Botões de navegação */}
              {selectedPost.images && selectedPost.images.length > 1 && (
                <>
                  <TouchableOpacity
                    style={[styles.navButton, styles.prevButton]}
                    onPress={() => {
                      if (currentImageIndex > 0) {
                        setCurrentImageIndex(currentImageIndex - 1);
                      }
                    }}
                    disabled={currentImageIndex === 0}
                  >
                    <Ionicons 
                      name="chevron-back" 
                      size={24} 
                      color={currentImageIndex === 0 ? "rgba(255,255,255,0.3)" : "#fff"} 
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.navButton, styles.nextButton]}
                    onPress={() => {
                      if (currentImageIndex < (selectedPost.images?.length || 1) - 1) {
                        setCurrentImageIndex(currentImageIndex + 1);
                      }
                    }}
                    disabled={currentImageIndex === (selectedPost.images?.length || 1) - 1}
                  >
                    <Ionicons 
                      name="chevron-forward" 
                      size={24} 
                      color={currentImageIndex === (selectedPost.images?.length || 1) - 1 ? "rgba(255,255,255,0.3)" : "#fff"} 
                    />
                  </TouchableOpacity>
                </>
              )}

              {/* Botão de voltar flutuante */}
              <TouchableOpacity
                style={styles.backButton}
                onPress={handleCloseModal}
              >
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </TouchableOpacity>

            </View>

            {/* Rota */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('post.tripRoute')}</Text>
            <View style={[styles.routeBox, { borderColor: theme?.border, backgroundColor: theme?.backgroundSecondary }]}>
              <Ionicons name="location-sharp" size={24} color={theme?.textPrimary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>{t('post.start')}: {selectedPost.route?.display_start}</Text>
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>{t('post.destination')}: {selectedPost.route?.display_end}</Text>
              </View>
            </View>

            <View style={[styles.routeBox, { borderColor: theme?.border, backgroundColor: theme?.backgroundSecondary }]}>
              {selectedPost.route?.start && (
                <View style={[styles.mapContainer, { borderColor: theme?.border }]}>
                  <SimpleRouteMap
                    startCoordinate={selectedPost.route.start}
                    endCoordinate={selectedPost.route.end}
                    height={200}
                    style={{ borderColor: theme?.border }}
                    onRouteCalculated={(route) => {
                      // Atualizar as coordenadas da rota se necessário
                      console.log('Rota simples calculada:', route);
                    }}
                  />
                </View>
              )}
            </View>

            {/* Informações */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('post.excursionInfo')}</Text>
            <View style={[styles.infoBox, { borderColor: theme?.border }]}>
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>{t('post.description')}: </Text>
              <Text style={[styles.commentText, { color: theme?.textSecondary }]}>{selectedPost?.desc}</Text>
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>{t('post.availableSlots')}: </Text>
              <Text style={[styles.commentText, { color: availableSlots > 0 ? theme?.primary : 'red' }]}>
                {availableSlots} de {selectedPost?.numSlots || 0} vagas
              </Text>
              {availableSlots === 0 && (
                <Text style={[styles.commentText, { color: 'red', fontWeight: 'bold' }]}>
                  ⚠️ {t('post.tripExhausted')}!
                </Text>
              )}
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>{t('post.tripType')}: </Text>
              <Text style={[styles.commentText, { color: theme?.textSecondary }]}>
                {(selectedPost?.type == 1) ? "Viagem" : (selectedPost?.type == 2) ? "Excursão" : (selectedPost?.type == 3) ? "Show" : "Sem tipo"}
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('Avaliacoes', { eventId: selectedPost.id })}>
              <Text style={{color: 'white'}}>{t('post.viewReviews')}</Text>
            </TouchableOpacity>
            {/* Avaliação */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('post.rating')}</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleStarPress(i)}
                  style={styles.starButton}
                >
                  <Ionicons
                    name={i <= starRating ? "star" : "star-outline"}
                    size={30}
                    color={theme?.primary || "#f37100"}
                  />
                </TouchableOpacity>
              ))}
              <Text style={[styles.starText, { color: theme?.textPrimary }]}>
                {starRating} de 5
              </Text>
            </View>

            {/* Comentários */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>{t('post.comments')}</Text>
            <View style={[styles.commentsBox, { borderColor: theme?.border }]}>
              {comments.length === 0 ? (
                <Text style={{ color: theme?.textSecondary }}>{t('post.noComments')}</Text>
              ) : (
                comments.map((c, idx) => (
                  <View key={idx} style={{ marginBottom: 8 }}>
                    <Text style={{ color: theme?.textPrimary, fontWeight: "bold" }}>
                      {c.username || t('post.anonymous')}
                    </Text>
                    <Text style={[styles.commentText, { color: theme?.textSecondary }]}>
                      "{c.comment_text}"
                    </Text>
                  </View>
                ))
              )}

              {/* Input de comentário */}
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={[
                    styles.commentInput,
                    { borderColor: theme?.primary, color: theme?.textPrimary },
                  ]}
                  placeholder={t('post.typeComment')}
                  placeholderTextColor={theme?.textTertiary || "#aaa"}
                  value={newText}
                  onChangeText={setNewText}
                />
                <TouchableOpacity onPress={handleSendComment}>
                  <Ionicons
                    name="send"
                    size={24}
                    color={theme?.primary || "#f37100"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botões de ação */}
            {/* <TouchableOpacity
              style={[styles.modalButton, styles.joinButton, { backgroundColor: theme?.primary }]}
              onPress={() => setParticipationModalVisible(true)}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>Participar da viagem</Text>
            </TouchableOpacity> */}
            <TouchableOpacity
      style={[
        styles.partButton, 
        { 
          backgroundColor: availableSlots > 0 ? theme?.primary : '#666',
          opacity: availableSlots > 0 ? 1 : 0.6
        }
      ]}
      onPress={() => availableSlots > 0 ? setParticipationModalVisible(true) : null}
      disabled={availableSlots === 0}
>
  <Text style={[styles.buttonText, { color: theme?.textInverted }]}>
    {availableSlots > 0 ? t('post.confirmParticipation') : t('post.tripExhausted')}
  </Text>
</TouchableOpacity>

            <TouchableOpacity
              style={[styles.chatButton, styles.modalButton]}
              onPress={handleOpenPrivateChat}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>{t('post.chatWithOrganizer')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

     
      </Modal>

      {/* Modal de Participação embutido */}
      <Modal visible={participationModalVisible} transparent animationType="slide">
        <View style={[styles.partContainer, { backgroundColor: theme?.overlay }]}>
          <View style={[styles.partContent, { backgroundColor: theme?.backgroundSecondary }]}>
            <Text style={[styles.partTitle, { color: theme?.textPrimary }]}>{t('post.whoTravels')}</Text>
            {['Sou eu', 'Outra pessoa'].map(opt => (
              <TouchableOpacity
                key={opt}
                style={styles.partOption}
                onPress={() => setWhoTravels(opt)}
              >
                <View style={[styles.radioOuter, { borderColor: theme?.primary }]}>
                  {whoTravels === opt && <View style={[styles.radioInner, { backgroundColor: theme?.primary }]} />}
                </View>
                <Text style={[styles.partOptionText, { color: theme?.textSecondary }]}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.partTitle, { marginTop: 20, color: theme?.textPrimary }]}>{t('post.whoGoes')}</Text>
            {[
              'Criança de colo (com acompanhante)',
              'Criança 6 de 14 anos (acompanhante)',
              'Jovem 15 a 17 anos (acompanhante)',
              'Idoso 60 anos ou mais'
            ].map(opt => (
              <TouchableOpacity
                key={opt}
                style={styles.partOption}
                onPress={() => setWhoGoes(opt)}
              >
                <View style={[styles.radioOuter, { borderColor: theme?.primary }]}>
                  {whoGoes === opt && <View style={[styles.radioInner, { backgroundColor: theme?.primary }]} />}
                </View>
                <Text style={[styles.partOptionText, { color: theme?.textSecondary }]}>{opt}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[
                styles.partButton, 
                { 
                  backgroundColor: availableSlots > 0 ? theme?.primary : '#666',
                  opacity: availableSlots > 0 ? 1 : 0.6
                }
              ]}
              onPress={availableSlots > 0 ? handleParticipar : null}
              disabled={availableSlots === 0}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>
                {availableSlots > 0 ? t('post.confirm') : t('post.noSlots')}
              </Text>
            </TouchableOpacity>
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
           
           <TouchableOpacity 
             style={styles.zoomImageContainer}
             onPress={() => setImageZoomVisible(false)}
             activeOpacity={1}
           >
             <Image 
               source={{ uri: zoomedImage }} 
               style={styles.zoomedImage} 
               resizeMode="contain"
             />
           </TouchableOpacity>
         </View>
       </Modal>

       <Modal visible={paymentModalVisible} transparent animationType="slide">
          <View style={[styles.paymentOverlay, { backgroundColor: theme?.overlay }]}>
            <View style={[styles.paymentContainer, { backgroundColor: theme?.backgroundSecondary }]}>
              <Text style={[styles.partTitle, { color: theme?.textPrimary, fontSize: 20 }]}>
                {t('post.simulatedPayment')}
              </Text>

              <Text style={[styles.label, { color: theme?.textSecondary, marginTop: 10 }]}>{t('post.method')}:</Text>
              {["Cartão de Crédito", "Pix", "Boleto"].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={styles.partOption}
                  onPress={() => setPaymentMethod(method)}
                >
                  <View style={[styles.radioOuter, { borderColor: theme?.primary }]}>
                    {paymentMethod === method && <View style={[styles.radioInner, { backgroundColor: theme?.primary }]} />}
                  </View>
                  <Text style={[styles.partOptionText, { color: theme?.textSecondary }]}>{method}</Text>
                </TouchableOpacity>
              ))}

              {paymentMethod === "Cartão de Crédito" && (
                <>
                  <TextInput
                    style={[styles.commentInput, { borderColor: theme?.primary, color: theme?.textPrimary }]}
                    placeholder={t('post.cardNumber')}
                    placeholderTextColor={theme?.textTertiary}
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                  />
                  <TextInput
                    style={[styles.commentInput, { borderColor: theme?.primary, color: theme?.textPrimary }]}
                    placeholder={t('post.cardName')}
                    placeholderTextColor={theme?.textTertiary}
                    value={cardName}
                    onChangeText={setCardName}
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <TextInput
                      style={[styles.commentInput, { borderColor: theme?.primary, color: theme?.textPrimary, flex: 1, marginRight: 5 }]}
                      placeholder="MM/AA"
                      placeholderTextColor={theme?.textTertiary}
                      value={expiry}
                      onChangeText={setExpiry}
                    />
                    <TextInput
                      style={[styles.commentInput, { borderColor: theme?.primary, color: theme?.textPrimary, flex: 1, marginLeft: 5 }]}
                      placeholder="CVV"
                      placeholderTextColor={theme?.textTertiary}
                      keyboardType="numeric"
                      value={cvv}
                      onChangeText={setCvv}
                    />
                  </View>
                </>
              )}

              <TouchableOpacity
                style={[styles.partButton, { backgroundColor: theme?.primary, marginTop: 20 }]}
                onPress={() => {
                  alert("Pagamento simulado realizado com sucesso!");
                  setPaymentModalVisible(false);
                }}
              >
                <Text style={[styles.buttonText, { color: theme?.textInverted }]}>{t('post.pay')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 10, alignSelf: "center" }}
                onPress={() => setPaymentModalVisible(false)}
              >
                <Text style={{ color: theme?.primary }}>{t('post.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

       {/* Modal de Reportar Problema */}
       <ReportarProblema 
         visible={reportarProblemaVisible} 
         setVisible={setReportarProblemaVisible} 
       />

     
     </View>
  );
};


  const styles = StyleSheet.create({
  modalContainer: { flex: 1 },
  modalScroll: { flex: 1 },
  modalInner: { padding: 16 },
  fullscreenImage: { width, height: height * 0.4 },
  imageContainer: {
    width: width,
    height: height * 0.4,
    position: "relative",
  },
  imageOverlay: {
    position: "absolute",
    top: 60,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  imageCounter: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  navButton: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -20 }],
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 12,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  prevButton: { left: 15 },
  nextButton: { right: 15 },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 50,
  },
  optionsButton: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 50,
  },
  dropdownMenu: {
    position: "absolute",
    top: 80,
    right: 20,
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  dropdownText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "500",
  },
  sectionTitle: { fontWeight: "bold", marginTop: 12, marginBottom: 6, fontSize: 16 },
  commentTitle: { fontWeight: "bold", fontSize: 16, paddingBottom: 4 },
  routeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    flexWrap: "wrap",
    width: "100%",
  },
  routeText: { fontSize: 14, marginBottom: 4, flexShrink: 1, flexWrap: "wrap" },
  infoBox: { padding: 10, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
  starContainer: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  starButton: { marginHorizontal: 4 },
  starText: { marginLeft: 8, fontSize: 16 },
  commentsBox: { padding: 10, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
  commentText: { marginBottom: 4, fontStyle: "italic" },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#444",
    paddingTop: 10,
  },
  commentInput: { flex: 1, borderWidth: 1, borderRadius: 6, padding: 8, marginRight: 8 },
  modalButton: { padding: 12, borderRadius: 6, marginBottom: 8, alignItems: "center" },
  chatButton: { backgroundColor: "#f65a65" },
  buttonText: { fontWeight: "bold" },
  mapContainer: {
    height: 200,
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
  },
  map: { ...StyleSheet.absoluteFillObject },

  // Modal de Participação
  partContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  partContent: { width: "80%", borderRadius: 8, padding: 16 },
  partTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 12 },
  partOption: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  partOptionText: { marginLeft: 10 },
  partButton: { marginTop: 20, padding: 12, borderRadius: 6, alignItems: "center" },

  // Modal de Zoom
  zoomOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomCloseButton: {
    position: "absolute",
    top: 50,
    right: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 10,
    borderRadius: 25,
    zIndex: 1000,
  },
  zoomImageContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  zoomedImage: {
    width: width,
    height: height * 0.8,
  },
  // Modal de Pagamento
  paymentOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  paymentContainer: {
    width: "85%",
    borderRadius: 8,
    padding: 16,
    alignItems: "stretch",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 6,
  },
});


export default PostScreen;
