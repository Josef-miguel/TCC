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

import ReportarProblema from "../ReportarProblema"; // ✅ import do modal novo
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { ThemeContext } from "../../context/ThemeContext";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../services/firebase";

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

  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false); // ✅ controle do modal de report
  const [optionsVisible, setOptionsVisible] = useState(false); // ✅ menu 3 pontos

  const [starRating, setStarRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [comments, setComments] = useState(selectedPost?.comments || []);

  const handleStarPress = (rating) => {
    setStarRating(rating);
  };

  const handleSendComment = () => {
    if (newText.trim() === "") return;
    const commentObj = {
      user_id: "",
      username: "",
      comment_text: newText.trim(),
      created_at: new Date().toISOString(),
      numStars: starRating,
    };

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
            
            {/* Carrossel fullscreen */}
            <View style={{ position: "relative" }}>
              <FlatList
                data={selectedPost.images || []}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="cover" />
                )}
              />

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
                onPress={() => setOptionsVisible(!optionsVisible)}
              >
                <Ionicons name="ellipsis-vertical" size={24} color="#fff" />
              </TouchableOpacity>

              {/* Menu suspenso */}
              {optionsVisible && (
                <View style={[styles.optionsMenu, { backgroundColor: theme?.backgroundSecondary }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsVisible(false);
                      setReportModalVisible(true); // ✅ abre modal de report
                    }}
                  >
                    <Text style={[styles.optionText, { color: theme?.textPrimary }]}>
                      Reportar erro
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setOptionsVisible(false);
                      alert("Viagem salva!");
                    }}
                  >
                    <Text style={[styles.optionText, { color: theme?.textPrimary }]}>
                      Salvar viagem
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
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>
                  Início: {selectedPost.route?.display_start}
                </Text>
                <Text style={[styles.routeText, { color: theme?.textPrimary }]}>
                  Destino: {selectedPost.route?.display_end}
                </Text>
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
                {selectedPost?.type == 1
                  ? "Viagem"
                  : selectedPost?.type == 2
                  ? "Excursão"
                  : selectedPost?.type == 3
                  ? "Show"
                  : "Sem tipo"}
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
            <TouchableOpacity
              style={[styles.modalButton, styles.joinButton, { backgroundColor: theme?.primary }]}
              onPress={() => alert("Participar da viagem em breve!")}
            >
              <Text style={styles.modalButtonText}>Participar</Text>
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

      {/* Modal de Participação */}
      {/* <ParticiparPost
        participationModalVisible={participationModalVisible}
        setParticipationModalVisible={setParticipationModalVisible}
      /> */}

      {/* Modal de Chat */}
      <Modal visible={chatModalVisible} animationType="slide">
        {/* Coloque o componente de chat aqui depois */}
      </Modal>

      {/* Modal de Reportar Problema ✅ */}
      <ReportarProblema
        visible={reportModalVisible}
        setVisible={setReportModalVisible}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalInner: {
    padding: 16,
  },
  fullscreenImage: {
    width: width,
    height: height * 0.4,
  },
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
  optionsMenu: {
    position: "absolute",
    top: 80,
    right: 20,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  optionText: {
    paddingVertical: 6,
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    fontSize: 16,
  },
  commentTitle: {
    fontWeight: "bold",
    fontSize: 16,
    paddingBottom: 4,
  },
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
  routeText: {
    fontSize: 14,
    marginBottom: 4,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  infoBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  starButton: {
    marginHorizontal: 4,
  },
  starText: {
    marginLeft: 8,
    fontSize: 16,
  },
  commentsBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
  },
  commentText: {
    marginBottom: 4,
    fontStyle: "italic",
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: "#444",
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
  },
  modalButton: {
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  joinButton: {},
  chatButton: {
    backgroundColor: "#f65a65",
  },
  buttonText: {
    fontWeight: "bold",
  },
  mapContainer: {
    height: 200,
    width: "100%",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PostScreen;
