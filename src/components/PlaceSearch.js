import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const PlaceSearch = ({ 
  onPlaceSelect, 
  placeholder = "Buscar lugar...", 
  theme = {},
  style = {} 
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [usingFallback, setUsingFallback] = useState(false);

  // Função para buscar lugares usando MapBox Geocoding (alternativa)
  const searchPlacesWithMapBox = async (query) => {
    try {
      const mapboxToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw';
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        {
          params: {
            access_token: mapboxToken,
            country: 'BR', // Limitar ao Brasil
            limit: 10,
            types: 'place,locality,neighborhood,address,poi'
          },
          timeout: 5000
        }
      );

      const places = response.data.features.map(place => ({
        id: place.id,
        name: place.place_name,
        latitude: place.center[1],
        longitude: place.center[0],
        type: place.place_type?.[0] || 'place',
        address: place.place_name
      }));

      return places;
    } catch (error) {
      console.log('Erro MapBox:', error.message);
      throw error;
    }
  };

  // Função para buscar lugares usando Nominatim (OpenStreetMap) - fallback
  const searchPlacesWithNominatim = async (query) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: query,
            format: 'json',
            limit: 10,
            addressdetails: 1,
            countrycodes: 'br',
            viewbox: '-74.0,-34.0,-34.0,5.0',
            bounded: 1
          },
          timeout: 5000,
          headers: {
            'User-Agent': 'JSG-TCC-App/1.0'
          }
        }
      );

      const places = response.data.map(place => ({
        id: place.place_id,
        name: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        type: place.type,
        address: place.address
      }));

      return places;
    } catch (error) {
      console.log('Erro Nominatim:', error.message);
      throw error;
    }
  };

  // Função principal para buscar lugares
  const searchPlaces = async (query) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setUsingFallback(false);
      return;
    }

    setIsLoading(true);
    setUsingFallback(false);
    
    try {
      // Tentar MapBox primeiro (mais confiável)
      console.log('Buscando lugares com MapBox...');
      const places = await searchPlacesWithMapBox(query);
      setSearchResults(places);
    } catch (mapboxError) {
      console.log('MapBox falhou, tentando Nominatim...');
      
      try {
        // Fallback para Nominatim
        const places = await searchPlacesWithNominatim(query);
        setSearchResults(places);
      } catch (nominatimError) {
        console.log('Ambas APIs falharam:', nominatimError.message);
        
        // Fallback final: lugares sugeridos baseados na query
        const fallbackPlaces = generateFallbackPlaces(query);
        setSearchResults(fallbackPlaces);
        setUsingFallback(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para gerar lugares de fallback quando APIs falham
  const generateFallbackPlaces = (query) => {
    const commonPlaces = [
      { name: `${query} - Centro`, lat: -23.5505, lng: -46.6333 },
      { name: `${query} - Zona Sul`, lat: -23.6000, lng: -46.6500 },
      { name: `${query} - Zona Norte`, lat: -23.5000, lng: -46.6000 },
      { name: `${query} - Zona Oeste`, lat: -23.5500, lng: -46.7000 },
      { name: `${query} - Zona Leste`, lat: -23.5500, lng: -46.5500 }
    ];

    return commonPlaces.map((place, index) => ({
      id: `fallback_${index}`,
      name: place.name,
      latitude: place.lat,
      longitude: place.lng,
      type: 'fallback',
      address: place.name
    }));
  };

  // Debounce da busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchText.trim()) {
        searchPlaces(searchText);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  const handlePlaceSelect = (place) => {
    setSearchText(place.name);
    setShowResults(false);
    setSearchResults([]);
    onPlaceSelect(place);
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    setShowResults(false);
    setUsingFallback(false);
  };

  const renderPlaceItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.placeItem, { backgroundColor: theme?.backgroundSecondary || '#f5f5f5' }]}
      onPress={() => handlePlaceSelect(item)}
    >
      <View style={styles.placeIcon}>
        <Ionicons 
          name="location-outline" 
          size={20} 
          color={theme?.primary || '#007AFF'} 
        />
      </View>
      <View style={styles.placeInfo}>
        <Text 
          style={[styles.placeName, { color: theme?.textPrimary || '#000' }]}
          numberOfLines={1}
        >
          {item.name.split(',')[0]}
        </Text>
        <Text 
          style={[styles.placeAddress, { color: theme?.textSecondary || '#666' }]}
          numberOfLines={2}
        >
          {item.name}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.searchContainer, { 
        backgroundColor: theme?.background || '#fff',
        borderColor: theme?.border || '#ddd'
      }]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={theme?.textTertiary || '#999'} 
          style={styles.searchIcon}
        />
        
        <TextInput
          style={[styles.searchInput, { color: theme?.textPrimary || '#000' }]}
          placeholder={placeholder}
          placeholderTextColor={theme?.textTertiary || '#999'}
          value={searchText}
          onChangeText={setSearchText}
          onFocus={() => setShowResults(searchResults.length > 0)}
        />
        
        {isLoading && (
          <ActivityIndicator 
            size="small" 
            color={theme?.primary || '#007AFF'} 
            style={styles.loadingIcon}
          />
        )}
        
        {searchText.length > 0 && !isLoading && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
            <Ionicons 
              name="close-circle" 
              size={20} 
              color={theme?.textTertiary || '#999'} 
            />
          </TouchableOpacity>
        )}
      </View>

      {showResults && searchResults.length > 0 && (
        <View style={[styles.resultsContainer, { 
          backgroundColor: theme?.background || '#fff',
          borderColor: theme?.border || '#ddd'
        }]}>
          {usingFallback && (
            <View style={[styles.fallbackWarning, { backgroundColor: theme?.warning || '#fff3cd' }]}>
              <Ionicons name="warning-outline" size={16} color={theme?.warningText || '#856404'} />
              <Text style={[styles.fallbackText, { color: theme?.warningText || '#856404' }]}>
                Busca offline - selecione uma região aproximada
              </Text>
            </View>
          )}
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPlaceItem}
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
            maxToRenderPerBatch={5}
            windowSize={10}
          />
        </View>
      )}

      {showResults && searchResults.length === 0 && searchText.length >= 3 && !isLoading && (
        <View style={[styles.noResults, { backgroundColor: theme?.background || '#fff' }]}>
          <Ionicons 
            name="search-outline" 
            size={32} 
            color={theme?.textTertiary || '#999'} 
          />
          <Text style={[styles.noResultsText, { color: theme?.textTertiary || '#999' }]}>
            Nenhum lugar encontrado
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 4,
  },
  loadingIcon: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  resultsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
    zIndex: 1001,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  resultsList: {
    maxHeight: 200,
  },
  placeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  placeIcon: {
    marginRight: 12,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 14,
    lineHeight: 18,
  },
  noResults: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    zIndex: 1001,
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
  },
  fallbackWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    gap: 8,
  },
  fallbackText: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
});

export default PlaceSearch;
