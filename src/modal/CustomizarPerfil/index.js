import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Switch, Modal, Image, Alert, Linking, ScrollView, KeyboardAvoidingView,
  Platform
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
  onSave
}) => {
  const { organizerMode, toggleOrganizer } = useContext(appContext);
  const { userData, setUserData } = useAuth();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  
  const [name, setName] = useState(userData?.userInfo?.nome || "");
  const [surname, setSurname] = useState(userData?.userInfo?.surname || "");
  const [description, setDescription] = useState(userData?.userInfo?.desc || "");
  const [isOrganizerMode, setIsOrganizerMode] = useState(userData?.userInfo?.isOrganizer || false);
  const [imageUri, setImageUri] = useState(userData?.userInfo?.profileImage || null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userData?.userInfo) {
      setName(userData.userInfo.nome || "");
      setSurname(userData.userInfo.surname || "");
      setDescription(userData.userInfo.desc || "");
      setIsOrganizerMode(userData.userInfo.isOrganizer || false);
      setImageUri(userData.userInfo.profileImage || null);
    }
  }, [userData]);

  const pickImage = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
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
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error picking image: ', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem.');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à câmera.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Error taking photo: ', error);
      Alert.alert('Erro', 'Não foi possível tirar a foto.');
    }
  };

  const showImagePickerOptions = () => {
    Alert.alert(
      'Escolher foto de perfil',
      'Como você gostaria de adicionar uma foto?',
      [
        {
          text: 'Tirar foto',
          onPress: takePhoto,
        },
        {
          text: 'Escolher da galeria',
          onPress: pickImage,
        },
        {
          text: 'Cancelar',
          style: 'cancel',
        },
      ]
    );
  };

  async function handleSave() {
    if (isSaving) return;
    
    setIsSaving(true);
    
    const updObj = {
      nome: name?.trim() || '',
      surname: surname?.trim() || '',
      desc: description?.trim() || '',
      isOrganizer: isOrganizerMode || false,
      profileImage: imageUri || ''
    };

    try {
      const uid = userData?.uid || userData?.userInfo?.uid || null;
      if (!uid) {
        Alert.alert('Erro', 'Não foi possível identificar o usuário.');
        return;
      }
      
      const userRef = doc(db, 'user', uid);
      await updateDoc(userRef, updObj);
      
      setUserData((prev) => ({
        ...prev,
        userInfo: {
          ...prev?.userInfo,
          ...updObj,
        },
        isOrganizer: updObj.isOrganizer,
      }));
      
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
      setModalVisible(false);
      
    } catch (error) {
      console.error('Erro ao atualizar dados:', error);
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setIsSaving(false);
    }
  }

  const renderProfileImage = () => {
    if (imageUri) {
      return (
        <Image source={{ uri: imageUri }} style={styles.profileImage} />
      );
    } else {
      return (
        <View style={[styles.profileImagePlaceholder, { backgroundColor: theme?.background }]}>
          <Ionicons name="person" size={50} color={theme?.textTertiary} />
        </View>
      );
    }
  };

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <KeyboardAvoidingView 
        style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.container, { backgroundColor: theme?.backgroundSecondary }]}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setModalVisible(false)}
            >
              <Ionicons name="close" size={28} color={theme?.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
              Editar Perfil
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Seção Foto de Perfil */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Foto de Perfil
              </Text>
              <View style={styles.profileSection}>
                <View style={styles.imageContainer}>
                  {renderProfileImage()}
                  <TouchableOpacity 
                    style={[styles.editImageButton, { backgroundColor: theme?.primary }]}
                    onPress={showImagePickerOptions}
                  >
                    <Ionicons name="camera" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
                <View style={styles.imageButtons}>
                  <TouchableOpacity 
                    style={[styles.imageOptionButton, { backgroundColor: theme?.background, borderColor: theme?.border }]}
                    onPress={takePhoto}
                  >
                    <Ionicons name="camera-outline" size={20} color={theme?.primary} />
                    <Text style={[styles.imageOptionText, { color: theme?.textPrimary }]}>
                      Tirar foto
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.imageOptionButton, { backgroundColor: theme?.background, borderColor: theme?.border }]}
                    onPress={pickImage}
                  >
                    <Ionicons name="image-outline" size={20} color={theme?.primary} />
                    <Text style={[styles.imageOptionText, { color: theme?.textPrimary }]}>
                      Galeria
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Seção Informações Pessoais */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Informações Pessoais
              </Text>
              
              <View style={styles.nameRow}>
                <View style={styles.nameInputContainer}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Nome</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Seu nome"
                    placeholderTextColor={theme?.textTertiary}
                  />
                </View>
                
                <View style={styles.nameInputContainer}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Sobrenome</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                    value={surname}
                    onChangeText={setSurname}
                    placeholder="Seu sobrenome"
                    placeholderTextColor={theme?.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme?.textSecondary }]}>Bio</Text>
                <TextInput
                  style={[styles.textArea, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Conte um pouco sobre você..."
                  placeholderTextColor={theme?.textTertiary}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={200}
                />
                <Text style={[styles.charCount, { color: theme?.textTertiary }]}>
                  {description.length}/200
                </Text>
              </View>
            </View>

            {/* Seção Configurações */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Configurações
              </Text>
              
              <View style={[styles.switchContainer, { backgroundColor: theme?.background, borderColor: theme?.border }]}>
                <View style={styles.switchTextContainer}>
                  <Text style={[styles.switchLabel, { color: theme?.textPrimary }]}>
                    Modo Organizador
                  </Text>
                  <Text style={[styles.switchDescription, { color: theme?.textSecondary }]}>
                    Crie e gerencie seus próprios eventos
                  </Text>
                </View>
                <Switch
                  value={isOrganizerMode}
                  onValueChange={setIsOrganizerMode}
                  thumbColor={isOrganizerMode ? theme?.primary : '#f4f3f4'}
                  trackColor={{ false: '#767577', true: theme?.primary + '80' }}
                />
              </View>
            </View>

            {/* Seção Configurações de Conta */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Configurações de Conta
              </Text>
              
              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: theme?.background, borderColor: theme?.border }]}
                onPress={() => navigation.navigate('Formapagamento')}
              >
                <Ionicons name="card-outline" size={22} color={theme?.primary} />
                <Text style={[styles.menuButtonText, { color: theme?.textPrimary }]}>
                  Formas de Pagamento
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuButton, { backgroundColor: theme?.background, borderColor: theme?.border }]}
                onPress={() => navigation.navigate('VerificacaoIdentidade')}
              >
                <Ionicons name="shield-checkmark-outline" size={22} color={theme?.primary} />
                <Text style={[styles.menuButtonText, { color: theme?.textPrimary }]}>
                  Verificação de Identidade
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
              </TouchableOpacity>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              style={[
                styles.saveButton, 
                { 
                  backgroundColor: isSaving ? theme?.textTertiary : theme?.primary,
                  opacity: isSaving ? 0.7 : 1
                }
              ]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <Text style={[styles.saveButtonText, { color: theme?.textInverted }]}>
                  Salvando...
                </Text>
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={theme?.textInverted} />
                  <Text style={[styles.saveButtonText, { color: theme?.textInverted }]}>
                    Salvar Alterações
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileSection: {
    alignItems: 'center',
  },
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  imageOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
  },
  imageOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameInputContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  switchDescription: {
    fontSize: 14,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
  },
  menuButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 8,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomizeProfile;