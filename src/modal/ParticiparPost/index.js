import { View, Text, ScrollView, TouchableOpacity, Button, Modal, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import TelaPost from "../TelaPost";

const JoinPost = ({participationModalVisible, setParticipationModalVisible}) => {
    const [whoTravels, setWhoTravels] = useState("Outra pessoa");
    const [whoGoes, setWhoGoes] = useState("Jovens 15 a 17 anos (com acompanhante)");
    const [modalVisible, setModalVisible] = useState(TelaPost.modalVisible);
    const [selectedPost, setSelectedPost] = useState(TelaPost.selectedPost);

    const closeModal = () => {
        setModalVisible(false);
        setSelectedPost(false);
    }

    const closeParticipation = () => {
        setParticipationModalVisible(false);
    }

    return (
        <Modal visible={participationModalVisible} transparent animationType="slide">
            <View style={styles.partContainer}>
            <View style={styles.partContent}>
            <Text style={styles.partTitle}>Quem vai viajar...</Text>
                {['Sou eu', 'Outra pessoa'].map(opt => (
            <TouchableOpacity key={opt} style={styles.partOption} onPress={() => setWhoTravels(opt)}>
            <View style={styles.radioOuter}>
                        {whoTravels === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.partOptionText}>{opt}</Text>
            </TouchableOpacity>
                ))}

                <Text style={[styles.partTitle, { marginTop: 20 }]}>Quem vai ir?</Text>
                {[
                    'Criança de colo (com acompanhante)',
                    'Criança 6 de 14 anos (acompanhante)',
                    'Jovem 15 a 17 anos (acompanhante)',
                    'Idoso 60 anos ou mais'
                ].map(opt => (
            <TouchableOpacity key={opt} style={styles.partOption} onPress={() => setWhoGoes(opt)}>
            <View style={styles.radioOuter}>
                        {whoGoes === opt && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.partOptionText}>{opt}</Text>
            </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.partButton} onPress={() => { closeParticipation(); closeModal(); }}>
            <Text style={styles.buttonText}>Próxima</Text>
            </TouchableOpacity>
            </View>
            </View>
        </Modal>
    );
}













// Participation Modal JSX and Styles

/* JSX inside return() of your component */


/* Styles */
const styles = StyleSheet.create({
  partContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  partContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16
  },
  partTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12
  },
  partOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center'
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#666'
  },
  partOptionText: {
    marginLeft: 10
  },
  partButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#4caf50',
    borderRadius: 6,
    alignItems: 'center'
  }
});

export default JoinPost;