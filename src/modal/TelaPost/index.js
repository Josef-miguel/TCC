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
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(selectedPost?.comments || []);

  if (!selectedPost || !modalVisible) return null;

  const handleStarPress = (rating) => {
    setStarRating(rating);
    // Aqui pode salvar no backend futuramente
  };

  const handleSendComment = () => {
    if (newComment.trim() === '') return;
    setComments([...comments, newComment.trim()]);
    setNewComment('');
  };

  const formatCoordinate = (coord) => {
    if (!coord) return 'Não definido';
    return `${coord.latitude?.toFixed(4)}, ${coord.longitude?.toFixed(4)}`;
  };

  return (
    <View style={{ flex: 1 }}>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>
            
            {/* Header */}
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

            {/* Imagens */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {selectedPost.images?.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.destImage} />
              ))}
            </ScrollView>

            {/* Rota */}
            <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
            <View style={styles.routeBox}>
              <Ionicons name="location-sharp" size={24} color="#fff" />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.routeText}>Início: {selectedPost.route?.display_start}</Text>
                <Text style={styles.routeText}>Destino: {selectedPost.route?.display_end}</Text>
              </View>
            </View>

            {/* Informações */}
            <Text style={styles.sectionTitle}>Informações da excursão</Text>
            <View style={styles.infoBox}>
              <Text style={styles.postDesc}>{selectedPost.desc || 'Sem descrição.'}</Text>
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

      {/* Modal de Chat (placeholder) */}
      <Modal visible={chatModalVisible} animationType="slide">
        {/* Colocar o componente de chat aqui depois */}
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
    alignItems: "flex-start",
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
    backgroundColor: "#2a2a2a",
  },
  routeText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 4,
  },
  infoBox: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
    borderColor: "#fff",
  },
  postDesc: {
    color: "#fff",
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
});

export default PostScreen;
