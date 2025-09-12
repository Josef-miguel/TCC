// src/telas/Avaliacoes/index.js
import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { db } from '../../../services/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Ionicons } from '@expo/vector-icons';

export default function Avaliacoes() {
  const route = useRoute();
  const navigation = useNavigation();
  const { eventId } = route.params || {}; // precisa ser passado ao navegar
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [loading, setLoading] = useState(true);
  const [avaliacoes, setAvaliacoes] = useState([]);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      setAvaliacoes([]);
      return;
    }

    // ouçam em tempo real as avaliações do evento ordenadas por createdAt (desc)
    const q = query(
      collection(db, "events", eventId, "avaliacoes"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const arr = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAvaliacoes(arr);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar avaliações:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [eventId]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme?.background }]}>
        <ActivityIndicator size="large" color={theme?.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme?.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: 24 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={32} color={theme?.primary || "#f37100"} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme?.primary }]}>Avaliações</Text>
      </View>

      {avaliacoes.length === 0 ? (
        <View style={styles.center}>
          <Icon name="emoticon-sad-outline" size={60} color={theme?.textSecondary} />
          <Text style={{ color: theme?.textSecondary, marginTop: 10 }}>
            Nenhuma avaliação para este evento ainda.
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: 16 }}
          data={avaliacoes}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: theme?.backgroundSecondary, borderColor: theme?.border }]}>
              <Text style={[styles.userName, { color: theme?.textPrimary }]}>{item.username || "Usuário"}</Text>
              <Text style={[styles.nota, { color: theme?.primary }]}>Nota: {item.nota}/5</Text>
              {item.comment_text ? (
                <Text style={[styles.comentario, { color: theme?.textSecondary }]}>
                  {item.comment_text}
                </Text>
              ) : null}
              <Text style={[styles.dateText, { color: theme?.textTertiary }]}>{item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString() : (item.createdAt || "")}</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', marginLeft: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1 },
  userName: { fontWeight: 'bold', marginBottom: 6 },
  nota: { fontWeight: '600', marginBottom: 6 },
  comentario: { fontStyle: 'italic', marginBottom: 6 },
  dateText: { fontSize: 12, color: '#999' }
});
