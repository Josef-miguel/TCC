import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Historico({ route, navigation }) {
  const favoritos = route.params?.favoritos || [];
  const [searchQuery, setSearchQuery] = useState('');

  const filtrados = favoritos.filter(item =>
    item.route.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.theme.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Minhas viagens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="gray" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.cardsContainer}>
        {filtrados.length === 0 ? (
          <Text style={{ marginTop: 20, textAlign: 'center' }}>Nenhuma viagem favoritada encontrada.</Text>
        ) : (
          filtrados.map(item => (
            <View key={item.id} style={styles.card}>
              <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.route}</Text>
                <Text style={styles.cardSubtitle}>{item.excursionInfo}</Text>
              </View>
              <Ionicons name="heart" size={22} color="red" style={styles.heartIcon} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 50 },
  header: { backgroundColor: '#b0ff9b', padding: 10 },
  backButton: { flexDirection: 'row' },
  backText: { fontSize: 16, color: '#000' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: { marginRight: 5 },
  searchInput: { flex: 1, height: 40 },
  cardsContainer: { marginHorizontal: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    marginTop: 10,
    padding: 10,
  },
  cardImage: { width: 60, height: 60, borderRadius: 6 },
  cardContent: { flex: 1, marginLeft: 10 },
  cardTitle: { fontWeight: 'bold', fontSize: 15 },
  cardSubtitle: { fontSize: 13, color: '#555' },
  heartIcon: { marginLeft: 5 },
});
