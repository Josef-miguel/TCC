import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ParticiparPost from "../ParticiparPost";
import { useNavigation } from "@react-navigation/native";

const PostScreen = ({
  modalVisible,
  setModalVisible,
  selectedPost,
  setSelectedPost,
}) => {
  const navigation = useNavigation();

  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [starRating, setStarRating] = useState(selectedPost?.ratingStars || 0);

  // Novos estados para comentários
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(selectedPost?.comments || []);

  if (selectedPost == null || !modalVisible) return null;

  const handleStarPress = (rating) => {
    setStarRating(rating);
    // Aqui pode salvar no backend, se quiser
  };

  const handleSendComment = () => {
    if (newComment.trim() === '') return;

    setComments([...comments, newComment.trim()]);
    setNewComment('');
    // Aqui também pode salvar no backend
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalInner}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setSelectedPost(null);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Imagens do destino</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {selectedPost.images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.destImage} />
              ))}
            </ScrollView>

            <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
            <View style={styles.routeBox}>
              <Ionicons name="location-sharp" size={24} color="#fff" />
              <Text style={styles.routeText}>{selectedPost.route}</Text>
            </View>

            <Text style={styles.sectionTitle}>Informações da excursão</Text>
            <View style={styles.infoBox}>
              <Text style={styles.postDesc}>{selectedPost.desc}</Text>
            </View>

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

            <Text style={styles.sectionTitle}>Comentários</Text>
            <View style={styles.commentsBox}>
              {comments.map((c, idx) => (
                <Text key={idx} style={styles.commentText}>"{c}"</Text>
              ))}

              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Digite um comentário..."
                  placeholderTextColor="#aaa"
                  value={newComment}
                  onChangeText={setNewComment}
                />
                <TouchableOpacity onPress={handleSendComment}>
                  <Ionicons name="send" size={24} color="#f37100" />
                </TouchableOpacity>
              </View>
            </View>

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

      <ParticiparPost
        participationModalVisible={participationModalVisible}
        setParticipationModalVisible={setParticipationModalVisible}
      />

      <Modal visible={chatModalVisible} animationType="slide">
        {/* TODO: implementar componente de chat aqui */}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalScroll: {
    margin: 20,
    backgroundColor: "#1a1b21",
    borderRadius: 8,
  },
  modalInner: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 10,
  },
  sectionTitle: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
    fontSize: 16,
    color: "#fff",
  },
  imageScroll: {
    marginBottom: 12,
  },
  destImage: {
    width: 150,
    height: 100,
    borderRadius: 6,
    alignSelf: "center",
    marginRight: 10,
  },
  routeBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
  },
  routeText: {
    marginLeft: 8,
    color: "#fff",
  },
  infoBox: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
  },
  postDesc: {
    color: "#fff"
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
    padding: 8,
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
});

export default PostScreen;
