import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { appContext } from '../../../App';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import CustomizarPerfil from '../../modal/CustomizarPerfil';



export default function Perfil() {
  const navigation = useNavigation();
  const [isVisible, setIsVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);


  const {organizerMode} = useContext(appContext);
  const {toggleOrganizer} = useContext(appContext);

  const toggleVisible = () => {
    if(isVisible){
      setIsVisible(false);
    }else{
      setIsVisible(true);
    }
  }

  

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={24} color="#333" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View>
    <ScrollView contentContainerStyle={styles.container}>
      <Modal visible={isVisible} transparent animationType="slide">
        <View style={{ flex:1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: "#FFF", padding: 20, borderRadius: 10 }}>
            <Text style={{ marginBottom: 20 }}>Você realmente deseja sair?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={{ color: 'red' }}>Sair</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleVisible}>
              <Text style={{ marginTop: 10 }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <Avatar.Text label="R" size={48} style={{ backgroundColor: '#f57c00' }} />
        <Text style={styles.name}>Ferrete Rafael</Text>
        <Text style={styles.level}>Genius Nível 1</Text>
      </View>

      <MenuItem icon="account-outline" label="Minha contas" onPress={() => {setModalVisible(true)}}/>
      <MenuItem icon="bell-outline" label="Preferências" onPress={() => {toggleOrganizer(), organizerMode()}}/>
      <MenuItem icon="account-search-outline" label="Avaliações" />
      <MenuItem icon="heart-outline" label="Favoritos" onPress={() => navigation.navigate('Favoritos')} />
      <MenuItem icon="logout" label="Sair" onPress={toggleVisible} />
    </ScrollView>
    <CustomizarPerfil modalVisible={modalVisible} setModalVisible={setModalVisible} navigation={navigation} ></CustomizarPerfil>
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  header: {
    marginTop: 10,
    marginBottom: 20,
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

});
