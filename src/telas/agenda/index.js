import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const numRows = 6;
const numCols = 6;

// Define quais assentos estão com estrela (exemplo)
const starSeats = ['1-2', '1-3', '3-3']; // formato: "linha-coluna"

export default function Agenda() {
  const renderSeat = (row, col) => {
    const key = `${row}-${col}`;
    const isStar = starSeats.includes(key);

    return (
      <View key={key} style={styles.seat}>
        {isStar && <Ionicons name="star" size={20} color="purple" />}
      </View>
    );
  };

  const renderGrid = () => {
    const grid = [];

    for (let row = 0; row < numRows; row++) {
      const rowItems = [];
      for (let col = 0; col < numCols; col++) {
        rowItems.push(renderSeat(row, col));
      }
      grid.push(
        <View key={row} style={styles.row}>
          {rowItems}
        </View>
      );
    }

    return grid;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.gridContainer}>
        {renderGrid()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginBottom: 20,
  },
  backText: {
    fontSize: 20,
  },
  gridContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  seat: {
    width: 35,
    height: 35,
    borderWidth: 1,
    borderColor: '#999',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 1,
  },
});
