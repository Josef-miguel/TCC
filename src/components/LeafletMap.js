import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import SimpleMap from './SimpleMap';
import axios from 'axios';

const LeafletMap = ({ 
  startCoordinate, 
  endCoordinate, 
  routeCoordinates = [], 
  height = 200,
  style = {},
  onRouteCalculated = null // Callback para quando a rota for calculada
}) => {
  const webViewRef = useRef(null);
  const [mapHtml, setMapHtml] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState(routeCoordinates);

  // Função para calcular rota usando OpenRouteService (apenas início e fim)
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

      // Pegar apenas o primeiro e último ponto da rota
      const allCoords = response.data.features[0].geometry.coordinates;
      const simplifiedRoute = [
        {
          latitude: allCoords[0][1], // Primeiro ponto (latitude)
          longitude: allCoords[0][0] // Primeiro ponto (longitude)
        },
        {
          latitude: allCoords[allCoords.length - 1][1], // Último ponto (latitude)
          longitude: allCoords[allCoords.length - 1][0] // Último ponto (longitude)
        }
      ];

      setCalculatedRoute(simplifiedRoute);
      
      // Notificar componente pai se callback foi fornecido
      if (onRouteCalculated) {
        onRouteCalculated(simplifiedRoute);
      }

      return simplifiedRoute;
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
    const routeCoords = (calculatedRoute.length > 0 ? calculatedRoute : routeCoordinates).map(coord => [coord.latitude, coord.longitude]);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Mapa</title>
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
            // Aguardar o DOM estar pronto
            document.addEventListener('DOMContentLoaded', function() {
              try {
                // Inicializar o mapa
                const map = L.map('map', {
                  zoomControl: true,
                  dragging: true,
                  touchZoom: true,
                  doubleClickZoom: true,
                  scrollWheelZoom: true,
                  boxZoom: true,
                  keyboard: true
                }).setView([${startLat}, ${startLng}], 10);
                
                // Adicionar camada de tiles do OpenStreetMap
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                  attribution: '© OpenStreetMap contributors',
                  maxZoom: 19
                }).addTo(map);
                
                // Aguardar o mapa carregar
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
                  
                  // Adicionar rota se existir
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
                  
                  // Adicionar evento de clique no mapa para calcular rota
                  map.on('click', function(e) {
                    const lat = e.latlng.lat;
                    const lng = e.latlng.lng;
                    
                    // Enviar coordenadas para o React Native
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'mapClick',
                      latitude: lat,
                      longitude: lng
                    }));
                  });
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
  }, [startCoordinate, endCoordinate, routeCoordinates, calculatedRoute]);

  // Calcular rota automaticamente quando há início e fim
  useEffect(() => {
    if (startCoordinate && endCoordinate && calculatedRoute.length === 0) {
      calculateRoute(startCoordinate, endCoordinate);
    }
  }, [startCoordinate, endCoordinate]);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'mapClick') {
        // Se há início mas não fim, definir como fim
        if (startCoordinate && !endCoordinate) {
          const newEndCoord = { latitude: data.latitude, longitude: data.longitude };
          calculateRoute(startCoordinate, newEndCoord);
        }
        // Se não há início, definir como início
        else if (!startCoordinate) {
          const newStartCoord = { latitude: data.latitude, longitude: data.longitude };
          // Aguardar fim para calcular rota
        }
      }
    } catch (error) {
      console.log('Erro ao processar mensagem do WebView:', error);
    }
  };

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
        routeCoordinates={routeCoordinates}
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
        onMessage={handleMessage}
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

export default LeafletMap;
