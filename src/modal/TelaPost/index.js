import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParticiparPost from '../ParticiparPost';

const PostScreen = ({ modalVisible, setModalVisible, selectedPost, setSelectedPost }) => {
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  // Estado para avaliação de estrelas (1 a 5)
  const [starRating, setStarRating] = useState(selectedPost?.ratingStars || 0);

  if (selectedPost == null || !modalVisible) return null;

  // Função que atualiza a avaliação de estrelas
  const handleStarPress = (rating) => {
    setStarRating(rating);
    // Aqui você pode chamar callback para atualizar no backend ou localmente em selectedPost
    // ex: updatePostRating(selectedPost.id, rating);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Post Details Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedPost(null); }}>
                <Ionicons name="arrow-back" size={24} color="black" />
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
              <Ionicons name="location-sharp" size={24} />
              <Text style={styles.routeText}>{selectedPost.route}</Text>
            </View>

            <Text style={styles.sectionTitle}>Informações da excursão</Text>
            <View style={styles.infoBox}>
              <Text>{selectedPost.excursionInfo}</Text>
            </View>

            <Text style={styles.sectionTitle}>Avaliação</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => handleStarPress(i)} style={styles.starButton}>
                  <Ionicons
                    name={i <= starRating ? 'star' : 'star-outline'}
                    size={30}
                    color="#FFD700"
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starText}>{starRating} de 5</Text>
            </View>

            <Text style={styles.sectionTitle}>Comentários</Text>
            <View style={styles.commentsBox}>
              {selectedPost.comments.map((c, idx) => (
                <Text key={idx} style={styles.commentText}>"{c}"</Text>
              ))}
            </View>

            <TouchableOpacity style={[styles.modalButton, styles.joinButton]} onPress={() => setParticipationModalVisible(true)}>
              <Text style={styles.buttonText}>Participar da viagem</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Participation Modal */}
      <ParticiparPost
        participationModalVisible={participationModalVisible}
        setParticipationModalVisible={setParticipationModalVisible}
      />

      {/* Chat Modal */}
      <Modal visible={chatModalVisible} animationType="slide">
        {/* Chat component aqui */}
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalButton: { padding: 12, backgroundColor: '#2196f3', borderRadius: 6, marginBottom: 8, alignItems: 'center' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  modalScroll: { margin: 20, backgroundColor: '#fff', borderRadius: 8 },
  modalInner: { padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 15, gap: 10 },
  infoBox: { padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
  routeBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
  sectionTitle: { fontWeight: 'bold', marginTop: 12, marginBottom: 6, fontSize: 16 },
  imageScroll: { marginBottom: 12 },
  destImage: { width: 150, height: 100, borderRadius: 6, marginRight: 8 },
  routeText: { marginLeft: 8 },
  commentsBox: { padding: 8, borderWidth: 1, borderRadius: 6, marginBottom: 12 },
  commentText: { marginBottom: 4, fontStyle: 'italic' },
  starContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  starButton: { marginHorizontal: 4 },
  starText: { marginLeft: 8, fontSize: 16 },
  joinButton: { backgroundColor: '#4caf50' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default PostScreen;
