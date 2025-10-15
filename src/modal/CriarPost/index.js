import React, { useState, useContext } from "react";
import { 
  Text, 
  TextInput,
  Modal, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Image, 
  Linking, 
  Alert,
  Platform,
  KeyboardAvoidingView
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { showMessage } from 'react-native-flash-message';
import { StandardHeader, StandardInput, StandardButton, StandardCard } from '../../components/CommonComponents';
import { textStyles, spacing, borderRadius, shadows } from '../../styles/typography';

import SimpleRouteMap from '../../components/SimpleRouteMap';
import RouteInfo from '../../components/RouteInfo';
import PlaceSearch from '../../components/PlaceSearch';

import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import { db } from '../../../services/firebase'
import { getAuth } from 'firebase/auth';
import { ThemeContext } from '../../context/ThemeContext';

const CreatePost = ({ modalVisible, setModalVisible }) => {
  const { theme } = useContext(ThemeContext);
  
  const [postName, setPostName] = useState('');
  const [tripType, setTripType] = useState(1);
  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState([]);
  const [tripPrice, setTripPrice] = useState('');
  const [numSlots, setNumSlots] = useState('');
  const [exit_date, setExitDate] = useState(new Date());
  const [return_date, setReturnDate] = useState(new Date());
  
  const [showExitDate, setShowExitDate] = useState(false);
  const [showReturnDate, setShowReturnDate] = useState(false);

  const [mapStart, setMapStart] = useState(null);
  const [mapEnd, setMapEnd] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [selectedPlaceType, setSelectedPlaceType] = useState('start'); // 'start' ou 'end'

  const tripTypes = [
    { id: 1, label: 'VIAGEM', icon: 'airplane' },
    { id: 2, label: 'EXCURSÃO', icon: 'bus' },
    { id: 3, label: 'SHOW', icon: 'musical-notes' }
  ];

  function limparCampos() {
    setPostName("");
    setTripType(1);
    setDescription("");
    setImageUri([]);
    setTripPrice("");
    setNumSlots("");
    setMapStart(null);
    setMapEnd(null);
    setRouteCoords([]);
    setTags([]);
    setNewTag("");
    setSelectedPlaceType('start');
  }

  // Função para lidar com seleção de lugar
  const handlePlaceSelect = (place) => {
    const coordinate = {
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name.split(',')[0], // Nome simplificado
      fullAddress: place.name
    };

    if (selectedPlaceType === 'start') {
      setMapStart(coordinate);
    } else {
      setMapEnd(coordinate);
    }

    showMessage({
      message: "Local selecionado!",
      description: `${selectedPlaceType === 'start' ? 'Ponto de partida' : 'Destino'}: ${coordinate.name}`,
      type: "success",
      duration: 2000,
    });
  };

  // Funções para gerenciar tags
  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    if (!postName.trim()) {
      showMessage({ message: "Nome obrigatório", description: 'Digite um nome para a viagem', type: "warning" });
      return false;
    }
    if (!description.trim()) {
      showMessage({ message: "Descrição obrigatória", description: 'Digite uma descrição para a viagem', type: "warning" });
      return false;
    }
    if (imageUri.length === 0) {
      showMessage({ message: "Imagem obrigatória", description: 'Adicione pelo menos uma imagem', type: "warning" });
      return false;
    }
    if (!tripPrice || Number(tripPrice) <= 0) {
      showMessage({ message: "Preço inválido", description: 'Digite um preço válido', type: "warning" });
      return false;
    }
    if (!numSlots || Number(numSlots) <= 0) {
      showMessage({ message: "Vagas inválidas", description: 'Digite um número válido de vagas', type: "warning" });
      return false;
    }
    if (!mapStart || !mapEnd) {
      showMessage({ message: "Rota incompleta", description: 'Selecione o ponto de partida e destino no mapa', type: "warning" });
      return false;
    }
    return true;
  };

  async function saveData() {
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const auth = getAuth();
      const uid = auth.currentUser?.uid;

      if (!uid) {
        showMessage({ message: "Erro de autenticação", description: "Usuário não logado", type: "danger" });
        return;
      }

      const postData = {
        title: postName.trim(),
        desc: description.trim(),
        type: tripType,
        images: imageUri,
        numSlots: Number(numSlots),
        price: Number(tripPrice),
        exit_date: exit_date.toISOString(),
        return_date: return_date.toISOString(),
        route: {
          start: mapStart,
          end: mapEnd,
          coordinates: routeCoords,
        },
        tags: tags,
        uid: uid,
        createdAt: new Date().toISOString(),
        favoriteCount: 0,
        status: 'active'
      };

      const docRef = await addDoc(collection(db, 'events'), postData);
      await setDoc(docRef, { id: docRef.id }, { merge: true });

      showMessage({
        message: "Viagem criada!",
        description: "Sua excursão foi publicada com sucesso",
        type: "success",
        duration: 2000,
      });

      setModalVisible(false);
      limparCampos();
      
    } catch (error) {
      console.error("Erro ao criar post:", error);
      showMessage({
        message: "Erro ao criar viagem",
        description: "Tente novamente em alguns instantes",
        type: "danger",
        duration: 3000
      });
    } finally {
      setIsLoading(false);
    }
  }

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permissão necessária',
        'Precisamos de acesso às suas fotos para adicionar imagens à viagem.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Abrir configurações', onPress: () => Linking.openSettings() },
        ]
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: true,
        selectionLimit: 5
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map(asset => asset.uri);
        setImageUri(prev => [...prev, ...newImages].slice(0, 5)); // Limite de 5 imagens
      }
    } catch (error) {
      console.log('Erro ao selecionar imagem:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };

  const removeImage = (index) => {
    setImageUri(prev => prev.filter((_, i) => i !== index));
  };

  const formatCurrency = (value) => {
    const number = value.replace(/\D/g, '');
    return number ? `R$ ${(Number(number) / 100).toFixed(2)}` : '';
  };

  const handlePriceChange = (text) => {
    // Remove tudo que não é número
    const numbers = text.replace(/\D/g, '');
    setTripPrice(numbers);
  };

  const formatPriceDisplay = (value) => {
    if (!value) return '';
    return `R$ ${(Number(value) / 100).toFixed(2)}`;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => { setModalVisible(false); limparCampos(); }}
    >
      <KeyboardAvoidingView 
        style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme?.backgroundSecondary }]}>
          
          {/* Header Padronizado */}
          <StandardHeader
            title="Nova Excursão"
            leftIcon="close"
            onLeftPress={() => { setModalVisible(false); limparCampos(); }}
            theme={theme}
            style={styles.modalHeader}
          />

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Seção de Imagens */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Fotos da Viagem
              </Text>
              
              <View style={styles.imagesContainer}>
                {imageUri.map((uri, index) => (
                  <View key={index} style={styles.imageItem}>
                    <Image source={{ uri }} style={styles.uploadedImage} />
                    <TouchableOpacity 
                      style={[styles.removeImageButton, { backgroundColor: theme?.error }]}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons name="close" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                {imageUri.length < 5 && (
                  <TouchableOpacity 
                    style={[styles.uploadButton, { backgroundColor: theme?.background }]}
                    onPress={pickImage}
                  >
                    <Ionicons name="camera" size={32} color={theme?.primary} />
                    <Text style={[styles.uploadText, { color: theme?.textSecondary }]}>
                      {imageUri.length}/5
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Seção de Informações Básicas */}
            <StandardCard theme={theme} style={styles.section}>
              <Text style={[textStyles.h5, { color: theme?.textPrimary, marginBottom: spacing.lg }]}>
                Informações da Viagem
              </Text>
              
              <StandardInput
                placeholder="Ex: Viagem para Praia Grande - SP"
                value={postName}
                onChangeText={setPostName}
                icon="airplane-outline"
                theme={theme}
                style={styles.input}
                maxLength={60}
              />

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme?.textSecondary }]}>Tipo de Viagem *</Text>
                <View style={styles.tripTypeContainer}>
                  {tripTypes.map((type) => (
                    <TouchableOpacity
                      key={type.id}
                      style={[
                        styles.tripTypeButton,
                        { backgroundColor: theme?.background, borderColor: theme?.border },
                        tripType === type.id && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                      ]}
                      onPress={() => setTripType(type.id)}
                    >
                      <Ionicons 
                        name={type.icon} 
                        size={16} 
                        color={tripType === type.id ? theme?.textInverted : theme?.primary} 
                      />
                      <Text style={[
                        styles.tripTypeText,
                        { color: tripType === type.id ? theme?.textInverted : theme?.textPrimary }
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme?.textSecondary }]}>Descrição *</Text>
                <TextInput
                  style={[styles.textArea, { 
                    backgroundColor: theme?.background,
                    color: theme?.textPrimary,
                    borderColor: theme?.border
                  }]}
                  placeholder="Descreva os detalhes da viagem, pontos turísticos, programação..."
                  placeholderTextColor={theme?.textTertiary}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                <Text style={[styles.charCount, { color: theme?.textTertiary }]}>
                  {description.length}/500
                </Text>
              </View>
            </StandardCard>

            {/* Seção de Tags */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Tags da Viagem
              </Text>
              
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme?.textSecondary }]}>
                  Adicione tags para categorizar sua viagem
                </Text>
                
                {/* Interface de Tags */}
                <View style={[styles.tagsContainer, { backgroundColor: theme?.background, borderColor: theme?.border }]}>
                  <View style={styles.tagsHeader}>
                    <View style={styles.tagsHeaderLeft}>
                      <Ionicons name="chevron-down" size={16} color={theme?.textPrimary} />
                      <Text style={[styles.tagsTitle, { color: theme?.textPrimary }]}>tags</Text>
                      <Text style={[styles.tagsArrayLabel, { color: theme?.textSecondary }]}>(array)</Text>
                    </View>
                    <View style={styles.tagsHeaderRight}>
                      <TouchableOpacity 
                        style={[styles.addTagButton, { backgroundColor: theme?.primary }]}
                        onPress={addTag}
                      >
                        <Ionicons name="add" size={16} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.clearTagsButton, { backgroundColor: theme?.error }]}
                        onPress={() => setTags([])}
                      >
                        <Ionicons name="trash" size={16} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Lista de Tags */}
                  <ScrollView style={styles.tagsList} showsVerticalScrollIndicator={true}>
                    {tags.map((tag, index) => (
                      <View key={index} style={styles.tagItem}>
                        <View style={[styles.tagIndex, { backgroundColor: theme?.backgroundSecondary }]}>
                          <Text style={[styles.tagIndexText, { color: theme?.textSecondary }]}>{index}</Text>
                        </View>
                        <Text style={[styles.tagText, { color: theme?.textPrimary }]}>"{tag}"</Text>
                        <TouchableOpacity 
                          style={styles.removeTagButton}
                          onPress={() => removeTag(index)}
                        >
                          <Ionicons name="close" size={14} color={theme?.textTertiary} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                  
                  {/* Input para nova tag */}
                  <View style={styles.addTagInputContainer}>
                    <TextInput
                      style={[styles.addTagInput, { 
                        backgroundColor: theme?.backgroundSecondary,
                        color: theme?.textPrimary,
                        borderColor: theme?.border
                      }]}
                      placeholder="Digite uma nova tag..."
                      placeholderTextColor={theme?.textTertiary}
                      value={newTag}
                      onChangeText={setNewTag}
                      onSubmitEditing={addTag}
                      returnKeyType="done"
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Seção de Datas e Preços */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Datas e Valores
              </Text>
              
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Data de Saída</Text>
                  <TouchableOpacity
                    style={[styles.dateInput, { 
                      backgroundColor: theme?.background,
                      borderColor: theme?.border
                    }]}
                    onPress={() => setShowExitDate(true)}
                  >
                    <Ionicons name="calendar" size={20} color={theme?.primary} />
                    <Text style={[styles.dateText, { color: theme?.textPrimary }]}>
                      {exit_date.toLocaleDateString('pt-BR')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Data de Retorno</Text>
                  <TouchableOpacity
                    style={[styles.dateInput, { 
                      backgroundColor: theme?.background,
                      borderColor: theme?.border
                    }]}
                    onPress={() => setShowReturnDate(true)}
                  >
                    <Ionicons name="calendar" size={20} color={theme?.primary} />
                    <Text style={[styles.dateText, { color: theme?.textPrimary }]}>
                      {return_date.toLocaleDateString('pt-BR')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {showExitDate && (
                <DateTimePicker
                  value={exit_date}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowExitDate(false);
                    if (selectedDate) setExitDate(selectedDate);
                  }}
                />
              )}

              {showReturnDate && (
                <DateTimePicker
                  value={return_date}
                  mode="date"
                  display="default"
                  minimumDate={exit_date}
                  onChange={(event, selectedDate) => {
                    setShowReturnDate(false);
                    if (selectedDate) setReturnDate(selectedDate);
                  }}
                />
              )}

              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Preço por pessoa *</Text>
                  <View style={[styles.priceInputContainer, { backgroundColor: theme?.background, borderColor: theme?.border }]}>
                    <Text style={[styles.currencySymbol, { color: theme?.textPrimary }]}>R$</Text>
                    <TextInput
                      style={[styles.priceInput, { color: theme?.textPrimary }]}
                      placeholder="0,00"
                      placeholderTextColor={theme?.textTertiary}
                      value={tripPrice ? (Number(tripPrice) / 100).toFixed(2) : ''}
                      onChangeText={handlePriceChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: theme?.textSecondary }]}>Vagas disponíveis *</Text>
                  <TextInput
                    style={[styles.input, { 
                      backgroundColor: theme?.background,
                      color: theme?.textPrimary,
                      borderColor: theme?.border
                    }]}
                    placeholder="0"
                    placeholderTextColor={theme?.textTertiary}
                    value={numSlots}
                    onChangeText={(text) => setNumSlots(text.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                </View>
              </View>
            </View>

            {/* Seção do Mapa */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Rota da Viagem *
              </Text>
              
              {/* Interface de Busca de Lugares */}
              <View style={styles.searchSection}>
                <Text style={[styles.searchLabel, { color: theme?.textSecondary }]}>
                  Buscar lugares para marcar no mapa
                </Text>
                
                {/* Botões para selecionar tipo de lugar */}
                <View style={styles.placeTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.placeTypeButton,
                      { backgroundColor: theme?.background, borderColor: theme?.border },
                      selectedPlaceType === 'start' && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                    ]}
                    onPress={() => setSelectedPlaceType('start')}
                  >
                    <Ionicons 
                      name="play-circle" 
                      size={16} 
                      color={selectedPlaceType === 'start' ? theme?.textInverted : theme?.primary} 
                    />
                    <Text style={[
                      styles.placeTypeText,
                      { color: selectedPlaceType === 'start' ? theme?.textInverted : theme?.textPrimary }
                    ]}>
                      Ponto de Partida
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.placeTypeButton,
                      { backgroundColor: theme?.background, borderColor: theme?.border },
                      selectedPlaceType === 'end' && { backgroundColor: theme?.primary, borderColor: theme?.primary }
                    ]}
                    onPress={() => setSelectedPlaceType('end')}
                  >
                    <Ionicons 
                      name="flag" 
                      size={16} 
                      color={selectedPlaceType === 'end' ? theme?.textInverted : theme?.primary} 
                    />
                    <Text style={[
                      styles.placeTypeText,
                      { color: selectedPlaceType === 'end' ? theme?.textInverted : theme?.textPrimary }
                    ]}>
                      Destino
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Componente de busca */}
                <PlaceSearch
                  onPlaceSelect={handlePlaceSelect}
                  placeholder={`Buscar ${selectedPlaceType === 'start' ? 'ponto de partida' : 'destino'}...`}
                  theme={theme}
                  style={styles.placeSearch}
                />

                {/* Mostrar lugares selecionados */}
                <View style={styles.selectedPlaces}>
                  {mapStart && (
                    <View style={[styles.selectedPlace, { backgroundColor: theme?.backgroundSecondary }]}>
                      <Ionicons name="play-circle" size={16} color={theme?.primary} />
                      <View style={styles.selectedPlaceInfo}>
                        <Text style={[styles.selectedPlaceLabel, { color: theme?.textSecondary }]}>
                          Partida:
                        </Text>
                        <Text style={[styles.selectedPlaceName, { color: theme?.textPrimary }]}>
                          {mapStart.name}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setMapStart(null)}>
                        <Ionicons name="close-circle" size={20} color={theme?.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  )}
                  
                  {mapEnd && (
                    <View style={[styles.selectedPlace, { backgroundColor: theme?.backgroundSecondary }]}>
                      <Ionicons name="flag" size={16} color={theme?.primary} />
                      <View style={styles.selectedPlaceInfo}>
                        <Text style={[styles.selectedPlaceLabel, { color: theme?.textSecondary }]}>
                          Destino:
                        </Text>
                        <Text style={[styles.selectedPlaceName, { color: theme?.textPrimary }]}>
                          {mapEnd.name}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => setMapEnd(null)}>
                        <Ionicons name="close-circle" size={20} color={theme?.textTertiary} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              
              <SimpleRouteMap
                startCoordinate={mapStart}
                endCoordinate={mapEnd}
                routeCoordinates={routeCoords}
                height={200}
                onRouteCalculated={setRouteCoords}
                theme={theme}
              />
              
              <RouteInfo
                routeCoordinates={routeCoords}
                startCoordinate={mapStart}
                endCoordinate={mapEnd}
                theme={theme}
              />
            </View>

            {/* Termos e Condições */}
            <Text style={[styles.termsText, { color: theme?.textTertiary }]}>
              Ao criar uma publicação, você concorda com os{' '}
              <Text style={[styles.termsLink, { color: theme?.primary }]}>
                Termos de Uso
              </Text>{' '}
              e{' '}
              <Text style={[styles.termsLink, { color: theme?.primary }]}>
                Política de Privacidade
              </Text>
            </Text>

            {/* Botão de Publicar */}
            <StandardButton
              title={isLoading ? "Publicando..." : "PUBLICAR EXCURSÃO"}
              onPress={saveData}
              variant="primary"
              size="large"
              disabled={isLoading}
              icon={isLoading ? null : "rocket"}
              theme={theme}
              style={styles.submitButton}
            />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: spacing['2xl'],
    paddingHorizontal: spacing.lg,
  },
  imagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  imageItem: {
    position: 'relative',
  },
  uploadedImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  uploadText: {
    fontSize: 12,
    marginTop: 4,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tripTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  tripTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  dateText: {
    fontSize: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  termsText: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    lineHeight: 16,
  },
  termsLink: {
    fontWeight: '500',
  },
  submitButton: {
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
  },
  // Estilos para Tags
  tagsContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tagsHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagsTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsArrayLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  tagsHeaderRight: {
    flexDirection: 'row',
    gap: 8,
  },
  addTagButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearTagsButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsList: {
    maxHeight: 120,
    marginBottom: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginBottom: 4,
    borderRadius: 4,
  },
  tagIndex: {
    width: 20,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  tagIndexText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  tagText: {
    flex: 1,
    fontSize: 14,
    marginRight: 8,
  },
  removeTagButton: {
    padding: 2,
  },
  addTagInputContainer: {
    marginTop: 8,
  },
  addTagInput: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  // Estilos para busca de lugares
  searchSection: {
    marginBottom: 16,
  },
  searchLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  placeTypeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  placeTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  placeTypeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  placeSearch: {
    marginBottom: 12,
  },
  selectedPlaces: {
    gap: 8,
  },
  selectedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  selectedPlaceInfo: {
    flex: 1,
  },
  selectedPlaceLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  selectedPlaceName: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CreatePost;