import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home({ navigation }) {
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const sidebarAnimation = useRef(new Animated.Value(-250)).current;

  const toggleSidebar = () => {
    if (sidebarVisible) {
      Animated.timing(sidebarAnimation, {
        toValue: -250,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(sidebarAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    setSidebarVisible(!sidebarVisible);
  };

  // Conteúdo da Sidebar
  const renderSidebar = () => (
    <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarAnimation }] }]}>
      <Text style={styles.sidebarTitle}>Menu</Text>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => {
        navigation.navigate('Home');
        toggleSidebar();
      }}>
        <Text>Home</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={() => {
        navigation.navigate('perfil');
        toggleSidebar();
      }}>
        <Text>Perfil</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sidebarItem} onPress={toggleSidebar}>
        <Text>Fechar</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={toggleSidebar}>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Quero ir para...."
        />
        <TouchableOpacity onPress={() => navigation.navigate('Perfil')}>
          <Ionicons name="person-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {/* FIM DA BARRA SUPERIOR */}

      {/* Sidebar */}
      {renderSidebar()}
      {/* Overlay quando sidebar está visível */}
      {sidebarVisible && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={toggleSidebar}
          activeOpacity={1}
        />
      )}

      {/* Lista de posts RECOMENDADOS */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {[
          { color: 'red', fav: false },
          { color: 'lime', fav: true },
          { color: 'dodgerblue', fav: false },
          { color: 'yellow', fav: false },
        ].map((item, index) => (
          <View key={index} style={[styles.post, { backgroundColor: item.color }]}>
            <TouchableOpacity style={styles.starIcon}>
              <Ionicons
                name={item.fav ? 'star' : 'star-outline'}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>
        ))}
        {/* FIM DA LISTA DE POSTS RECOMENDADOS */}

        {/* POSTS POPULARES */}
        <Text style={styles.popularesTxt}>Populares recentemente</Text>

        {[
          { color: 'purple', fav: true },
          { color: 'silver', fav: true },
          { color: 'orange', fav: false },
        ].map((item, index) => (
          <View key={index} style={[styles.post, { backgroundColor: item.color }]}>
            <TouchableOpacity style={styles.starIcon}>
              <Ionicons
                name={item.fav ? 'star' : 'star-outline'}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>
        ))}
        {/* FIM DA LISTA DE POSTS POPULARES */}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    backgroundColor: '#f2f2f2',
  },
  searchInput: {
    flex: 1,
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  scroll: {
    padding: 10,
    paddingBottom: 30,
    flexGrow: 1,
  },
  post: {
    height: 80,
    borderRadius: 6,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  starIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  popularesTxt: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 10,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: '100%',
    backgroundColor: '#f2f2f2',
    padding: 20,
    zIndex: 100,
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  sidebarItem: {
    paddingVertical: 10,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 99,
  },
});