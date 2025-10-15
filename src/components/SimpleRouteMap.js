import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import SimpleMap from './SimpleMap';
import axios from 'axios';

const SimpleRouteMap = ({ 
  startCoordinate, 
  endCoordinate, 
  routeCoordinates = [],
  height = 200,
  style = {},
  onRouteCalculated = null
}) => {
  const webViewRef = useRef(null);
  const [mapHtml, setMapHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState([]);

  // Função para calcular rota usando OpenRouteService
  const calculateRoute = async (startCoord, endCoord) => {
    try {
      const response = await axios.post(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          coordinates: [
            [startCoord.longitude, startCoord.latitude],
            [endCoord.longitude, endCoord.latitude],
          ],
        },
        {
          headers: {
            Authorization: '5b3ce3597851110001cf6248391ebde1fc8d4266ab1f2b4264a64558',
            'Content-Type': 'application/json',
          },
        }
      );

      // Usar todas as coordenadas da rota para criar um traço contínuo
      const allCoords = response.data.features[0].geometry.coordinates;
      const fullRoute = allCoords.map(coord => ({
        latitude: coord[1],
        longitude: coord[0]
      }));

      setCalculatedRoute(fullRoute);
      
      // Notificar componente pai se callback foi fornecido
      if (onRouteCalculated) {
        onRouteCalculated(fullRoute);
      }

      return fullRoute;
    } catch (error) {
      console.log('Erro ao calcular rota:', error);
      // Em caso de erro, usar linha reta entre os pontos
      const fallbackRoute = [startCoord, endCoord];
      setCalculatedRoute(fallbackRoute);
      if (onRouteCalculated) {
        onRouteCalculated(fallbackRoute);
      }
      return fallbackRoute;
    }
  };

  const generateMapHTML = () => {
    const startLat = startCoordinate?.latitude || -23.55052;
    const startLng = startCoordinate?.longitude || -46.633308;
    const endLat = endCoordinate?.latitude;
    const endLng = endCoordinate?.longitude;

    // Usar coordenadas calculadas ou as fornecidas
    const routeCoords = (calculatedRoute.length > 0 ? calculatedRoute : []).map(coord => [coord.latitude, coord.longitude]);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Mapa Simples</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" 
                integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" 
                crossorigin=""/>
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
                  integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
                  crossorigin=""></script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { height: 100%; width: 100%; overflow: hidden; }
            #map { 
              height: 100%; 
              width: 100%; 
              position: absolute;
              top: 0;
              left: 0;
            }
            .loading {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              z-index: 1000;
              background: rgba(255,255,255,0.9);
              padding: 20px;
              border-radius: 8px;
              font-family: Arial, sans-serif;
            }
          </style>
        </head>
        <body>
          <div class="loading" id="loading">Carregando mapa...</div>
          <div id="map"></div>
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              try {
                const map = L.map('map', {
                  zoomControl: true,
                  dragging: true,
                  touchZoom: true,
                  doubleClickZoom: true,
                  scrollWheelZoom: true,
                  boxZoom: true,
                  keyboard: true
                }).setView([${startLat}, ${startLng}], 10);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors',
                  maxZoom: 19
                }).addTo(map);
                
                map.whenReady(function() {
                  document.getElementById('loading').style.display = 'none';
                  
                  // Adicionar marcador de início
                  const startMarker = L.marker([${startLat}, ${startLng}], {
                    icon: L.divIcon({
                      className: 'custom-div-icon',
                      html: '<div style="background-color: green; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                      iconSize: [20, 20],
                      iconAnchor: [10, 10]
                    })
                  }).addTo(map);
                  startMarker.bindPopup('Início');
                  
                  // Adicionar marcador de fim se existir
                  ${endLat && endLng ? `
                    const endMarker = L.marker([${endLat}, ${endLng}], {
                      icon: L.divIcon({
                        className: 'custom-div-icon',
                        html: '<div style="background-color: red; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
                        iconSize: [20, 20],
                        iconAnchor: [10, 10]
                      })
                    }).addTo(map);
                    endMarker.bindPopup('Destino');
                  ` : ''}
                  
                  // Adicionar rota contínua se existir
                  ${routeCoords.length > 0 ? `
                    const routeLine = L.polyline(${JSON.stringify(routeCoords)}, {
                      color: '#f37100',
                      weight: 4,
                      opacity: 0.8
                    }).addTo(map);
                    
                    // Ajustar o zoom para mostrar toda a rota
                    map.fitBounds(routeLine.getBounds());
                  ` : `
                    // Se não há rota, ajustar zoom para mostrar os marcadores
                    ${endLat && endLng ? `
                      const group = new L.featureGroup([startMarker, endMarker]);
                      map.fitBounds(group.getBounds().pad(0.1));
                    ` : ''}
                  `}
                });
                
              } catch (error) {
                console.error('Erro ao inicializar mapa:', error);
                document.getElementById('loading').innerHTML = 'Erro ao carregar mapa';
              }
            });
          </script>
        </body>
      </html>
    `;
  };

  useEffect(() => {
    setMapHtml(generateMapHTML());
  }, [startCoordinate, endCoordinate, calculatedRoute]);

  // Usar coordenadas fornecidas ou calcular rota automaticamente
  useEffect(() => {
    if (startCoordinate && endCoordinate) {
      // Se há coordenadas fornecidas, usar elas
      if (routeCoordinates && routeCoordinates.length > 0) {
        console.log('Usando coordenadas fornecidas:', routeCoordinates.length, 'pontos');
        setCalculatedRoute(routeCoordinates);
        if (onRouteCalculated) {
          onRouteCalculated(routeCoordinates);
        }
      } else if (calculatedRoute.length === 0) {
        // Se não há coordenadas fornecidas, calcular nova rota
        calculateRoute(startCoordinate, endCoordinate);
      }
    }
  }, [startCoordinate, endCoordinate, routeCoordinates]);

  const handleLoadEnd = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setUseFallback(true);
    console.log('Erro ao carregar WebView do mapa, usando fallback');
  };

  // Se deve usar fallback, renderizar SimpleMap
  if (useFallback) {
    return (
      <SimpleMap
        startCoordinate={startCoordinate}
        endCoordinate={endCoordinate}
        routeCoordinates={calculatedRoute.length > 0 ? calculatedRoute : (startCoordinate && endCoordinate ? [startCoordinate, endCoordinate] : [])}
        height={height}
        style={style}
        theme={{ primary: "#f37100", textPrimary: "#000", textSecondary: "#666", textTertiary: "#aaa", border: "#ddd" }}
      />
    );
  }

  return (
    <View style={[styles.container, { height }, style]}>
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f37100" />
        </View>
      )}
      <WebView
        ref={webViewRef}
        source={{ html: mapHtml }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        scrollEnabled={false}
        bounces={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        mixedContentMode="compatibility"
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

export default SimpleRouteMap;
