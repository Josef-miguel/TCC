import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Text, Button, Card, Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../services/firebase'; // ajuste praonde seu Firestore é exportado
import { useAuth } from '../../../services/AuthContext';
import { get } from 'lodash';


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

const steps = [
  { key: 'tripType', title: 'Tipo de viagem favorita' },
  { key: 'budget', title: 'Faixa de preço' },
  { key: 'duration', title: 'Duração preferida' },
  { key: 'tags', title: 'Quais sensações você gostaria de experimentar?' },
];

const optionsMap = {
  tripType: [
    { label: 'Excursões', value: 'excursion' },
    { label: 'Viagens', value: 'trip' },
    { label: 'Shows', value: 'show' },
  ],
  budget: [
    { label: 'Baixo (até R$50)', value: 'low' },
    { label: 'Médio (R$50-R$200)', value: 'medium' },
    { label: 'Alto (acima de R$200)', value: 'high' },
  ],
  duration: [
    { label: 'Curta (1-3 dias)', value: 'short' },
    { label: 'Média (4-7 dias)', value: 'medium' },
    { label: 'Longa (mais de 7 dias)', value: 'long' },
  ],
  tags: [
    { label: 'Ação', value: 'action' },
    { label: 'Aventura', value: 'adventure' },
    { label: 'Radical', value: 'radical' },
    { label: 'Relaxante', value: 'relax' },
    { label: 'Tranquilo', value: 'chill' },
  ],
};

const TravelPreferencesScreen = () => {
  const {userData, loading} = useAuth()
  const navigation = useNavigation();
  const [step, setStep] = useState(0);

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

    const userSnap = await getDoc(userRef);
    const updatedUserData = userSnap.data();

    console.log('Dados atualizados: ', updatedUserData);
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

  const stepStateMap = {
    tripType: [tripType, setTripType],
    budget: [budget, setBudget],
    duration: [duration, setDuration],
    tags: [tags, setTags],
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  useEffect(() => {
    const verificar = async () => {
      console.log("loading:", loading);
      console.log("userData:", userData);

      // Espera 1 segundo
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!loading && !userData) {
        navigation.replace('Login');
      }
    };

    verificar();
  }, [loading, userData]);


    if (loading || !userData) {
      return <Text style={{ color: '#fff', textAlign: 'center', marginTop: 0 }}>Carregando usuário...</Text>;
    }

  const currentStep = steps[step];
  const [selected, setSelected] = stepStateMap[currentStep.key];
  const options = optionsMap[currentStep.key];

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.title}>Conte-nos sobre suas preferências de viagem!</Text>
          <Text style={styles.subTitle}>{currentStep.title}</Text>
          <ScrollView contentContainerStyle={styles.cardGroup}>
            {options.map(option => (
              <SelectableCard
                key={option.value}
                label={option.label}
                value={option.value}
                selected={Array.isArray(selected) && selected.includes(option.value)}
                onPress={value => toggleSelection(value, selected, setSelected)}
              />
            ))}
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 0 }}>
            {step > 0 && (
              <Button mode="outlined" onPress={handleBack} style={{ flex: 1, marginRight: 10 }}>
                Voltar
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                mode="contained"
                onPress={handleNext}
                style={{ flex: 1, backgroundColor: '#f37100', borderRadius: 12 }}
                labelStyle={styles.buttonText}
                disabled={selected.length === 0}
              >
                Próximo
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={savePreferences}
                style={{ flex: 1, backgroundColor: '#f37100', borderRadius: 12 }}
                labelStyle={styles.buttonText}
                disabled={selected.length === 0}
              >
                Salvar Preferências
              </Button>
            )}
          </View>

          <Button
            onPress={skipPreferences}
            style={styles.skipButton}
            labelStyle={{ color: '#9ca3af' }}
          >
            Pular
          </Button>
        </View>
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
    marginTop: 0,
    backgroundColor: '#f37100',
    borderRadius: 12,
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 0,
  },
});

export default TravelPreferencesScreen;
