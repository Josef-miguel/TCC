import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // menu, search, perfil, estrela

export default function Home({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Quero ir para...."
        />
        <TouchableOpacity
          onPress={() => navigation.navigate("Perfil")}
        >
          <Ionicons name="person-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>
      {/* FIM DA BARRA SUPERIOR */}

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
    flexGrow: 1
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
  }
});
