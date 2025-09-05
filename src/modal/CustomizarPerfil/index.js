import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Switch, Modal, Image, Alert, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../../services/AuthContext';
import { db } from '../../../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { appContext } from '../../../App';
import { ThemeContext } from '../../context/ThemeContext';


const CustomizeProfile = ({
  modalVisible,
  setModalVisible,
  navigation,
  onSave  // callback opcional para enviar os dados pra fora
}) => {
  const { organizerMode, toggleOrganizer } = useContext(appContext);
  const {userData} = useAuth();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const [name, setName] = useState(userData?.userInfo?.nome || "");
  const [surname, setSurname] = useState(userData?.userInfo?.surname || "");
  const [description, setDescription] = useState(userData?.userInfo?.desc || "");
  const [isOrganizerMode, setIsOrganizerMode] = useState(userData?.userInfo?.isOrganizer || false);
  const [imageUri, setImageUri] = useState(null);
  
// console.log(userData?.userInfo);

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
    const updObj = {
      nome : name ?? '',
      surname : surname ?? '',
      desc : description ?? '',
      isOrganizer : isOrganizerMode ?? false,
      profileImage : imageUri ?? ''
    };

     try {
      // Use uid direto do contexto (userData.uid) se disponível. fallback para userInfo.uid ou null
      const uid = userData?.uid || userData?.userInfo?.uid || null;
      if (!uid) {
        console.error('UID do usuário indefinido. Não é possível atualizar o perfil. userData:', userData);
        return;
      }
      const userRef = doc(db, 'user', uid);
      await updateDoc(userRef, updObj);
      console.log('Dados atualizados com sucesso!');
      console.log("isOrganizer: " + userData?.isOrganizer);
      organizerMode();
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
      <View style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}>
        <View style={[styles.background, { backgroundColor: theme?.backgroundSecondary }]}>
          {/* --- Header --- */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={32} color={theme?.primary || "#f37100"} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme?.primary }]}>Customizar perfil</Text>
          </View>

          {/* --- Upload de Foto --- */}
          <View style={styles.profilePicContainer}>
            <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme?.backgroundDark }]} onPress={pickImage}>
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.profileImage} />
              ) : (
                <Ionicons name="cloud-upload-outline" size={30} color={theme?.primary || "#f37100"} />
              )}
            </TouchableOpacity>
          </View>

          {/* --- Campos de Texto --- */}
          <Text style={[styles.label, { color: theme?.textPrimary }]}>Nome</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme?.background, borderColor: theme?.primary, color: theme?.textPrimary }]}
            value={name}
            onChangeText={setName}
            placeholder="Digite seu nome"
            placeholderTextColor={theme?.textTertiary || "#a4a4a4"}
          />

          <Text style={[styles.label, { color: theme?.textPrimary }]}>Sobrenome</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme?.background, borderColor: theme?.primary, color: theme?.textPrimary }]}
            value={surname}
            onChangeText={setSurname}
            placeholder="Digite seu sobrenome"
            placeholderTextColor={theme?.textTertiary || "#a4a4a4"}
          />

          <Text style={[styles.label, { color: theme?.textPrimary }]}>Descrição</Text>
          <TextInput
            style={[styles.input, styles.descriptionInput, { backgroundColor: theme?.background, borderColor: theme?.primary, color: theme?.textPrimary }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Fale um pouco sobre você..."
            multiline
            placeholderTextColor={theme?.textTertiary || "#a4a4a4"}
          />

          {/* --- Switch --- */}
          <View style={styles.switchContainer}>
            <Switch
              value={isOrganizerMode}
              onValueChange={(value) => setIsOrganizerMode(value)}
              thumbColor={isOrganizerMode ? (theme?.primary || '#f37100') : '#000'}
              trackColor={{ false: '#767577', true: '#494949' }}
            />
            <Text style={[styles.switchLabel, { color: theme?.textSecondary }]}>Modo organizador</Text>
          </View>

          {/* --- Botões Extras --- */}
          <TouchableOpacity
            style={[styles.button, styles.paymentButton, { backgroundColor: theme?.backgroundDark, borderColor: theme?.primary }]}
            onPress={() => navigation.navigate('Formapagamento')}
          >
            <Text style={[styles.buttonText, { color: theme?.textPrimary }]}>Formas de pagamento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.verificationButton, { backgroundColor: theme?.backgroundDark, borderColor: theme?.primary }]}
            onPress={() => navigation.navigate('VerificacaoIdentidade')}
          >
            <Text style={[styles.buttonText, { color: theme?.textPrimary }]}>Verificação de identidade</Text>
          </TouchableOpacity>

          {/* --- Botão Salvar --- */}
          <TouchableOpacity
            style={[styles.button, styles.saveButton, { backgroundColor: theme?.primary, borderColor: theme?.primary }]}
            onPress={handleSave}
          >
            <Text style={[styles.buttonText, { color: theme?.textInverted }]}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '90%',
    borderRadius: 8,
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  profilePicContainer: { alignItems: 'center', marginBottom: 20 },
  uploadButton: {
    width: 100, height: 100, borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden',
  },
  profileImage: { width: '100%', height: '100%' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  input: {
    borderWidth: 1, borderRadius: 8,
    padding: 10, marginBottom: 15
  },
  descriptionInput: { height: 80, textAlignVertical: 'top' },
  switchContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  switchLabel: { marginLeft: 10, fontSize: 14 },
  button: { padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
  paymentButton: { borderWidth: 1 },
  verificationButton: { borderWidth: 1 },
  saveButton: { borderWidth: 1 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
});

export default CustomizeProfile;
