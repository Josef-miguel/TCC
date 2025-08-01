// Perfil.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { appContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomizarPerfil from '../../modal/CustomizarPerfil';
import { useAuth } from '../../../services/AuthContext';
import Configuracoes from '../../modal/Configuracoes';

export default function Perfil() {
  const { userData } = useAuth();
  const navigation = useNavigation();

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const { organizerMode, toggleOrganizer } = useContext(appContext);

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={32} color="#f37100" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Modal de sair */}
        <Modal visible={logoutVisible} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalText}>Você realmente deseja sair?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLogoutVisible(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Cabeçalho com avatar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            {
              userData?.userInfo?.profileImage
                ? <Avatar.Image source={{ uri: userData.userInfo.profileImage }} size={128} style={styles.avatar} />
                : <Avatar.Text label="R" size={128} style={styles.avatar} />
            }
          </TouchableOpacity>
          <Text style={styles.name}>{userData?.userInfo?.nome}</Text>
        </View>

        {/* Menu */}
        <MenuItem icon="account-outline" label="Minha conta" onPress={() => setEditModalVisible(true)} />
        <MenuItem icon="cog" label="Configurações" onPress={() => setConfigModalVisible(true)} />
        <MenuItem icon="account-search-outline" label="Avaliações" onPress={() => {}} />
        <MenuItem icon="heart-outline" label="Minhas Viagens" onPress={() => navigation.navigate('MinhasViagens')} />
        <MenuItem icon="logout" label="Sair" onPress={() => setLogoutVisible(true)} />
      </ScrollView>

      {/* Modal de editar perfil */}
      <CustomizarPerfil
        modalVisible={editModalVisible}
        setModalVisible={setEditModalVisible}
        navigation={navigation}
      />

      {/* Modal de configurações */}
      <Configuracoes
        modalVisible={configModalVisible}
        setModalVisible={setConfigModalVisible}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#1a1b21',
    flexGrow: 1,
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
