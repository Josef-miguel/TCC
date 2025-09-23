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
  Button
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { appContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomizarPerfil from '../../modal/CustomizarPerfil';
import { useAuth } from '../../../services/AuthContext';
import Configuracoes from '../../modal/Configuracoes';
import { ThemeContext } from '../../context/ThemeContext';

export default function Perfil() {
  const { userData } = useAuth();
  const navigation = useNavigation();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [configModalVisible, setConfigModalVisible] = useState(false);

  const { organizerMode, toggleOrganizer } = useContext(appContext);

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme?.border }]} onPress={onPress}>
      <Icon name={icon} size={32} color={theme?.primary || "#f37100"} style={styles.icon} />
      <Text style={[styles.label, { color: theme?.textSecondary }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme?.background }]}>

        {/* Modal de sair */}
        <Modal visible={logoutVisible} transparent animationType="slide">
          <View style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}>
            <View style={[styles.modalContent, { backgroundColor: theme?.backgroundSecondary }]}>
              <Text style={[styles.modalText, { color: theme?.textPrimary }]}>Você realmente deseja sair?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.logoutText}>Sair</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLogoutVisible(false)}>
                <Text style={[styles.cancelText, { color: theme?.textPrimary }]}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Cabeçalho com avatar */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            {
              userData?.userInfo?.profileImage
                ? <Avatar.Image source={{ uri: userData.userInfo.profileImage }} size={128} style={[styles.avatar, { borderColor: theme?.primary }]} />
                : <Avatar.Text label="R" size={128} style={[styles.avatar, { borderColor: theme?.primary }]} />
            }
          </TouchableOpacity>
          <Text style={[styles.name, { color: theme?.textPrimary }]}>{userData?.userInfo?.nome}</Text>
        </View>

        {/* Menu */}
       
        <MenuItem icon="account-outline" label="Minha conta" onPress={() => setEditModalVisible(true)} />
        <MenuItem icon="cog" label="Configurações" onPress={() => setConfigModalVisible(true)} />

        {userData?.isOrganizer && (
          <MenuItem 
            icon="account-search-outline" 
            label="Avaliações" 
            onPress={() => navigation.navigate('Avaliacoes')} 
          />
        )}

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
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
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
  },
  modalContent: {
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
    textAlign: 'right'
  },
  cancelText: {
    marginTop: 10,
    textAlign: 'right',
  },
});
