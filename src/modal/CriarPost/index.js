// miguel isack tentou arrumar em casa pelo web, mas ainda não sei se está a funcionar. Caso tenha erro, volte a versão anterior

import { useState, useContext } from "react";
import { Text, TextInput, Modal, View, TouchableOpacity, ScrollView, StyleSheet, Image, Linking, Alert } from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showMessage } from 'react-native-flash-message';

import { Feather } from '@expo/vector-icons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import axios from 'axios';


import { collection, addDoc } from "firebase/firestore";
import {db} from '../../../services/firebase'
import { getAuth } from 'firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';


const CreatePost = ({ modalVisible, setModalVisible }) => {
  const { theme } = useContext(ThemeContext);
  
  const [postName, setPostName] = useState('');
  const [tripType, setTripType] = useState(1);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState([]);
  const [tripPrice, setTripPrice] = useState(0);
  const [numSlots, setNumSlots] = useState(0);
  const [exit_date, setExitDate] = useState(new Date());
  const [return_date, setReturnDate] = useState(new Date());
  const [searchText, setSearchText] = useState("");
  
  const [showExitDate, setShowExitDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);

  const [mapRegion, setMapRegion] = useState({
  latitude: -23.55052,
  longitude: -46.633308,
  latitudeDelta: 0.1,
  longitudeDelta: 0.1,
});

const [mapMarker, setMapMarker] = useState(null);

  const [mapStart, setMapStart] = useState(null);
  const [mapEnd, setMapEnd] = useState(null);
  const [MapDisplayName, setMapDisplayName] = useState([]);
  const [routeCoords, setRouteCoords] = useState([]);


  function limparCampos(){
    setPostName("");
    setTripType(1);
    setDescription("");
    setImageUri([]);
    setTripPrice(0);
    setNumSlots(0);
    setMapStart(null);
    setMapEnd(null);
    setRouteCoords([]);
  }

  async function saveData() {

    if (!postName || !tripType || !description || imageUri.length === 0 || tripPrice <= 0 || numSlots <= 0) {
      showMessage({
        message: "Erro ao Salvar",
        description: 'Preencha os Campos Obrigatórios!',
        type: "warning",
      });
      return;
    }

    console.log("tentar");

    try {
  const auth = getAuth();
  const uid = auth.currentUser?.uid || null;

  await addDoc(collection(db, 'events', ), {
        title: postName || '',
        desc: description || '',
        type: tripType || '',
        images: imageUri || [],
        numSlots: Number(numSlots) || 0,
        price: Number(tripPrice) || 0,
        exit_date: exit_date || '',
        return_date: return_date || '',
        route: {
          start: mapStart,
          end: mapEnd,
          coordinates: routeCoords,
          display_start: MapDisplayName[0],
          display_end: MapDisplayName[1]
        }

  ,
  uid: uid,
  createdAt: new Date().toISOString(),

      });

      showMessage({
        message: "Criação de post bem-Sucedida",
        description: "Bem-vindo!",
        type: "success",
        duration: 1800,
      });
      setModalVisible(false);
      limparCampos();
    } catch (error) {
      showMessage({
        message: "Ocorreu algum erro: " + error,
        description: "erro",
        type: 'warning',
        duration: 2000
      });
      console.log(error);
    }

    console.log("rodando");

  if (!postName || !tripType || !description || imageUri.length === 0 || tripPrice <= 0 || numSlots <= 0) {
    showMessage({
      message: "Erro ao Salvar",
      description: 'Preencha os Campos Obrigatórios!',
      type: "warning",
    });
    return;

  }

  try {
    // cria o documento no Firestore
    const docRef = await addDoc(collection(db, 'events'), {
      title: postName || '',
      desc: description || '',
      type: tripType || '',
      images: imageUri || [],
      numSlots: Number(numSlots) || 0,
      price: Number(tripPrice) || 0,
      exit_date: exit_date || '',
      return_date: return_date || '',
      route: {
        start: mapStart,
        end: mapEnd,
        coordinates: routeCoords,
        display_start: MapDisplayName[0],
        display_end: MapDisplayName[1]
      }
    });

    // adiciona o próprio id dentro do documento
    await setDoc(docRef, { id: docRef.id }, { merge: true });

    showMessage({
      message: "Criação de post bem-sucedida",
      description: "Bem-vindo!",
      type: "success",
      duration: 1800,
    });

    setModalVisible(false);
    limparCampos();
  } catch (error) {
    showMessage({
      message: "Ocorreu algum erro: " + error,
      description: "erro",
      type: 'warning',
      duration: 2000
    });
    console.log(error);
  }
}



  const pickImage = async () => {
    const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      if (!canAskAgain) {
        Alert.alert(
          'Permissão necessária',
          'Você precisa permitir o acesso às fotos nas configurações do app.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert('Permissão negada', 'Precisamos de permissão para acessar suas fotos.');
      }
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      // console.log('Resultado da imagem:', result);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImage = result.assets[0].uri;
        setImageUri(prevUris => [...prevUris, newImage]);
      }
      console.log(imageUri);
    } catch (error) {
      console.log('Error picking image: ', error);
    }
  };

