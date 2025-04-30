import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Switch, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const CustomizeProfile = ({ modalVisible, setModalVisible }) => {
  const [name, setName] = useState('Miguel');
  const [surname, setSurname] = useState('Jose Souza Guimarães');
  const [description, setDescription] = useState('Sou de Miracatu - SP e adoro viajar pelo Vale do Ribeira...');
  const [isOrganizerMode, setIsOrganizerMode] = useState(false);


  if(modalVisible){
      
      return (
        <Modal visible={modalVisible} transparent animationType='slide'>
          <View style={styles.modalOverlay}>
            <View style={styles.background}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity onPress={() => {setModalVisible(false)}}>
                  <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Customizar perfil</Text>
              </View>
        
              {/* Profile Picture Upload */}
              <View style={styles.profilePicContainer}>
                <TouchableOpacity style={styles.uploadButton}>
                  <Ionicons name="cloud-upload-outline" size={30} color="#888" />
                </TouchableOpacity>
              </View>
        
              {/* Nome (Name) */}
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Digite seu nome"
              />
        
              {/* Sobrenome (Surname) */}
              <Text style={styles.label}>Sobrenome</Text>
              <TextInput
                style={styles.input}
                value={surname}
                onChangeText={setSurname}
                placeholder="Digite seu sobrenome"
              />
        
              {/* Descrição (Description) */}
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                value={description}
                onChangeText={setDescription}
                placeholder="Fale um pouco sobre você..."
                multiline
                />
        
              {/* Modo Organizador (Organizer Mode) */}
              <View style={styles.switchContainer}>
                <Switch
                  value={isOrganizerMode}
                  onValueChange={setIsOrganizerMode}
                  thumbColor={isOrganizerMode ? '#3f64c7' : '#f4f3f4'}
                  trackColor={{ false: '#767577', true: '#81b0ff' }}
                  />
                <Text style={styles.switchLabel}>modo organizador</Text>
              </View>
        
              {/* Formas de Pagamento (Payment Methods) Button */}
              <TouchableOpacity
                style={[styles.button, styles.paymentButton]}
                onPress={() => navigation.navigate('formapagamento')}
                >
                <Text style={styles.buttonText}>Formas de pagamento</Text>
              </TouchableOpacity>
        
              {/* Verificação de Identidade (Identity Verification) Button */}
              <TouchableOpacity
                style={[styles.button, styles.verificationButton]}
                onPress={() => {
                  // Add navigation or logic for identity verification if needed
                }}
                >
                <Text style={styles.buttonText}>Verificação de identidade</Text>
              </TouchableOpacity>
            </View>
          
          </View>
        </Modal>
      );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    alignItems: 'center',
    justifyContent: 'center'
  },
  background: {
    minHeight: '90%',
    width: '90%',
    backgroundColor: '#FFF',
    borderRadius: 8,
    margin: 'auto',
    padding: 10
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    
  },
  header: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  profilePicContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#f5f5f5',
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  switchLabel: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  button: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  paymentButton: {
    backgroundColor: '#4CAF50', // Green color
  },
  verificationButton: {
    backgroundColor: '#3f64c7', // Blue color matching your app's theme
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CustomizeProfile;