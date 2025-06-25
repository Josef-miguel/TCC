import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, SafeAreaView } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { appContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomizarPerfil from '../../modal/CustomizarPerfil';

import { useAuth } from '../../../services/AuthContext';

// Componente de tela de perfil do usuário
export default function Perfil() {
  const {userData} = useAuth();

  const navigation = useNavigation();
  // Controle de visibilidade do modal de confirmação de saída
  const [isVisible, setIsVisible] = useState(false);
  // Controle de visibilidade do modal de customização de perfil
  const [modalVisible, setModalVisible] = useState(false);

  // Contexto global para modo organizador
  const { organizerMode, toggleOrganizer } = useContext(appContext);

  // Alterna visibilidade do modal de confirmação de logout
  const toggleVisible = () => {
    setIsVisible(prev => !prev);
  };

  // Componente interno para itens de menu
  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={32} color="#f37100" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );




  return (
    <SafeAreaView style={styles.container}>
      {/* ScrollView para lista de opções */}
      <ScrollView contentContainerStyle={styles.container}>

        {/* Modal de confirmação de logout */}
        <Modal visible={isVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Você realmente deseja sair?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={toggleVisible}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Cabeçalho com avatar e informações do usuário */}
        <View style={styles.header} >
          <TouchableOpacity onPress={() => setModalVisible(true)}>
            {
              userData?.userInfo?.profileImage
                ? <Avatar.Image source={{ uri: userData.userInfo.profileImage }} size={128} style={styles.avatar} />
                : <Avatar.Text label="R" size={128} style={styles.avatar} sx={{bgcolor: "#ff0"}} />
            }          
          </TouchableOpacity>
          <Text style={styles.name}>{userData?.userInfo?.nome}</Text>
       
        </View>

        {/* Itens de menu: Chamadas de navegação e ações */}
        <MenuItem
          icon="account-outline"
          label="Minha conta"
           // Abre modal de customização
        />
        <MenuItem
          icon="bell-outline"
          label="Preferências"
          onPress={() => {
            toggleOrganizer();      // Alterna modo organizador no contexto
            organizerMode();        // Executa callback de atualização
          }}
        />
        <MenuItem icon="account-search-outline" label="Avaliações" onPress={() => { /* implementar ação */ }} />
        <MenuItem
          icon="heart-outline"
          label="Minhas Viagens"
          onPress={() => navigation.navigate('MinhasViagens')} // Navega para tela de minhas viagens
        />
        <MenuItem
          icon="logout"
          label="Sair"
          onPress={toggleVisible} // Abre modal de confirmação
        />
      </ScrollView>

      {/* Modal customizado para edição de perfil */}
      <CustomizarPerfil
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        navigation={navigation}
      />
    </SafeAreaView>
  );
}

// Estilos para Perfil.js
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1b21',
    flexGrow: 1,
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
  header: {
    marginTop: 50,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#191919',
    borderWidth: 1,
    borderColor: "#f37100"
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    color: "#fff"
  },
  level: {
    color: '#888',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    color: "#e4e4e4"
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
    color: "#b9b9b9"
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#363942',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalText: {
    marginBottom: 20,
    fontSize: 16,
    color: "#fff"
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
    textAlign: 'right'
  },
  cancelText: {
    marginTop: 10,
    textAlign: 'right',
    color: "#FFF"
  },
});

