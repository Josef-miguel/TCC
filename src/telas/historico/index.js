import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function historico() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton}>
          <Text style={styles.backText}>← Minhas viagens</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="gray" style={styles.searchIcon} />
        <TextInput
          placeholder="Buscar"
          style={styles.searchInput}
        />
      </View>

      <ScrollView style={styles.cardsContainer}>
        <View style={styles.card} />
        <View style={styles.card} />
        <View style={styles.card} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  header: {
    backgroundColor: '#b0ff9b',
    padding: 10,
  },
  backButton: {
    flexDirection: 'row',
  },
  backText: {
    fontSize: 16,
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    backgroundColor: '#eee',
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  cardsContainer: {
    marginHorizontal: 10,
  },
  card: {
    height: 50,
    backgroundColor: '#ddd',
    borderRadius: 6,
    marginTop: 10,
  },
});
