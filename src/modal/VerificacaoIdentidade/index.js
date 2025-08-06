import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  Modal, Image, Alert, Platform, Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../../../services/AuthContext';
import { db /*, storage */ } from '../../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const OrganizerVerificationModal = ({ modalVisible, setModalVisible }) => {
  const { userData } = useAuth();

  const [fullName, setFullName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [docImageUri, setDocImageUri] = useState(null);
  const [selfieUri, setSelfieUri] = useState(null);

  const [loading, setLoading] = useState(false);

  const validateCPF = (str) => {
    const cpfNumbers = str.replace(/\D/g, '');
    if (cpfNumbers.length !== 11) return false;
    return true;
  };

  const isAdult = (date) => {
    const today = new Date();
    const adultDate = new Date(date);
    adultDate.setFullYear(adultDate.getFullYear() + 18);
    return adultDate <= today;
  };

  const pickImage = async (setImage) => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Permissão necessária',
          'Você precisa permitir o acesso às fotos nas configurações do app.',
          [{ text: 'Cancelar', style: 'cancel' }, { text: 'Abrir configurações', onPress: () => Linking.openSettings() }]
        );
      } else {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
      }
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.5,
      });
      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.log('Erro ao escolher imagem: ', error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) setBirthDate(selectedDate);
  };

  const handleSubmit = async () => {
    if (!fullName.trim()) return Alert.alert('Erro', 'Informe seu nome completo.');
    if (!validateCPF(cpf)) return Alert.alert('Erro', 'CPF inválido. Digite 11 números.');
    if (!isAdult(birthDate)) return Alert.alert('Erro', 'Você precisa ter 18 anos ou mais.');

    if (!docImageUri) return Alert.alert('Erro', 'Envie a foto do documento.');
    if (!selfieUri) return Alert.alert('Erro', 'Envie uma selfie.');

    setLoading(true);

    try {
      /*
      // Upload das imagens para Storage (COMENTADO POR ENQUANTO)
      const docRef = ref(storage, `verifications/${userData?.userInfo?.uid}/document.jpg`);
      const selfieRef = ref(storage, `verifications/${userData?.userInfo?.uid}/selfie.jpg`);

      const uriToBlob = async (uri) => {
        const response = await fetch(uri);
        const blob = await response.blob();
        return blob;
      };

      const docBlob = await uriToBlob(docImageUri);
      const selfieBlob = await uriToBlob(selfieUri);

      await uploadBytes(docRef, docBlob);
      await uploadBytes(selfieRef, selfieBlob);

      const docUrl = await getDownloadURL(docRef);
      const selfieUrl = await getDownloadURL(selfieRef);
      */

      // Salvando só dados no Firestore, sem URLs de imagem
      await setDoc(doc(db, 'verifications', userData?.userInfo?.uid), {
        fullName: fullName.trim(),
        cpf: cpf.replace(/\D/g, ''),
        birthDate: birthDate.toISOString().split('T')[0],
        status: 'pending',
        createdAt: serverTimestamp(),
        // docImageUrl: docUrl,  <-- não usado ainda
        // selfieUrl: selfieUrl, <-- não usado ainda
      });

      Alert.alert('Sucesso', 'Solicitação enviada! Aguarde aprovação.');
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao enviar verificação:', error);
      Alert.alert('Erro', 'Não foi possível enviar a solicitação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (!modalVisible) return null;

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
    <View style={{ flex: 1, backgroundColor: '#2B2C33', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}></View>
      <View style={styles.modalOverlay}>
        <View style={styles.background}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="arrow-back" size={32} color="#f37100" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Tornar-se Organizador</Text>
          </View>

          <Text style={styles.label}>Nome completo</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome completo"
            placeholderTextColor="#a4a4a4"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={styles.label}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu CPF"
            placeholderTextColor="#a4a4a4"
            keyboardType="numeric"
            maxLength={14}
            value={cpf}
            onChangeText={(text) => {
              let clean = text.replace(/\D/g, '');
              let formatted = clean;
              if (clean.length > 3 && clean.length <= 6) formatted = `${clean.slice(0,3)}.${clean.slice(3)}`;
              else if (clean.length > 6 && clean.length <= 9) formatted = `${clean.slice(0,3)}.${clean.slice(3,6)}.${clean.slice(6)}`;
              else if (clean.length > 9) formatted = `${clean.slice(0,3)}.${clean.slice(3,6)}.${clean.slice(6,9)}-${clean.slice(9,11)}`;
              setCpf(formatted);
            }}
          />

          <Text style={styles.label}>Data de nascimento</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
            <Text style={{ color: birthDate ? '#fff' : '#a4a4a4' }}>
              {birthDate ? birthDate.toLocaleDateString() : 'Selecione a data'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <Text style={styles.label}>Foto do documento</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setDocImageUri)}>
            {docImageUri ? (
              <Image source={{ uri: docImageUri }} style={styles.uploadImage} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={40} color="#f37100" />
            )}
          </TouchableOpacity>

          <Text style={styles.label}>Selfie</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={() => pickImage(setSelfieUri)}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.uploadImage} />
            ) : (
              <Ionicons name="cloud-upload-outline" size={40} color="#f37100" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Enviando...' : 'Enviar solicitação'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};


const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  background: {
    width: '90%',
    backgroundColor: '#1a1b21',
    borderRadius: 8,
    padding: 20,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#f37100' },
  label: { fontSize: 14, fontWeight: 'bold', marginBottom: 6, color: '#e4e4e4' },
  input: {
    borderWidth: 1,
    borderColor: '#f37100',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    backgroundColor: '#2b2c33',
    color: '#fff',
  },
  uploadButton: {
    borderWidth: 1,
    borderColor: '#f37100',
    borderRadius: 8,
    height: 100,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2b2c33',
  },
  uploadImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#363942',
    borderWidth: 1,
    borderColor: '#f37100',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default OrganizerVerificationModal;
