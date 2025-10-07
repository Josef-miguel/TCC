import React, { useState, useEffect, useContext } from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Image,
  Animated,
  ScrollView,
  Platform,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StandardInput, StandardButton, StandardCard, StandardHeader } from '../../components/CommonComponents';
import { textStyles, spacing, borderRadius, shadows } from '../../styles/typography';

import { showMessage } from 'react-native-flash-message';
import {auth, db} from '../../../services/firebase';
import {signInWithEmailAndPassword} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { ThemeContext } from '../../context/ThemeContext';


// Tela de Login principal
export default function Login({ navigation }) {
  const { t } = useTranslation();
  // Contexto agora atualiza sozinho após login; não é necessário setUserData aqui
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  // Valores animados aprimorados para deslocamento (offset) e opacidade
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 50 }));
  const [opac] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0.8));
  const [slideAnimation] = useState(new Animated.Value(Dimensions.get('window').width));

  // Estados para usuário e senha
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Executa a animação de entrada aprimorada apenas uma vez ao montar o componente
  useEffect(() => {
    Animated.sequence([
      // Primeiro: animação de entrada suave
      Animated.parallel([
        Animated.timing(offset.y, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opac, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      // Segundo: animação de slide para o formulário
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Limpa os campos de usuário e senha
  const limparCampos = () => {
    setUser('');
    setEmail('');
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
      console.log('Usuário logado com dados:', userDataFromFirestore);
      showMessage({
        message: 'Login Bem-Sucedido',
        description: 'Bem-vindo!',
        type: 'success',
      });
      limparCampos();
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
    setPassword('');
  }
}


  async function saveData() {
    // Validação básica de preenchimento
    if (!email || !password) {
      showMessage({
        message: 'Erro ao Salvar',
        description: 'Informe e-mail e senha.',
        type: 'warning',
      });
      return;
    }

    const obj = {
      email: email.trim(),
      password: password,
    }

    handleLogin(obj);

  }

  return (
    // Fundo com tema
    <View
      style={[styles.background, { backgroundColor: theme?.background }]}
    >
      <StatusBar 
        barStyle={theme?.mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme?.background} 
      />
      
      {/* Header com navegação */}
      <StandardHeader
        title="Entrar"
        rightIcon={themeContext?.isDarkTheme ? "sunny" : "moon"}
        onRightPress={themeContext?.toggleTheme}
        theme={theme}
        style={styles.header}
      />
      
      {/* ScrollView + KeyboardAvoiding para evitar sobreposição do teclado */}
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Logo animado com melhor design */}
          <Animated.View
            style={[styles.logoContainer, { 
              opacity: opac, 
              transform: [
                { translateY: offset.y },
                { scale: scale }
              ] 
            }]}
          >
            <View style={[styles.logoWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Image
                source={require('../../../assets/img/JSGlogo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              Bem-vindo de volta!
            </Text>
            <Text style={[styles.subtitle, { color: theme?.textSecondary }]}>
              Entre na sua conta para continuar
            </Text>
          </Animated.View>

          {/* Formulário com animação de slide */}
          <Animated.View style={[styles.form, { 
            opacity: opac, 
            transform: [
              { translateY: offset.y },
              { translateX: slideAnimation }
            ] 
          }]}>            
            <StandardCard theme={theme} style={styles.formCard}>
              {/* Campo de Usuário */}
              <StandardInput
                placeholder="Nome de usuário"
                value={user}
                onChangeText={setUser}
                icon="person-outline"
                theme={theme}
                style={styles.input}
              />

              {/* Campo de Email */}
              <StandardInput
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
                keyboardType="email-address"
                autoCapitalize="none"
                theme={theme}
                style={styles.input}
              />

              {/* Campo de Senha */}
              <StandardInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed"
                secureTextEntry
                theme={theme}
                style={styles.input}
              />

              {/* Botão Entrar */}
              <StandardButton
                title="Entrar"
                onPress={saveData}
                variant="primary"
                size="large"
                theme={theme}
                style={styles.button}
              />

              {/* Link para tela de cadastro */}
              <TouchableOpacity onPress={() => navigation.navigate('Cadastro')} style={styles.linkContainer}>
                <Text style={[textStyles.body, { color: theme?.primary, textAlign: 'center' }]}>
                  Não tem uma conta? Cadastre-se
                </Text>
              </TouchableOpacity>
            </StandardCard>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// Estilos aprimorados da tela
const styles = StyleSheet.create({
  background: { 
    flex: 1
  }, 
  scroll: { 
    flexGrow: 1 
  },
  container: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: spacing.lg 
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 0 : 20,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  logoContainer: { 
    marginBottom: spacing['2xl'], 
    alignItems: 'center' 
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  logo: { 
    width: 80, 
    height: 80, 
    borderRadius: borderRadius.none 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: spacing.lg,
    textAlign: 'center',
    opacity: 0.8
  },
  form: { 
    width: '100%' 
  },
  formCard: {
    padding: spacing['2xl'],
    ...shadows.lg,
  },
  input: {
    marginBottom: spacing.lg,
  },
  button: {
    marginVertical: spacing.lg,
  },
  linkContainer: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
  },
});
