// Nesta seção deverão estar contidas todas as informações da viagem/excrusão como um mapa com a localização da excursão, imagens do destino, sistema de avaliação, um botão para entrar em contato com o organização e um botão de participar da viagem que leva para um modal de confirmação
// O modal de confirmação devem ter perguntas sobre quem irá viajar e quem vai ir na viagem, que por sua vez leva para um modal de pagamento na qual estão disponíveis opções de pagamento e um botão pagar que abrirá um alerta de pagamento concluído.
//Modal para o chat
// Modal de gostos ou algoritomo de recomendação antes da tela de feed em si.
// A tela de feed deverá conter uma sidebar com os botões Agenda, Minhas viagens. Para o organizador deverá ter um botão extra Criar viagem. Alem de um ícone de perfil que leva para a tela perfil
// Também deverá conter posts que levam para os mesmos e uma seção de mais populares, além de um sistema de pesquisa

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [postName, setPostName] = useState('');
  const [tripType, setTripType] = useState('Viagem');
  const [description, setDescription] = useState('');

  return (
    <View style={styles.container}>
      {/* Barra superior */}
      <View style={styles.topBar}>
        <TouchableOpacity>
          <Ionicons name="menu" size={24} color="black" />
        </TouchableOpacity>
        <TextInput
          style={styles.searchInput}
          placeholder="Quero ir para...."
        />
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="add-circle-outline" size={24} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("Perfil")}>
          <Ionicons name="person-circle-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Modal para Criar Post */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="arrow-back" size={24} color="black" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Criar post</Text>
            </View>

            {/* Imagens do destino */}
            <View style={styles.imagePlaceholder}>
              <Text style={styles.placeholderText}>Imagens do destino</Text>
            </View>

            {/* Nome do post */}
            <Text style={styles.label}>Nome do post</Text>
            <TextInput
              style={styles.input}
              placeholder="Viagem para Miracatu, SP..."
              value={postName}
              onChangeText={setPostName}
            />

            {/* Tipo de viagem */}
            <Text style={styles.label}>Tipo de viagem</Text>
            <View style={styles.tripTypeContainer}>
              <TouchableOpacity
                style={[styles.tripTypeButton, tripType === 'Viagem' && styles.tripTypeButtonActive]}
                onPress={() => setTripType('Viagem')}
              >
                <Text style={[styles.tripTypeText, tripType === 'Viagem' && styles.tripTypeTextActive]}>VIAGEM</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tripTypeButton, tripType === 'Excursão' && styles.tripTypeButtonActive]}
                onPress={() => setTripType('Excursão')}
              >
                <Text style={[styles.tripTypeText, tripType === 'Excursão' && styles.tripTypeTextActive]}>EXCURSÃO</Text>
              </TouchableOpacity>
            </View>

            {/* Quantidade de pessoas */}
            <Text style={styles.label}>Quantidade de pessoas</Text>
            <TextInput
              style={styles.input}
              placeholder="Quantidade de pessoas"
            />

            {/* Descrição da viagem */}
            <Text style={styles.label}>Descrição da viagem</Text>
            <TextInput
              style={[styles.input, styles.descriptionInput]}
              placeholder="Vamos nos divertir pela cidade!"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            {/* Trajeto da viagem */}
            <Text style={styles.label}>Trajeto da viagem</Text>
            <View style={styles.mapPlaceholder}>
              <Ionicons name="location" size={24} color="black" />
            </View>

            {/* Termos de uso */}
            <Text style={styles.termsText}>
              Ao criar uma publicação no aplicativo, você concorda com os{' '}
              <Text style={styles.termsLink}>Termos de Uso e Política de Privacidade</Text> do JSG.
            </Text>

            {/* Botão de Viajar */}
            <TouchableOpacity style={styles.submitButton}>
              <Text style={styles.submitButtonText}>VIAJAR</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Lista de posts RECOMENDADOS */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {[
          { color: 'red', fav: false },
          { color: 'lime', fav: true },
          { color: 'dodgerblue', fav: false },
          { color: 'yellow', fav: false },
        ].map((item, index) => (
          <View key={index} style={[styles.post, { backgroundColor: item.color }]}>
            <TouchableOpacity style={styles.starIcon}>
              <Ionicons
                name={item.fav ? 'star' : 'star-outline'}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>
        ))}

        {/* POSTS POPULARES */}
        <Text style={styles.popularesTxt}>Populares recentemente</Text>

        {[
          { color: 'purple', fav: true },
          { color: 'silver', fav: true },
          { color: 'orange', fav: false },
        ].map((item, index) => (
          <View key={index} style={[styles.post, { backgroundColor: item.color }]}>
            <TouchableOpacity style={styles.starIcon}>
              <Ionicons
                name={item.fav ? 'star' : 'star-outline'}
                size={20}
                color="black"
              />
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    backgroundColor: '#f2f2f2',
  },
  searchInput: {
    flex: 1,
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  scroll: {
    padding: 10,
    paddingBottom: 30,
    flexGrow: 1,
  },
  post: {
    height: 80,
    borderRadius: 6,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  starIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  popularesTxt: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    height: '90%',
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
    backgroundColor: '#f0f0f0',
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
    borderColor: '#ddd',
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
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: '#e0f7fa',
    borderColor: '#00bcd4',
  },
  tripTypeText: {
    fontSize: 12,
    color: '#333',
  },
  tripTypeTextActive: {
    color: '#00bcd4',
    fontWeight: 'bold',
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  termsLink: {
    color: '#00bcd4',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#00bcd4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});