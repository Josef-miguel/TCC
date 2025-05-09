import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Image,
  Animated,
  ScrollView,
  Platform,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function Cadastro({ navigation }) {
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, { toValue: 0, speed: 4, bounciness: 20, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient
      colors={[ '#1a2a6c', '#b21f1f', '#fdbb2d' ]}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View style={[styles.logoContainer, { opacity: opac, transform: [{ translateY: offset.y }] }] }>
            <Image
              source={require('../../../assets/img/iconimg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          <Animated.View style={[styles.form, { opacity: opac, transform: [{ translateY: offset.y }] }] }>
            {['Usuário', 'Senha', 'CPF', 'Data de nascimento'].map((placeholder, idx) => (
              <View key={idx} style={styles.inputWrapper}>
                <Feather
                  name={placeholder === 'Senha' ? 'lock' : 'user'}
                  size={20}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#666"
                  secureTextEntry={placeholder === 'Senha'}
                  keyboardType={placeholder === 'CPF' || placeholder === 'Data de nascimento' ? 'numeric' : 'default'}
                />
              </View>
            ))}

            <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Já possui conta? Faça login</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoContainer: { marginBottom: 30, alignItems: 'center' },
  logo: { width: 180, height: 60 },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 25,
    paddingHorizontal: 15, marginBottom: 15, height: 50, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3,
  },
  icon: { color: '#fdbb2d', marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  button: {
    backgroundColor: '#b21f1f', borderRadius: 25, height: 50, alignItems: 'center', justifyContent: 'center',
    marginVertical: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3,
    shadowRadius: 5, elevation: 4,
  },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#fff', textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
});


