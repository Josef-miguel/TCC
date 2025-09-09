// src/telas/Avaliacoes/index.js
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useAuth } from '../../../services/AuthContext';
import { db } from '../../../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Avaliacoes() {
  const { userData } = useAuth();
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);

  useEffect(() => {
    const fetchAvaliacoes = async () => {
      try {
        const q = query(
          collection(db, "avaliacoes"),
          where("userId", "==", userData?.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAvaliacoes(data);
      } catch (error) {
        console.error("Erro ao buscar avaliações:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userData?.uid) fetchAvaliacoes();
  }, [userData]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme?.background }]}>
        <ActivityIndicator size="large" color={theme?.primary} />
      </View>
    );
  }

  if (avaliacoes.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: theme?.background }]}>
        <Icon name="emoticon-sad-outline" size={60} color={theme?.textSecondary} />
        <Text style={{ color: theme?.textSecondary, marginTop: 10 }}>
          Você ainda não fez nenhuma avaliação.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme?.background }]}>
      <FlatList
        data={avaliacoes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}>
            <Text style={[styles.viagem, { color: theme?.textPrimary }]}>
              Viagem: {item.viagemTitulo || "Sem título"}
            </Text>
            <Text style={[styles.nota, { color: theme?.primary }]}>
              Nota: {item.nota}/5
            </Text>
            {item.comentario ? (
              <Text style={[styles.comentario, { color: theme?.textSecondary }]}>
                "{item.comentario}"
              </Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  viagem: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 6,
  },
  nota: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  comentario: {
    fontSize: 14,
    fontStyle: "italic",
  },
});
