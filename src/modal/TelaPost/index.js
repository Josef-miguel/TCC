import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ParticiparPost from '../ParticiparPost';
import { useNavigation } from '@react-navigation/native';

import Chat from '../../telas/Chat';


// Componente de tela de detalhes de um post de viagem
const PostScreen = ({ modalVisible, setModalVisible, selectedPost, setSelectedPost }) => {
  const navigation = useNavigation();

  // Estado para controlar abertura do modal de participação
  const [participationModalVisible, setParticipationModalVisible] = useState(false);
  // Estado para controlar abertura do modal de chat (não implementado aqui)
  const [chatModalVisible, setChatModalVisible] = useState(false);
  // Estado para avaliação de estrelas (1 a 5), inicia com rating do post se existir
  const [starRating, setStarRating] = useState(selectedPost?.ratingStars || 0);

  // Se não houver post selecionado ou modal principal não estiver visível, não renderiza nada
  if (selectedPost == null || !modalVisible) return null;

  // Função chamada ao clicar em uma estrela, atualiza o estado
  const handleStarPress = (rating) => {
    setStarRating(rating);
    // TODO: aqui pode chamar callback para salvar no backend ou atualizar selectedPost
    // ex: updatePostRating(selectedPost.id, rating);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Modal principal exibindo detalhes do post */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalInner}>
            {/* Cabeçalho com botão de voltar e título da seção */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={() => {
                  // Fecha o modal e limpa seleção ao voltar
                  setModalVisible(false);
                  setSelectedPost(null);
                }}
              >
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Imagens do destino</Text>
            </View>

            {/* Galeria de imagens do destino, rolável horizontalmente */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {selectedPost.images.map((uri, i) => (
                <Image key={i} source={{ uri }} style={styles.destImage} />
              ))}
            </ScrollView>

            {/* Seção de trajeto da viagem */}
            <Text style={styles.sectionTitle}>Trajeto da viagem</Text>
            <View style={styles.routeBox}>
              <Ionicons name="location-sharp" size={24} />
              <Text style={styles.routeText}>{selectedPost.route}</Text>
            </View>

            {/* Seção de informações da excursão */}
            <Text style={styles.sectionTitle}>Informações da excursão</Text>
            <View style={styles.infoBox}>
              <Text>{selectedPost.desc}</Text>
            </View>

            {/* Seção de avaliação com estrelas clicáveis */}
            <Text style={styles.sectionTitle}>Avaliação</Text>
            <View style={styles.starContainer}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => handleStarPress(i)} style={styles.starButton}>
                  <Ionicons
                    name={i <= starRating ? 'star' : 'star-outline'}
                    size={30}
                    color="#FFD700" // cor amarela para estrelas
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.starText}>{starRating} de 5</Text>
            </View>

            {/* Seção de comentários */}
            <Text style={styles.sectionTitle}>Comentários</Text>
            <View style={styles.commentsBox}>
              {/* {selectedPost.comments.map((c, idx) => (
                <Text key={idx} style={styles.commentText}>"{c}"</Text>
              ))} */}
            </View>

            {/* Botão para abrir modal de participação */}
            <TouchableOpacity
              style={[styles.modalButton, styles.joinButton]}
              onPress={() => setParticipationModalVisible(true)}
            >
              <Text style={styles.buttonText}>Participar da viagem</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chatButton, styles.modalButton]}
              onPress={() => navigation.navigate('Chat')
              }>
              <Text style={styles.buttonText}>Conversar com o organizador</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Componente de modal de participação, importado externamente */}
      <ParticiparPost
        participationModalVisible={participationModalVisible}
        setParticipationModalVisible={setParticipationModalVisible}
      />

      {/* Modal de chat (estrutura básica, sem conteúdo) */}
      <Modal visible={chatModalVisible} animationType="slide">
        {/* TODO: implementar componente de chat aqui */}
      </Modal>
    </View>
  );
};

// Estilos para o componente PostScreen
const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
  },
  modalScroll: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  modalInner: {
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10, 
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    fontSize: 16,
  },
  imageScroll: {
    marginBottom: 12,
  },
  destImage: {
    width: 150,
    height: 100,
    borderRadius: 6,
    alignSelf: 'center'
  },
  routeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
  },
  routeText: {
    marginLeft: 8,
  },
  infoBox: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
  },
  starContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    padding: 8,
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 12,
  },
  commentText: {
    marginBottom: 4,
    fontStyle: 'italic',
  },
  modalButton: {
    padding: 12,
    backgroundColor: '#2196f3',
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  joinButton: {
    backgroundColor: '#4caf50', 
  },
  chatButton: {
    backgroundColor: '#f65a65', 
    
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default PostScreen;