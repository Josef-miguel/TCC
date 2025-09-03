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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { ThemeContext } from "../../context/ThemeContext";
import { db } from "../../../services/firebase";
import { doc, updateDoc,onSnapshot, arrayUnion } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ReportarProblema from "../ReportarProblema";



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

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [comments, setComments] = useState(selectedPost?.comments || []);
  const [whoTravels, setWhoTravels] = useState("Outra pessoa");
  const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");
  const [isSaved, setIsSaved] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageZoomVisible, setImageZoomVisible] = useState(false);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [reportarProblemaVisible, setReportarProblemaVisible] = useState(false);

  const handleStarPress = (rating) => {
    setStarRating(rating);
  };

  const handleReportarProblema = () => {
    setSidebarVisible(false);
    setReportarProblemaVisible(true);
  };

  const handleSalvarPost = () => {
    setSidebarVisible(false);
    setIsSaved(!isSaved);
    // Aqui você pode implementar a lógica para salvar o post no Firebase
    console.log("Post salvo/removido dos salvos");
  };

  const handleVisualizarPerfil = () => {
    setSidebarVisible(false);
    // Navegar para a tela de perfil do organizador
    navigation.navigate("Perfil", { userId: selectedPost?.userId });
  };

const auth = getAuth();

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
    setParticipationModalVisible(false);
  } catch (error) {
    console.error("Erro ao salvar participação:", error);
  }
};

  const handleSendComment = () => {
    if (newText.trim() === '') return;
    const commentObj = {
      user_id: "",
      username: "",
      comment_text: newText.trim(),
      created_at: new Date().toISOString(),
      numStars: starRating,
    }

    setComments([...comments, commentObj]);
    setNewText("");
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

  if (!selectedPost || !modalVisible) return null;
  

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
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
                      Nenhuma imagem disponível
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
                onPress={() => {
                  setModalVisible(false);
                  setSelectedPost(null);
                }}
              >
                <Ionicons name="arrow-back" size={28} color="#fff" />
              </TouchableOpacity>

              {/* Botão de opções (3 pontos) */}
              <TouchableOpacity
                style={styles.optionsButton}
                onPress={() => setSidebarVisible(!sidebarVisible)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Menu dropdown dos três pontinhos */}
              {sidebarVisible && (
                <View style={[styles.dropdownMenu, { backgroundColor: theme?.backgroundSecondary }]}>
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handleReportarProblema}
                  >
                    <Ionicons name="flag-outline" size={20} color={theme?.textPrimary} />
                    <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>
                      Reportar Problema
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handleSalvarPost}
                  >
                    <Ionicons 
                      name={isSaved ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color={theme?.textPrimary} 
                    />
                    <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>
                      {isSaved ? "Remover dos Salvos" : "Salvar Post"}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.dropdownItem}
                    onPress={handleVisualizarPerfil}
                  >
                    <Ionicons name="person-outline" size={20} color={theme?.textPrimary} />
                    <Text style={[styles.dropdownText, { color: theme?.textPrimary }]}>
                      Visualizar Perfil
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Rota */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>Trajeto da viagem</Text>
            <View style={[styles.routeBox, { borderColor: theme?.border, backgroundColor: theme?.backgroundSecondary }]}>
              <Ionicons name="location-sharp" size={24} color={theme?.textPrimary} />
              <View style={{ marginLeft: 10 }}>
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>Início: {selectedPost.route?.display_start}</Text>
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>Destino: {selectedPost.route?.display_end}</Text>
              </View>
            </View>

            <View style={[styles.routeBox, { borderColor: theme?.border, backgroundColor: theme?.backgroundSecondary }]}>
              {selectedPost.route?.start && selectedPost.route?.end && (
                <View style={[styles.mapContainer, { borderColor: theme?.border }]}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: selectedPost.route.start.latitude,
                      longitude: selectedPost.route.start.longitude,
                      latitudeDelta: 0.2,
                      longitudeDelta: 0.2,
                    }}
                  >
                    <Marker coordinate={selectedPost.route.start} title="Início" pinColor="green" />
                    <Marker coordinate={selectedPost.route.end} title="Destino" pinColor="red" />
                    <Polyline
                      coordinates={selectedPost.route.coordinates}
                      strokeColor={theme?.primary || "#f37100"}
                      strokeWidth={4}
                    />
                  </MapView>
                </View>
              )}
            </View>

            {/* Informações */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>Informações da excursão</Text>
            <View style={[styles.infoBox, { borderColor: theme?.border }]}>
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>Descrição: </Text>
              <Text style={[styles.commentText, { color: theme?.textSecondary }]}>{selectedPost?.desc}</Text>
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>Quantas vagas estão disponíveis: </Text>
              <Text style={[styles.commentText, { color: theme?.textSecondary }]}>{selectedPost?.numSlots}</Text>
              <Text style={[styles.commentTitle, { color: theme?.textPrimary }]}>Essa viagem é uma: </Text>
              <Text style={[styles.commentText, { color: theme?.textSecondary }]}>
                {(selectedPost?.type == 1) ? "Viagem" : (selectedPost?.type == 2) ? "Excursão" : (selectedPost?.type == 3) ? "Show" : "Sem tipo"}
              </Text>
            </View>

            {/* Avaliação */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>Avaliação</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => handleStarPress(i)} style={styles.starButton}>
                  <Ionicons
                    name={i <= starRating ? "star" : "star-outline"}
                    size={30}
                    color={theme?.primary || "#f37100"}
                  />
                </TouchableOpacity>
              ))}
              <Text style={[styles.starText, { color: theme?.textPrimary }]}>{starRating} de 5</Text>
            </View>

            {/* Comentários */}
            <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>Comentários</Text>
            <View style={[styles.commentsBox, { borderColor: theme?.border }]}>
              {comments.map((c, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text style={{ color: theme?.textPrimary, fontWeight: "bold" }}>{c.username}</Text>
                  <Text style={[styles.commentText, { color: theme?.textSecondary }]}>"{c.comment_text}"</Text>
                </View>
              ))}

              <View style={styles.commentInputContainer}>
                <TextInput
                  style={[styles.commentInput, { borderColor: theme?.primary, color: theme?.textPrimary }]}
                  placeholder="Digite um comentário..."
                  placeholderTextColor={theme?.textTertiary || "#aaa"}
                  value={newText}
                  onChangeText={setNewText}
                />
                <TouchableOpacity onPress={handleSendComment}>
                  <Ionicons name="send" size={24} color={theme?.primary || "#f37100"} />
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
      style={[styles.partButton, { backgroundColor: theme?.primary }]}
  onPress={() => setParticipationModalVisible(true)}
>
  <Text style={[styles.buttonText, { color: theme?.textInverted }]}>
    Confirmar participação
  </Text>
</TouchableOpacity>

            <TouchableOpacity
              style={[styles.chatButton, styles.modalButton]}
              onPress={() => navigation.navigate("Chat")}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>Conversar com o organizador</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

     
      </Modal>

      {/* Modal de Participação embutido */}
      <Modal visible={participationModalVisible} transparent animationType="slide">
        <View style={[styles.partContainer, { backgroundColor: theme?.overlay }]}>
          <View style={[styles.partContent, { backgroundColor: theme?.backgroundSecondary }]}>
            <Text style={[styles.partTitle, { color: theme?.textPrimary }]}>Quem vai viajar...</Text>
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

            <Text style={[styles.partTitle, { marginTop: 20, color: theme?.textPrimary }]}>Quem vai ir?</Text>
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
              style={[styles.partButton, { backgroundColor: theme?.primary }]}
              onPress={handleParticipar}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>Confirmar</Text>
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
});


export default PostScreen;
