import { View, Text, ScrollView, TouchableOpacity, Button, Modal, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useContext } from "react";
import TelaPost from "../TelaPost";
import { ThemeContext } from "../../context/ThemeContext";

// Componente modal para escolher detalhes de participação em um post de viagem
const JoinPost = ({ participationModalVisible, setParticipationModalVisible }) => {
  const [whoTravels, setWhoTravels] = useState("Outra pessoa");
  const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [modalVisible, setModalVisible] = useState(TelaPost.modalVisible);
  const [selectedPost, setSelectedPost] = useState(TelaPost.selectedPost);

  const closeModal = () => {
    setModalVisible(false);
  };

  const closeParticipation = () => {
    setParticipationModalVisible(false);
  };

  return (
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
            onPress={() => { closeParticipation(); closeModal(); }}
          >
            <Text style={[styles.buttonText, { color: theme?.textInverted }]}>Próxima</Text>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  partContent: {
    width: '80%',
    borderRadius: 8,
    padding: 16,
  },
  partTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  partOptionText: {
    marginLeft: 10,
  },
  partButton: {
    marginTop: 20,
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
  },
});

export default JoinPost;