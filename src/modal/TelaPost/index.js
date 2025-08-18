import React, { useState, useEffect } from "react";
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
import ParticiparPost from "../ParticiparPost";
import { useNavigation } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";

const { width, height } = Dimensions.get("window");

const PostScreen = ({
  modalVisible,
  setModalVisible,
  selectedPost,
  setSelectedPost,
}) => {
  const navigation = useNavigation();

  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(0);
  const [newText, setNewText] = useState("");
  const [comments, setComments] = useState(selectedPost?.comments || []);

  
  const handleStarPress = (rating) => {
    setStarRating(rating);
  };

  const handleSendComment = () => {
    if (newText.trim() === '') return;
    const commentObj = {
      user_id: "",
      username : "",
      comment_text: newText.trim(),
      created_at: new Date().toISOString(),
      numStars: starRating,
    }

    setComments([...comments, commentObj]);
    setNewText("");
  };
  
  useEffect(() => {
    // Atualiza a avaliação e comentários do post selecionado
    if (selectedPost) {
      selectedPost.comments = comments;
    }
  })
  if (!selectedPost || !modalVisible) return null;
  
  return (
    <View style={{ flex: 1 }}>
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <View style={styles.modalContainer}>
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
            </View>

            {/* Rota */}
            <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
            <View style={styles.routeBox}>
              <Ionicons name="location-sharp" size={24} color="#fff" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.routeText}>Início: {selectedPost.route?.display_start}</Text>
                <Text style={styles.routeText}>Destino: {selectedPost.route?.display_end}</Text>
              </View>
            </View>

            <View style={styles.routeBox}>
              {selectedPost.route?.start && selectedPost.route?.end && (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: selectedPost.route.start.latitude,
                      longitude: selectedPost.route.start.longitude,
                      latitudeDelta: 0.2,
                      longitudeDelta: 0.2,
                    }}
                  >
                    <Marker
                      coordinate={selectedPost.route.start}
                      title="Início"
                      pinColor="green"
                    />
                    <Marker
                      coordinate={selectedPost.route.end}
                      title="Destino"
                      pinColor="red"
                    />
                    <Polyline
                      coordinates={selectedPost.route.coordinates}
                      strokeColor="#f37100"
                      strokeWidth={4}
                    />
                  </MapView>
                </View>
              )}
            </View>

            {/* Informações */}
            <Text style={styles.sectionTitle}>Informações da excursão</Text>
            <View style={styles.infoBox}>
              <Text style={styles.commentTitle}>Descrição: </Text>
              <Text style={styles.commentText}>{selectedPost?.desc}</Text>
              {/* <Text style={styles.commentText}>Vamos sair em: {selectedPost?.exit_date}</Text>
              <Text style={styles.commentText}>Vamos voltar em: {selectedPost?.return_date}</Text> */}
              <Text style={styles.commentTitle}>Quantas vagas estão disponíveis: </Text>
              <Text style={styles.commentText}>{selectedPost?.numSlots}</Text>
              <Text style={styles.commentTitle}>Essa viagem é uma: </Text>
              <Text style={styles.commentText}>{(selectedPost?.type == 1) ? "Viagem" : (selectedPost?.type == 2) ? "Excursão" : (selectedPost?.type == 3) ? "Show" : "Sem tipo"}</Text>
            </View>

            {/* Avaliação */}
            <Text style={styles.sectionTitle}>Avaliação</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => handleStarPress(i)} style={styles.starButton}>
                  <Ionicons
                    name={i <= starRating ? "star" : "star-outline"}
                    size={30}
                    color="#f37100"
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starText}>{starRating} de 5</Text>
            </View>

            {/* Comentários */}
            <Text style={styles.sectionTitle}>Comentários</Text>
            <View style={styles.commentsBox}>
              {comments.map((c, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{c.username}</Text>
                  <Text style={styles.commentText}>"{c.comment_text}"</Text>
                </View>
              ))}
            
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Digite um comentário..."
                  placeholderTextColor="#aaa"
                  value={newText}
                  onChangeText={setNewText}
                />
                <TouchableOpacity onPress={handleSendComment}>
                  <Ionicons name="send" size={24} color="#f37100" />
                </TouchableOpacity>
              </View>
            </View>


            {/* Botões de ação */}
            <TouchableOpacity
              style={[styles.modalButton, styles.joinButton]}
              onPress={() => setParticipationModalVisible(true)}
            >
              <Text style={styles.buttonText}>Participar da viagem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatButton, styles.modalButton]}
              onPress={() => navigation.navigate("Chat")}
            >
              <Text style={styles.buttonText}>Conversar com o organizador</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Modal de Participação */}
      <ParticiparPost
        participationModalVisible={participationModalVisible}
        setParticipationModalVisible={setParticipationModalVisible}
      />

      {/* Modal de Chat */}
      <Modal visible={chatModalVisible} animationType="slide">
        {/* Coloque o componente de chat aqui depois */}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#1a1b21",
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
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    fontSize: 16,
    color: "#fff",
  },
  commentTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#fff",
    paddingBottom: 4,
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
    backgroundColor: "#2a2a2a",
    flexWrap: 'wrap',
    width: '100%',
  },
  routeText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  infoBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
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
    color: '#fff'
  },
  commentsBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
  },
  commentText: {
    marginBottom: 4,
    fontStyle: "italic",
    color: "#fff",
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    borderTopWidth: 1,
    borderColor: '#444',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#f37100',
    borderRadius: 6,
    padding: 8,
    marginRight: 8,
    color: '#fff',
  },
  modalButton: {
    padding: 12,
    backgroundColor: "#f37100",
    borderRadius: 6,
    marginBottom: 8,
    alignItems: "center",
  },
  joinButton: {
    backgroundColor: "#f37100",
  },
  chatButton: {
    backgroundColor: "#f65a65",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  mapContainer: {
    height: 200,
    width: '100%',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    borderColor: "#fff",
    borderWidth: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default PostScreen;
