import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase'; // ajuste praonde seu Firestore é exportado
import { useAuth } from '../../../services/AuthContext';


// Componente de Card de seleção
const SelectableCard = ({ label, value, selected, onPress }) => (
  <TouchableOpacity onPress={() => onPress(value)} style={styles.cardTouchable}>
    <Card style={[styles.card, selected && styles.selectedCard]}>
      <Card.Content>
        <Text style={styles.cardText}>{label}</Text>
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

const TravelPreferencesScreen = () => {
    const {userData, loading} = useAuth()
  const navigation = useNavigation();

  // Agora todos os estados são arrays para multi seleção
  const [tripType, setTripType] = useState([]);
  const [budget, setBudget] = useState([]);
  const [duration, setDuration] = useState([]);
  const [tags, setTags] = useState([]);

  const tripOptions = [
    { label: 'Excursões', value: 'excursion' },
    { label: 'Viagens', value: 'trip' },
    { label: 'Shows', value: 'show' },
  ];

  const budgetOptions = [
    { label: 'Baixo (até R$50)', value: 'low' },
    { label: 'Médio (R$50-R$200)', value: 'medium' },
    { label: 'Alto (acima de R$200)', value: 'high' },
  ];

  const durationOptions = [
    { label: 'Curta (1-3 dias)', value: 'short' },
    { label: 'Média (4-7 dias)', value: 'medium' },
    { label: 'Longa (mais de 7 dias)', value: 'long' },
  ];
  const tagOptions = [
    { label: 'Ação', value: 'action' },
    { label: 'Aventura', value: 'adventure' },
    { label: 'Radical', value: 'radical' },
    { label: 'Relaxante', value: 'relax' },
    { label: 'Tranquilo', value: 'chill' },
    
  ];

  // Função genérica para toggle de seleção
  const toggleSelection = (value, selectedArray, setSelectedArray) => {
    if (selectedArray.includes(value)) {
      setSelectedArray(selectedArray.filter(item => item !== value));
    } else {
      setSelectedArray([...selectedArray, value]);
    }
  };

  const savePreferences = async () => {
  if (tripType.length === 0 || budget.length === 0 || duration.length === 0 || tags.length === 0) {
    Alert.alert('Erro', 'Por favor, preencha todas as preferências.');
    return;
  }

  const preferences = {
    favoriteType: tripType,
    favoriteBudget: budget,
    favoriteDuration: duration,
    favoriteTags: tags,
  }; 

  try {
    // supondo que userData.userInfo.uid exista com uid correto do usuário logado
    const userRef = doc(db, 'user', auth.currentUser?.uid);
    console.log(auth.currentUser?.uid);
    await updateDoc(userRef, { preferences }); // atualiza só o campo 'preferences'

    console.log('Dados atualizados com sucesso!');
    Alert.alert('Sucesso', 'Preferências salvas com sucesso!');
    navigation.replace('Home');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    Alert.alert('Erro', 'Não foi possível salvar as preferências.');
  }
};


  const skipPreferences = () => {
    navigation.replace('Home');
  };

useEffect(() => {
  console.log("loading:", loading);
  console.log("userData:", userData);

  if (!loading && !userData) {
    navigation.replace('Login');
  }
}, [loading, userData]);

    if (loading || !userData) {
        console.log("carregou");
    return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40 }}>Carregando usuário...</Text>;
    }


  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Conte-nos sobre suas preferências de viagem!</Text>

          <Text style={styles.subTitle}>Tipo de viagem favorita</Text>
          <View style={styles.cardGroup}>
            {tripOptions.map(option => (
              <SelectableCard
                key={option.value}
                label={option.label}
                value={option.value}
                selected={Array.isArray(tripType) && tripType.includes(option.value)}
                onPress={value => toggleSelection(value, tripType, setTripType)}
              />
            ))}
          </View>

          <Text style={styles.subTitle}>Faixa de preço</Text>
          <View style={styles.cardGroup}>
            {budgetOptions.map(option => (
              <SelectableCard
                key={option.value}
                label={option.label}
                value={option.value}
                selected={Array.isArray(budget) && budget.includes(option.value)}
                onPress={value => toggleSelection(value, budget, setBudget)}
              />
            ))}
          </View>

          <Text style={styles.subTitle}>Duração preferida</Text>
          <View style={styles.cardGroup}>
            {durationOptions.map(option => (
              <SelectableCard
                key={option.value}
                label={option.label}
                value={option.value}
                selected={Array.isArray(duration) && duration.includes(option.value)}
                onPress={value => toggleSelection(value, duration, setDuration)}
              />
            ))}
          </View>
          <Text style={styles.subTitle}>Quais sensações você gostaria de experimentar?</Text>
          <View style={styles.cardGroup}>
            {tagOptions.map(option => (
              <SelectableCard
                key={option.value}
                label={option.label}
                value={option.value}
                selected={Array.isArray(tags) && tags.includes(option.value)}
                onPress={value => toggleSelection(value, tags, setTags)}
              />
            ))}
          </View>

          <Button
            mode="contained"
            onPress={savePreferences}
            style={styles.button}
            labelStyle={styles.buttonText}
          >
            Salvar Preferências
          </Button>

          <Button
            onPress={skipPreferences}
            style={styles.skipButton}
            labelStyle={{ color: '#9ca3af' }}
          >
            Pular
          </Button>
        </ScrollView>
      </SafeAreaView>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1e1f24',
  },
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#ffffff',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f37100',
    marginVertical: 10,
  },
  cardGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  cardTouchable: {
    width: '48%',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#2a2b31',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 10,
  },
  selectedCard: {
    borderColor: '#f37100',
    borderWidth: 2,
  },
  cardText: {
    color: '#fff',
    textAlign: 'center',
  },
  button: {
    marginTop: 30,
    backgroundColor: '#f37100',
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 10,
  },
});

export default TravelPreferencesScreen;