const handleSearch = async () => {
  console.log("Buscando por" + searchText + "...");
  showMessage({
        message: "Pesquisando...",
        description: "Buscando por: " + searchText + "...",
        type: "notice",
        duration: 2000,
      });
  const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${searchText}`,
  {
    headers: {
      'User-Agent': 'JSG/1.0 (jubscrebis@gmail.com)' // ou outro seu
    }
  }
);
  const results = await response.json();
  if (results.length > 0) {
    const { lat, lon } = results[0];
    setMapRegion({
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setMapMarker({
      latitude: parseFloat(lat),
      longitude: parseFloat(lon),
    });
  }
};

const handleMapPress = (e) => {
  const { latitude, longitude } = e.nativeEvent.coordinate;

  if (!mapStart) {
    setMapStart({ latitude, longitude });
  } else if (!mapEnd) {
    const endCoord = { latitude, longitude };
    setMapEnd(endCoord);
    getRouteFromAPI(mapStart, endCoord);
  }
};

    // FUNÇÃO PARA TRAÇAR A ROTA
  const getRouteFromAPI = async (startCoord, endCoord) => {
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

      const coords = response.data.features[0].geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      }));

      setRouteCoords(coords);

      // Geocodifica início e fim da rota
      const first = coords[0];
      const last = coords[coords.length - 1];

      reverseGeocode(first.latitude, first.longitude);
      reverseGeocode(last.latitude, last.longitude);

      
    } catch (error) {
      console.log('Erro ao traçar rota:', error);
      showMessage({
        message: 'Erro ao traçar rota',
        description: 'Verifique sua conexão ou chave da API.',
        type: 'danger',
      });
    }
    console.log(MapDisplayName);
  };


const reverseGeocode = async (latitude, longitude) => {
  try {
    
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse`,
      {
        params: {
          format: 'json',
          lat: latitude,
          lon: longitude,
        },
        headers: {
          'User-Agent': 'JSG/1.0 (jubscrebis@gmail.com)', 
        }
      }
    );

    const displayName = response.data.display_name;
    setMapDisplayName(prev => [...prev, displayName]);
    console.log('Endereço obtido:', displayName);
  } catch (error) {
    console.error('Erro na geocodificação reversa:', error);
  }
};



  return (
    <>
      {/* Modal que aparece ao acionar a criação de post */}
      <Modal
        animationType="slide"           // Animação de slide ao abrir/fechar
        transparent={true}               // Fundo semitransparente
        visible={modalVisible}           // Controla visibilidade via prop
        onRequestClose={() => setModalVisible(false)} // Fecha modal ao solicitar
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}>
          {/* ScrollView permite rolagem quando o conteúdo ultrapassa a tela */}
          <ScrollView contentContainerStyle={[styles.modalContent, { backgroundColor: theme?.backgroundSecondary }]}>

            {/* Cabeçalho do modal com botão de voltar e título */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {setModalVisible(false); limparCampos()}}>
                <Ionicons name="arrow-back" size={32} color={theme?.primary || "#f37100"} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme?.primary }]}>Criar post</Text>
            </View>

            {/* Placeholder para imagens do destino */}
            <View style={[styles.imagePlaceholder, { backgroundColor: theme?.backgroundDark }]}>
              
              <TouchableOpacity style={[styles.uploadButton, { backgroundColor: theme?.backgroundDark }]} onPress={pickImage}>
                {imageUri.length > 0 ? (
                  imageUri.map((uri, index) => (
                    <Image key={index} source={{ uri }} style={styles.profileImage} />
                  ))
                ) : (
                  <Ionicons name="cloud-upload-outline" size={30} color={theme?.primary || "#f37100"} />
                )}
              </TouchableOpacity>
            </View>

            {/* Input para nome do post */}
            <Text style={[styles.label, { color: theme?.textPrimary }]}>Nome do post</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme?.primary,
                color: theme?.textPrimary,
                backgroundColor: theme?.background
              }]}
              placeholder="Viagem para Miracatu, SP..."
              placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
              value={postName}
              onChangeText={setPostName}    // Atualiza estado postName
            />

      
            {/* Seleção de tipo de viagem */}
            <Text style={[styles.label, { color: theme?.textPrimary }]}>Tipo de viagem</Text>
            <View style={styles.tripTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  { borderColor: theme?.border },
                  tripType === 1 && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                ]}
                onPress={() => setTripType(1)}  // Marca 'Viagem'
              >
                <Text style={[
                  styles.tripTypeText,
                  { color: theme?.textPrimary },
                  tripType === 1 && { color: theme?.textInverted, fontWeight: 'bold' }
                ]}>
                  VIAGEM
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  { borderColor: theme?.border },
                  tripType === 3 && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                ]}
                onPress={() => setTripType(3)} // Marca 'Show'
              >
                <Text style={[
                  styles.tripTypeText,
                  { color: theme?.textPrimary },
                  tripType === 3 && { color: theme?.textInverted, fontWeight: 'bold' }
                ]}>
                  SHOW
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tripTypeButton,
                  { borderColor: theme?.border },
                  tripType === 2 && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                ]}
                onPress={() => setTripType(2)} // Marca 'Excursão'
              >
                <Text style={[
                  styles.tripTypeText,
                  { color: theme?.textPrimary },
                  tripType === 2 && { color: theme?.textInverted, fontWeight: 'bold' }
                ]}>
                  EXCURSÃO
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: theme?.textPrimary }]}>Data de saída</Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme?.background }]}>
                <Feather name="calendar" size={20} style={[styles.icon, { color: theme?.primary }]} />
                <TouchableOpacity
                  style={[styles.input, { 
                    borderColor: theme?.primary,
                    color: theme?.textPrimary,
                    backgroundColor: theme?.background
                  }]}
                  onPress={() => setShowExitDate(true)}
                  
                >
                  <Text style={{ color: theme?.textTertiary || '#a9a9a9', fontSize: 16 }}>
                    {exit_date.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              </View>

              {showExitDate && (
                <DateTimePicker
                  value={exit_date}
                  mode="date"
                  display="default"
                  style={styles.input}
                  onChange={(event, selectedDate) => {
                    setShowExitDate(false);
                    if (selectedDate) setExitDate(selectedDate);
                  }}
                />
              )}


            <Text style={[styles.label, { color: theme?.textPrimary }]}>Data de retorno</Text>
            <View style={[styles.inputWrapper, { backgroundColor: theme?.background }]}>
              <Feather name="calendar" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TouchableOpacity
                style={[styles.input, { 
                  borderColor: theme?.primary,
                  color: theme?.textPrimary,
                  backgroundColor: theme?.background
                }]}
                onPress={() => setShowReturnDate(true)}
              >
                <Text style={{ color: theme?.textTertiary || '#a9a9a9', fontSize: 16 }}>
                  {return_date.toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </View>

            {showReturnDate && (
              <DateTimePicker
                value={return_date}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowReturnDate(false);
                  if (selectedDate) setReturnDate(selectedDate);
                }}
              />
            )}



            {/* Input para quantidade de pessoas */}
            <Text style={[styles.label, { color: theme?.textPrimary }]}>Quantidade de pessoas</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme?.primary,
                color: theme?.textPrimary,
                backgroundColor: theme?.background
              }]}
              placeholder="Quantidade de pessoas"
              placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
              value={String(numSlots)}
              onChangeText={(t) => setNumSlots(Number(t) || 0)}
              keyboardType="numeric"          // Tipo numérico
            />
            {/* Input para o preço */}
            <Text style={[styles.label, { color: theme?.textPrimary }]}>Preço R$</Text>
            <TextInput
              style={[styles.input, { 
                borderColor: theme?.primary,
                color: theme?.textPrimary,
                backgroundColor: theme?.background
              }]}
              placeholder="R$00,00"
              placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
              value={String(tripPrice)}
              onChangeText={(t) => setTripPrice(Number(t) || 0)}
              keyboardType="numeric"          // Tipo numérico
            />

            {/* Input de descrição da viagem */}
            <Text style={[styles.label, { color: theme?.textPrimary }]}>Descrição da viagem</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput, { 
                borderColor: theme?.primary,
                color: theme?.textPrimary,
                backgroundColor: theme?.background
              }]}
              placeholder="Vamos nos divertir pela cidade!"
              placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
              value={description}
              onChangeText={setDescription}    // Atualiza estado description
              multiline                         // Permite múltiplas linhas
            />

            {/* Placeholder para mapa/trajeto da viagem */}
            {/* SUBSTITUA AQUI */}
            <View style={{ height: 200, marginBottom: 15, borderRadius: 8, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <TextInput
                  style={[styles.input, { 
                    flex: 1,
                    borderColor: theme?.primary,
                    color: theme?.textPrimary,
                    backgroundColor: theme?.background
                  }]}
                  placeholder="Buscar lugar..."
                  placeholderTextColor={theme?.textTertiary || "#a9a9a9"}
                  value={searchText}
                  onChangeText={setSearchText}
                />
                <TouchableOpacity onPress={handleSearch} style={{ marginLeft: 10 }}>
                  <Feather name="search" size={24} color={theme?.primary || "#f37100"} />
                </TouchableOpacity>
              </View>
              <MapView
                style={{ flex: 1 }}
                region={mapRegion}
                onPress={handleMapPress}
              >
              
                {mapStart && <Marker coordinate={mapStart} title="Início" pinColor="green" />}
                {mapEnd && <Marker coordinate={mapEnd} title="Destino" pinColor="red" />}
                {routeCoords.length > 0 && (
                  <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="blue" />
                )}
              </MapView>
            </View>
              
            {/* SUBISTITUA ACIMA */}
            {/* Texto de termos de uso com link */}
            <Text style={[styles.termsText, { color: theme?.textTertiary }]}>
              Ao criar uma publicação no aplicativo, você concorda com os{' '}
              <Text style={[styles.termsLink, { color: theme?.primary }]}>Termos de Uso e Política de Privacidade</Text>
              {' '}do JSG.
            </Text>

            {/* Botão para submeter/criar o post */}
            <TouchableOpacity style={[styles.submitButton, { 
              backgroundColor: theme?.primary,
              borderColor: theme?.primary
            }]} onPress={saveData}>
              <Text style={[styles.submitButtonText, { color: theme?.textInverted }]}>VIAJAR</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </>
  );
}

// Estilos do componente
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
  },
  modalContent: {
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    minHeight: '90%',                
  },
  modalHeader: {
    flexDirection: 'row',           
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  imagePlaceholder: {
    height: 100,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeholderText: {
    color: '#888',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',     
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tripTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tripTypeText: {
    fontSize: 12,
  },
  mapPlaceholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 15,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  profileImage: { 
    width: '100%',
    height: '100%' 
  },
   uploadButton: {
    width: '100%', height: '100%', 
    justifyContent: 'center',
    alignItems: 'center', overflow: 'hidden',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  icon: {
    marginRight: 10,
  },
});

export default CreatePost;