import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Image,
  Animated,
  Platform,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

export default function Login({ navigation }) {
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, {
        toValue: 0,
        speed: 4,
        bounciness: 20,
        useNativeDriver: true,
      }),
      Animated.timing(opac, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const userLogin = async (user, password) => {
    try {
      const response = await fetch('http://localhost/api/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, password }),
      });
      const data = await response.json();

      if (data.status === 'success') {
        navigation.navigate('Home');
      } else {
        Alert.alert('Erro no login', data.message);
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível conectar ao servidor.');
    }
  };

  return (
    <LinearGradient
      colors={[ '#4c669f', '#3b5998', '#192f6a' ]}
      style={styles.background}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <Animated.View style={[styles.logoContainer, { opacity: opac, transform: [{ translateY: offset.y }] }]}>
          <Image
            source={require('../../../assets/img/iconimg.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.form, { opacity: opac, transform: [{ translateY: offset.y }] }]}>
          <View style={styles.inputWrapper}>
            <Feather name="user" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Usuário"
              placeholderTextColor="#666"
              keyboardType="email-address"
              value={user}
              onChangeText={setUser}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Feather name="lock" size={20} style={styles.icon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#666"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity style={styles.button} onPress={() => userLogin(user, password)}>
            <Text style={styles.buttonText}>Entrar</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.linkText}>Ainda não possui uma conta? Registre-se</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 80,
  },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    color: '#3b5998',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#3b5998',
    borderRadius: 25,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 10,
    textDecorationLine: 'underline',
  },
});
