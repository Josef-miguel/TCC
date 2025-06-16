import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { appContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomizarPerfil from '../../modal/CustomizarPerfil';

import { useAuth } from '../../../services/AuthContext';

// Componente de tela de perfil do usuário
export default function Perfil() {
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
      <Icon name={icon} size={24} color="#333" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );




  return (
    <View style={{ flex: 1 }}>
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

            <Avatar.Text label="R" size={48} style={styles.avatar} />
          </TouchableOpacity>
          <Text style={styles.name}>Ferrete Rafael</Text>
          <Text style={styles.level}>Genius Nível 1</Text>
        </View>

        {/* Itens de menu: Chamadas de navegação e ações */}
        <MenuItem
          icon="account-outline"
          label="Minha contas"
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
          label="Favoritos"
          onPress={() => navigation.navigate('Favoritos')} // Navega para tela de favoritos
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
    </View>
  );
}

// Estilos para Perfil.js
const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#f57c00', 
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
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
  },
  icon: {
    marginRight: 12,
  },
  label: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalText: {
    marginBottom: 20,
    fontSize: 16,
  },
  logoutText: {
    color: 'red',
    fontWeight: 'bold',
  },
  cancelText: {
    marginTop: 10,
    textAlign: 'right',
  },
});

