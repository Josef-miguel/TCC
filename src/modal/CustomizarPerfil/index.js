import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Switch, Modal, Image, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../services/AuthContext';
import { db } from '../../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';

const CustomizeProfile = ({
  modalVisible,
  setModalVisible,
  navigation,
  onSave  // callback opcional para enviar os dados pra fora
}) => {
  const {userData} = useAuth();
  const [name, setName] = useState(userData?.userInfo?.nome);
  const [surname, setSurname] = useState(userData?.userInfo?.surname);
  const [description, setDescription] = useState(userData?.userInfo?.desc);
  const [isOrganizerMode, setIsOrganizerMode] = useState(userData?.userInfo?.isOrganizer);
  const [imageUri, setImageUri] = useState(null);
  


const pickImage = async () => {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    if (!canAskAgain) {
      // Usuário marcou "não perguntar novamente"
      Alert.alert(
        'Permissão necessária',
        'Você precisa permitir o acesso às fotos nas configurações do app.',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Abrir configurações',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
    } else {
      Alert.alert(
        'Permissão negada',
        'Precisamos de permissão para acessar suas fotos.'
      );
    }
    return;
  }

  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  } catch (error) {
    console.log('Error picking image: ', error);
  }
};



  // Reúne os dados e fecha o modal
  async function handleSave () {
    console.log('rodando');
    const updObj = {
      nome : name ?? '',
      surname : surname ?? '',
      desc : description ?? '',
      isOrganizer : isOrganizerMode ?? false,
      profileImage : imageUri ?? ''
    };

     try {
      const userRef = doc(db, 'user', userData?.userInfo?.uid);
      console.log(userData?.userInfo?.userId);
      await updateDoc(userRef, updObj);
      console.log('Dados atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
    }

    // Exemplo: enviar para a API ou salvar localmente
    // await api.updateProfile(profileData);
    // ou AsyncStorage.setItem('@profile', JSON.stringify(profileData));

    // Se quiser notificar o componente pai:
    // if (onSave) {
    //   onSave(profileData);
    // }

    // Fecha o modal
    setModalVisible(false);
  };

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.background}>
          {/* --- Header --- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={24} color="black" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Customizar perfil</Text>
          </View>

          {/* --- Upload de Foto --- */}
          <View style={styles.profilePicContainer}>
            <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              )}
            </TouchableOpacity>
          </View>

          {/* --- Campos de Texto --- */}
          <Text style={styles.label}>Nome</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
          />

          <Text style={styles.label}>Sobrenome</Text>
          <TextInput
            style={styles.input}
            value={surname}
            onChangeText={setSurname}
            placeholder="Digite seu sobrenome"
          />

          <Text style={styles.label}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Fale um pouco sobre você..."
            multiline
          />

          {/* --- Switch --- */}
          <View style={styles.switchContainer}>
            <Switch
              value={isOrganizerMode}
              onValueChange={setIsOrganizerMode}
              thumbColor={isOrganizerMode ? '#3f64c7' : '#f4f3f4'}
              trackColor={{ false: '#767577', true: '#81b0ff' }}
            />
            <Text style={styles.switchLabel}>modo organizador</Text>
          </View>

          {/* --- Botões Extras --- */}
          <TouchableOpacity
            style={[styles.button, styles.paymentButton]}
            onPress={() => navigation.navigate('Formapagamento')}
          >
            <Text style={styles.buttonText}>Formas de pagamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.verificationButton]}
            onPress={() => {
              /* lógica futura */
            }}
          >
            <Text style={styles.buttonText}>Verificação de identidade</Text>
          </TouchableOpacity>

          {/* --- Botão Salvar --- */}
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSave}
          >
            <Text style={styles.buttonText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  profilePicContainer: { alignItems: 'center', marginBottom: 20 },
  uploadButton: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#f0f0f0', justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 10, marginBottom: 15, backgroundColor: '#f5f5f5',
  },
  descriptionInput: { height: 80, textAlignVertical: 'top' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  switchLabel: { marginLeft: 10, fontSize: 14, color: '#333' },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  paymentButton: { backgroundColor: '#4CAF50' },
  verificationButton: { backgroundColor: '#3f64c7' },
  saveButton: { backgroundColor: '#28A745' }, // verde para Salvar
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default CustomizeProfile;
