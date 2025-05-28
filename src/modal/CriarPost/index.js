import { useState } from "react";
import { Text, TextInput, Modal, View, TouchableOpacity, ScrollView, StyleSheet, Image, Linking } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showMessage } from 'react-native-flash-message';

import { Feather } from '@expo/vector-icons';

import api from '../../../services/api'; 


const CreatePost = ({ modalVisible, setModalVisible }) => {
  const [postName, setPostName] = useState('');
  const [tripType, setTripType] = useState(1);
  const [description, setDescription] = useState('');
  const [route, setRoute] = useState('');
  const [route_exit, setRouteExit] = useState('');
  const [imageUri, setImageUri] = useState([]);
  const [tripPrice, setTripPrice] = useState(0);
  const [numSlots, setNumSlots] = useState(0);
  const [exit_date, setExitDate] = useState(new Date());
  const [return_date, setReturnDate] = useState(new Date());
  
  const [showExitDate, setShowExitDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);


  function limparCampos(){
    setPostName("");
    setTripType("");
    setDescription("");
    setImageUri([]);
    setTripPrice(0);
    setNumSlots(0);
    
  }

  async function saveData() {
    if (!postName || !tripType || !description || imageUri.length === 0 || tripPrice <= 0 || numSlots <= 0 || !exit_date || !return_date) {
      showMessage({
        message: "Erro ao Salvar",
        description: 'Preencha os Campos Obrigatórios!',
        type: "warning",
      });
      return;
    }

    console.log("tentar");

    try {
      const obj = {
        titulo: postName || '',
        descricao: description || '',
        id_tag: tripType || '',
        local_saida: route_exit || '',
        imagens: imageUri || [],
        n_vagas: numSlots || '',
        preco: tripPrice || 1,
        data_de_saida: exit_date || '',
        data_de_retorno: return_date || '',
      };

      console.log("Nunca desistir: " + obj);

      const res = await api.post('TCC/register.php', obj);
      console.log(res.data.message);
      if (res.status !== 200) {
        throw new Error('Erro na comunicação com o servidor');
      }

      if (res.data.success === false) {
        showMessage({
          message: "Erro ao cadastrar",
          description: res.data.message || 'CAMPO INVÁLIDO!',
          type: "warning",
          duration: 3000,
        });
        limparCampos();
      } else if (res.data.success === true) {
        showMessage({
          message: "Cadastro Bem-Sucedido",
          description: "Bem-vindo!",
          type: "success",
          duration: 1800,
        });
        setSuccess(true);
        navigation.navigate('Home');
      } else {
        showMessage({
          message: "Ocorreu algum erro",
          description: "erro",
          type: 'warning',
          duration: 2000
        });
      }

    } catch (error) {
      showMessage({
        message: "Ocorreu algum erro: " + error,
        description: "erro",
        type: 'warning',
        duration: 2000
      });
      setSuccess(false);
    }

    console.log("rodando");
  }




  const pickImage = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Permissão necessária',
          'Você precisa permitir o acesso às fotos nas configurações do app.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
      }
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      // console.log('Resultado da imagem:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = result.assets[0].uri;
        setImageUri(prevUris => [...prevUris, newImage]);
      }
      console.log(imageUri);
    } catch (error) {
      console.log('Error picking image: ', error);
    }
  };




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
              
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                {imageUri.length > 0 ? (
                  imageUri.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.profileImage} />
                  ))
                ) : (
                  <Ionicons name="cloud-upload-outline" size={30} color="#888" />
                )}
              </TouchableOpacity>
            </View>

            {/* Input para nome do post */}
            <Text style={styles.label}>Nome do post</Text>
            <TextInput
              style={styles.input}
              placeholder="Viagem para Miracatu, SP..."
              value={postName}
              onChangeText={setPostName}    // Atualiza estado postName
            />

            {/* Para onde vai ir */}
            <Text style={styles.label}>Rota de chegada</Text>
            <View>
              <TextInput
                style={styles.input}
                value={route}
                placeholder="Para onde vamos?"
                onChangeText={setRoute}
              ></TextInput>
            </View>
            {/* De onde vai sair */}
            <Text style={styles.label}>Rota de saída</Text>
            <View>
              <TextInput
                style={styles.input}
                value={route_exit}
                placeholder="De onde vamos sair?"
                onChangeText={setRouteExit}
              ></TextInput>
            </View>

            {/* Seleção de tipo de viagem */}
            <Text style={styles.label}>Tipo de viagem</Text>
            <View style={styles.tripTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  tripType === 1 && styles.tripTypeButtonActive
                ]}
                onPress={() => setTripType(1)}  // Marca 'Viagem'
              >
                <Text style={[
                  styles.tripTypeText,
                  tripType === 1 && styles.tripTypeTextActive
                ]}>
                  VIAGEM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  tripType === 3 && styles.tripTypeButtonActive
                ]}
                onPress={() => setTripType(3)} // Marca 'Show'
              >
                <Text style={[
                  styles.tripTypeText,
                  tripType === 3 && styles.tripTypeTextActive
                ]}>
                  SHOW
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  tripType === 2 && styles.tripTypeButtonActive
                ]}
                onPress={() => setTripType(2)} // Marca 'Excursão'
              >
                <Text style={[
                  styles.tripTypeText,
                  tripType === 2 && styles.tripTypeTextActive
                ]}>
                  EXCURSÃO
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Data de saída</Text>
              <View style={styles.inputWrapper}>
                <Feather name="calendar" size={20} style={styles.icon} />
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowExitDate(true)}
                >
                  <Text style={{ color: '#333', fontSize: 16 }}>
                    {exit_date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showExitDate && (
                <DateTimePicker
                  value={exit_date}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowExitDate(false);
                    if (selectedDate) setExitDate(selectedDate);
                  }}
                />
              )}


            <Text style={styles.label}>Data de retorno</Text>
            <View style={styles.inputWrapper}>
              <Feather name="calendar" size={20} style={styles.icon} />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowReturnDate(true)}
              >
                <Text style={{ color: '#333', fontSize: 16 }}>
                  {return_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showReturnDate && (
              <DateTimePicker
                value={return_date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowReturnDate(false);
                  if (selectedDate) setReturnDate(selectedDate);
                }}
              />
            )}



            {/* Input para quantidade de pessoas */}
            <Text style={styles.label}>Quantidade de pessoas</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantidade de pessoas"
              value={numSlots}
              onChangeText={setNumSlots}
              keyboardType="numeric"          // Tipo numérico
            />
            {/* Input para o preço */}
            <Text style={styles.label}>Preço R$</Text>
            <TextInput
              style={styles.input}
              placeholder="R$00,00"
              value={tripPrice}
              onChangeText={setTripPrice}
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
            <TouchableOpacity style={styles.submitButton} onPress={saveData}>
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
  profileImage: { 
    width: '100%',
    height: '100%' 
  },
   uploadButton: {
    width: '100%', height: '100%', 
    backgroundColor: '#f0f0f0', justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden',
  }
});

export default CreatePost;