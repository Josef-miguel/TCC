import { useState } from "react";
import { Text, TextInput, Modal, View, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from '@expo/vector-icons';

// Componente para criar um novo post de viagem
const createPost = ({ modalVisible, setModalVisible }) => {
  // Estados locais para armazenar informações do post
  const [postName, setPostName] = useState('');       // Nome/título do post
  const [tripType, setTripType] = useState('Viagem');  // Tipo da viagem: 'Viagem' ou 'Excursão'
  const [description, setDescription] = useState('');  // Descrição detalhada da viagem

  return (
    <>
      {/* Modal que aparece ao acionar a criação de post */}
      <Modal
        animationType="slide"           // Animação de slide ao abrir/fechar
        transparent={true}               // Fundo semitransparente
        visible={modalVisible}           // Controla visibilidade via prop
        onRequestClose={() => setModalVisible(false)} // Fecha modal ao solicitar
      >
        <View style={styles.modalOverlay}>
          {/* ScrollView permite rolagem quando o conteúdo ultrapassa a tela */}
          <ScrollView contentContainerStyle={styles.modalContent}>

            {/* Cabeçalho do modal com botão de voltar e título */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Criar post</Text>
            </View>

            {/* Placeholder para imagens do destino */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Imagens do destino</Text>
            </View>

            {/* Input para nome do post */}
            <Text style={styles.label}>Nome do post</Text>
            <TextInput
              style={styles.input}
              placeholder="Viagem para Miracatu, SP..."
              value={postName}
              onChangeText={setPostName}    // Atualiza estado postName
            />

            {/* Seleção de tipo de viagem */}
            <Text style={styles.label}>Tipo de viagem</Text>
            <View style={styles.tripTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  tripType === 'Viagem' && styles.tripTypeButtonActive
                ]}
                onPress={() => setTripType('Viagem')}  // Marca 'Viagem'
              >
                <Text style={[
                  styles.tripTypeText,
                  tripType === 'Viagem' && styles.tripTypeTextActive
                ]}>
                  VIAGEM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  tripType === 'Excursão' && styles.tripTypeButtonActive
                ]}
                onPress={() => setTripType('Excursão')} // Marca 'Excursão'
              >
                <Text style={[
                  styles.tripTypeText,
                  tripType === 'Excursão' && styles.tripTypeTextActive
                ]}>
                  EXCURSÃO
                </Text>
              </TouchableOpacity>
            </View>

            {/* Input para quantidade de pessoas */}
            <Text style={styles.label}>Quantidade de pessoas</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantidade de pessoas"
              keyboardType="numeric"          // Tipo numérico
            />

            {/* Input de descrição da viagem */}
            <Text style={styles.label}>Descrição da viagem</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Vamos nos divertir pela cidade!"
              value={description}
              onChangeText={setDescription}    // Atualiza estado description
              multiline                         // Permite múltiplas linhas
            />

            {/* Placeholder para mapa/trajeto da viagem */}
            <Text style={styles.label}>Trajeto da viagem</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={24} color="black" />
            </View>

            {/* Texto de termos de uso com link */}
            <Text style={styles.termsText}>
              Ao criar uma publicação no aplicativo, você concorda com os{' '}
              <Text style={styles.termsLink}>Termos de Uso e Política de Privacidade</Text>
              {' '}do JSG.
            </Text>

            {/* Botão para submeter/criar o post */}
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>VIAJAR</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// Estilos do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostButton: {
    top: -20,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    minHeight: '90%',                
  },
  modalHeader: {
    flexDirection: 'row',           
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeholderText: {
    color: '#888',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',     
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tripTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: '#e0f7fa',     
    borderColor: '#00bcd4',         
  },
  tripTypeText: {
    fontSize: 12,
    color: '#333',
  },
  tripTypeTextActive: {
    color: '#00bcd4',
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  termsLink: {
    color: '#00bcd4',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#00bcd4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default createPost;