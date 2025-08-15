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
import { Feather } from '@expo/vector-icons';

import { showMessage } from 'react-native-flash-message';
import {auth, db} from '../../../services/firebase';
import {signInWithEmailAndPassword} from 'firebase/auth';
import { useAuth } from '../../../services/AuthContext';
import { doc, getDoc } from 'firebase/firestore';


// Tela de Login principal
export default function Login({ navigation }) {
  const {setUserData} = useAuth()

  // Valores animados para deslocamento (offset) e opacidade
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));

  // Estados para usuário e senha
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Executa a animação de entrada apenas uma vez ao montar o componente
  useEffect(() => {
    Animated.parallel([
      // Anima o eixo Y com efeito de mola
      Animated.spring(offset.y, {
        toValue: 0,
        speed: 4,
        bounciness: 20,
        useNativeDriver: true,
      }),
      // Anima a opacidade de 0 a 1
      Animated.timing(opac, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Limpa os campos de usuário e senha
  const limparCampos = () => {
    setUser('');
    setPassword('');
  };

async function handleLogin(obj) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, obj.email, obj.password);
    const user = userCredential.user;

    // Buscar dados no Firestore com o UID
    const docRef = doc(db, 'user', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const userDataFromFirestore = docSnap.data();

      // Atualiza o contexto com os dados do Firestore
      setUserData({userInfo: userDataFromFirestore});

      console.log('Usuário logado com dados:', userDataFromFirestore);
      showMessage({
        message: 'Login Bem-Sucedido',
        description: 'Bem-vindo!',
        type: 'success',
      });
      navigation.navigate('Home');
    } else {
      console.warn('Usuário logado, mas documento não encontrado no Firestore.');
      showMessage({
        message: 'Erro',
        description: 'Usuário não possui dados salvos no Firestore.',
        type: 'danger',
      });
    }

  } catch (error) {
    console.error('Erro no login:', error.message);
    showMessage({
      message: 'Erro ao logar e-mail ou senha inválidos',
      description: error.message,
      type: 'danger',
    });
  }
}


  async function saveData() {
    // Validação básica de preenchimento
    if (!user || !password) {
      showMessage({
        message: 'Erro ao Salvar',
        description: 'Preencha os Campos Obrigatórios!',
        type: 'warning',
      });
      return;
    }

    const obj = {
      user : user,
      email : email, 
      password : password
    }

    handleLogin(obj);

  }

  return (
    // Fundo gradiente de cores
    <View
      style={styles.background}
    >
      {/* ScrollView + KeyboardAvoiding para evitar sobreposição do teclado */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Logo animado */}
          <Animated.View
            style={[styles.logoContainer, { opacity: opac, transform: [{ translateY: offset.y }] }]}
          >
            <Image
              source={require('../../../assets/img/JSGlogo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Formulário animado */}
          <Animated.View style={[styles.form, { opacity: opac, transform: [{ translateY: offset.y }] }]}>            
            {/* Campo de Usuário com ícone */}
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
              <Feather name="mail" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Campo de Senha com ícone */}
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

            {/* Botão Entrar */}
            <TouchableOpacity style={styles.button} onPress={saveData}>
              <Text style={styles.buttonText}>Entrar</Text>
            </TouchableOpacity>

            {/* Link para tela de cadastro */}
            <TouchableOpacity onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.linkText}>Ainda não possui conta? Registre-se</Text>
            </TouchableOpacity>

          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// Estilos da tela
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: '#1a1b21'}, 
  scroll: { flexGrow: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  logoContainer: { marginBottom: 30, alignItems: 'center' },
  logo: { width: 100, height: 100, borderRadius: 0 },
  form: { width: '100%' },
  inputWrapper: {
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: '#2b2c33',
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
  icon: { color: '#f37100', marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#fff' },
  button: {
    backgroundColor: '#f37100',
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