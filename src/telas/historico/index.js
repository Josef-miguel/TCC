import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Tela de histórico de viagens favoritas
export default function Historico({ route, navigation }) {
  // Recebe lista de favoritos via parâmetros de rota (padrão: array vazio)
  const favoritos = route.params?.favoritos || [];
  // Estado para texto de busca
  const [searchQuery, setSearchQuery] = useState("");

  // Filtra favoritos com base no texto de busca (rota, tema ou tipo)
  const filtrados = favoritos.filter(
    (item) =>
      (item.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.theme?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      (item.type !== undefined && item.type.toString().includes(searchQuery))
  );

  return (
    <View style={styles.container}>
      {/* Header com botão de voltar */}
      <View style={styles.header}>
        <Ionicons
          name="arrow-back"
          style={styles.flecha}
          color="#f37100"
          size={32}
          onPress={() => navigation.goBack()}
        ></Ionicons>
        <Text style={styles.headerText}>Minhas Viagens</Text>
      </View>

      {/* Campo de busca */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          placeholderTextColor={"#999"}
          placeholder="Buscar"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Lista de cards de viagens */}
      <ScrollView style={styles.cardsContainer}>
        {filtrados.length === 0 ? (
          // Mensagem caso não haja resultados
          <Text style={styles.emptyText}>
            Nenhuma viagem favoritada encontrada.
          </Text>
        ) : (
          // Renderiza um card para cada item filtrado
          filtrados.map((item) => (
            <View key={item.id} style={styles.card}>
              {/* Imagem da viagem */}
              <Image
                source={{ uri: item.images[0] }}
                style={styles.cardImage}
              />
              {/* Conteúdo textual: rota e informações da excursão */}
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>{item.excursionInfo}</Text>
              </View>
              {/* Ícone de coração para indicar favorito */}
              <Ionicons
                name="heart"
                size={22}
                color="#f37100"
                style={styles.heartIcon}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// Estilos da tela de histórico
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1b21",
    paddingTop: 50,
  },
  header: {
    marginBottom: 20,
  },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
    color: "#f37100",
  },
  flecha: {
    marginTop: 20,
  },
  backButton: {
    flexDirection: "row",
  },
  backText: {
    fontSize: 16,
    color: "#000",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    margin: 10,
    backgroundColor: "#2b2c33",
    borderRadius: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
  },
  cardsContainer: {
    marginHorizontal: 10,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#363942",
    borderRadius: 6,
    marginTop: 10,
    padding: 10,
  },
  cardImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#fff",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#a0a4ad",
  },
  heartIcon: {
    marginLeft: 5,
  },
  emptyText: {
    marginTop: 20,
    textAlign: "center",
    color: "#666",
  },
});
