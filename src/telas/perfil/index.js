import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Avatar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Perfil() {
  const navigation = useNavigation();

  const MenuItem = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={24} color="#333" style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
        <Icon name="close" size={24} color="#000" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Avatar.Text label="R" size={48} style={{ backgroundColor: '#f57c00' }} />
        <Text style={styles.name}>Ferrete Rafael</Text>
        <Text style={styles.level}>Genius Nível 1</Text>
      </View>

      <MenuItem icon="account-outline" label="Minha conta" />
      <MenuItem icon="briefcase-outline" label="Reservas e Viagens" />
      <MenuItem icon="google" label="Programa de fidelidade Genius" />
      <MenuItem icon="wallet-outline" label="Recompensas e Wallet" />
      <MenuItem icon="account-search-outline" label="Avaliações" />
      <MenuItem icon="heart-outline" label="Favoritos" />
      <MenuItem icon="logout" label="Sair" onPress={() => navigation.navigate('Login')} />
    </ScrollView>
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
