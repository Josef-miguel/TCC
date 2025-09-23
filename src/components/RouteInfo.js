import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RouteInfo = ({ 
  routeCoordinates = [], 
  startCoordinate, 
  endCoordinate, 
  theme 
}) => {
  if (!routeCoordinates || routeCoordinates.length === 0) {
    return null;
  }

  // Calcular distância aproximada (em linha reta para simplificar)
  const calculateDistance = (coord1, coord2) => {
    if (!coord1 || !coord2) return 0;
    
    const R = 6371; // Raio da Terra em km
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(coord1.latitude * Math.PI / 180) * Math.cos(coord2.latitude * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
  };

  const distance = calculateDistance(startCoordinate, endCoordinate);
  const pointCount = routeCoordinates.length;

  return (
    <View style={[styles.container, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}>
      <View style={styles.header}>
        <Ionicons name="map-outline" size={16} color={theme?.primary || "#f37100"} />
        <Text style={[styles.title, { color: theme?.textPrimary }]}>Informações da Rota</Text>
      </View>
      
      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <Ionicons name="location-outline" size={14} color={theme?.textSecondary} />
          <Text style={[styles.infoText, { color: theme?.textSecondary }]}>
            {pointCount === 2 ? 'Rota direta' : `${pointCount} pontos`}
          </Text>
        </View>
        
        <View style={styles.infoItem}>
          <Ionicons name="speedometer-outline" size={14} color={theme?.textSecondary} />
          <Text style={[styles.infoText, { color: theme?.textSecondary }]}>
            {distance.toFixed(1)} km
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 6,
    borderWidth: 1,
    padding: 8,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 11,
    marginLeft: 4,
  },
});

export default RouteInfo;
