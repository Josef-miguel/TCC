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
import api from '../../../services/api';
import { showMessage } from 'react-native-flash-message';

export default function Login({ navigation }) {
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, { toValue: 0, speed: 4, bounciness: 20, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]).start();
  }, []);

  const limparCampos = () => {
    setUser('');
    setPassword('');
  };

  async function saveData() {
    if (!user || !password) {
      showMessage({
        message: 'Erro ao Salvar',
        description: 'Preencha os Campos Obrigatórios!',
        type: 'warning',
      });
      return;
    }

    try {
      const res = await api.post('TCC/login.php', { user, password });
      if (res.status !== 200) throw new Error('Erro na comunicação com o servidor');

      if (!res.data.success) {
        showMessage({
          message: 'Erro ao Logar',
          description: res.data.message || 'Usuário ou senha inválidos!',
          type: 'warning',
        });
        limparCampos();
      } else {
        showMessage({
          message: 'Login Bem-Sucedido',
          description: 'Bem-vindo!',
          type: 'success',
        });
        navigation.navigate('Home');
      }
    } catch (error) {
      showMessage({
        message: 'Ocorreu algum erro',
        description: error.message,
        type: 'danger',
      });
    }
  }

  return (
    <LinearGradient
      colors={['#1e3c72', '#0377fc']} //Alterem a cor
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <Animated.View
            style={[styles.logoContainer, { opacity: opac, transform: [{ translateY: offset.y }] }]}
          >
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
                autoCapitalize="none"
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

            <TouchableOpacity style={styles.button} onPress={saveData}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.linkText}>Ainda não possui conta? Registre-se</Text>
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
  icon: { color: '#1e3c72', marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  button: {
    backgroundColor: '#1e3c72',
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
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  linkText: { color: '#fff', textAlign: 'center', marginTop: 10, textDecorationLine: 'underline' },
});