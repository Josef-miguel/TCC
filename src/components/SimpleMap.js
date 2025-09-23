import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SimpleMap = ({ 
  startCoordinate, 
  endCoordinate, 
  routeCoordinates = [], 
  height = 200,
  style = {},
  theme
}) => {
  const startLat = startCoordinate?.latitude || -23.55052;
  const startLng = startCoordinate?.longitude || -46.633308;
  const endLat = endCoordinate?.latitude;
  const endLng = endCoordinate?.longitude;

  return (
    <View style={[styles.container, { height, borderColor: theme?.border }, style]}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={20} color={theme?.primary || "#f37100"} />
        <Text style={[styles.title, { color: theme?.textPrimary }]}>Rota da Viagem</Text>
      </View>
      
      <View style={styles.content}>
        {startCoordinate && (
          <View style={styles.routeItem}>
            <View style={[styles.marker, { backgroundColor: 'green' }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.label, { color: theme?.textPrimary }]}>Início:</Text>
              <Text style={[styles.coordinates, { color: theme?.textSecondary }]}>
                {startLat.toFixed(6)}, {startLng.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
        
        {endCoordinate && (
          <View style={styles.routeItem}>
            <View style={[styles.marker, { backgroundColor: 'red' }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.label, { color: theme?.textPrimary }]}>Destino:</Text>
              <Text style={[styles.coordinates, { color: theme?.textSecondary }]}>
                {endLat.toFixed(6)}, {endLng.toFixed(6)}
              </Text>
            </View>
          </View>
        )}
        
        {routeCoordinates.length > 0 && (
          <View style={styles.routeItem}>
            <View style={[styles.marker, { backgroundColor: theme?.primary || "#f37100" }]} />
            <View style={styles.routeInfo}>
              <Text style={[styles.label, { color: theme?.textPrimary }]}>Rota:</Text>
              <Text style={[styles.coordinates, { color: theme?.textSecondary }]}>
                {routeCoordinates.length} pontos
              </Text>
            </View>
          </View>
        )}
        
        {!startCoordinate && !endCoordinate && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={40} color={theme?.textTertiary || "#aaa"} />
            <Text style={[styles.emptyText, { color: theme?.textTertiary || "#aaa" }]}>
              Nenhuma rota definida
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: '#f8f9fa',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  content: {
    padding: 12,
    flex: 1,
  },
  routeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  marker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  routeInfo: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  coordinates: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default SimpleMap;
