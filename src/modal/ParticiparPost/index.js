import { View, Text, ScrollView, TouchableOpacity, Button, Modal, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import TelaPost from "../TelaPost";

// Componente modal para escolher detalhes de participação em um post de viagem
const JoinPost = ({ participationModalVisible, setParticipationModalVisible }) => {
  // Estado para quem vai efetivamente viajar (eu ou outra pessoa)
  const [whoTravels, setWhoTravels] = useState("Outra pessoa");
  // Estado para faixa etária/do perfil de quem vai viajar
  const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");

  // Obtém visibilidade e post selecionado a partir de TelaPost (não recomendável, usar props em vez de importar)
  const [modalVisible, setModalVisible] = useState(TelaPost.modalVisible);
  const [selectedPost, setSelectedPost] = useState(TelaPost.selectedPost);

  // Fecha o modal principal de detalhes (TelaPost)
  const closeModal = () => {
    setModalVisible(false);
    // setSelectedPost(false);
  };

  // Fecha este modal de participação
  const closeParticipation = () => {
    setParticipationModalVisible(false);
  };

  return (
    // Modal transparente para overlay
    <Modal visible={participationModalVisible} transparent animationType="slide">
      <View style={styles.partContainer}>
        <View style={styles.partContent}>
          {/* Título da seção de escolha de quem viaja */}
          <Text style={styles.partTitle}>Quem vai viajar...</Text>
          {/* Opções de quem viaja: "Sou eu" ou "Outra pessoa" */}
          {['Sou eu', 'Outra pessoa'].map(opt => (
            <TouchableOpacity
              key={opt}
              style={styles.partOption}
              onPress={() => setWhoTravels(opt)}
            >
              {/* Indicador circular de seleção */}
              <View style={styles.radioOuter}>
                {whoTravels === opt && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.partOptionText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          {/* Título da seção de escolha de perfil etário */}
          <Text style={[styles.partTitle, { marginTop: 20 }]}>Quem vai ir?</Text>
          {/* Opções de faixa etária/perfil */}
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
              <View style={styles.radioOuter}>
                {whoGoes === opt && <View style={styles.radioInner} />}
              </View>
              <Text style={styles.partOptionText}>{opt}</Text>
            </TouchableOpacity>
          ))}

          {/* Botão de confirmação que fecha ambos os modais */}
          <TouchableOpacity
            style={styles.partButton}
            onPress={() => { closeParticipation(); closeModal(); }}
          >
            <Text style={styles.buttonText}>Próxima</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Estilos para o modal de participação
const styles = StyleSheet.create({
  partContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center',
    alignItems: 'center',
  },
  partContent: {
    width: '80%',
    backgroundColor: '#363942', // fundo caixa
    borderRadius: 8,
    padding: 16,
  },
  partTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
    color: '#e4e4e4', // texto claro
  },
  partOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f37100', // cor principal
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f37100', // cor principal
  },
  partOptionText: {
    marginLeft: 10,
    color: '#e4e4e4', // texto claro
  },
  partButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f37100', // botão principal
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#e4e4e4', // texto claro
    fontWeight: 'bold',
  },
});

export default JoinPost;