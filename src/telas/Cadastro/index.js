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
import { showMessage } from 'react-native-flash-message';
import api from '../../../services/api';

// Tela de cadastro de novo usuário
export default function Cadastro({ navigation }) {
  // Controle de animações: deslocamento vertical e opacidade
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));

  // Estados para cada campo do formulário
  const [user, setUser] = useState("");           // Nome de usuário
  const [password, setPassword] = useState("");   // Senha
  const [email, setEmail] = useState("");         // E-mail
  const [cpf, setCpf] = useState("");             // CPF (campo numérico)
  const [dataNasc, setDataNasc] = useState(new Date()); // Data de nascimento
  const [success, setSuccess] = useState("");     // Flag para controle de sucesso

  // Objetos auxiliares para gerar inputs dinamicamente
  const values = {
    'Usuário': user,
    'E-mail': email,
    'Senha': password,
    'CPF': cpf,
    'Data de nascimento': dataNasc,
  };
  const setters = {
    'Usuário': setUser,
    'E-mail': setEmail,
    'Senha': setPassword,
    'CPF': setCpf,
    'Data de nascimento': setDataNasc,
  };

  // Limpa todos os campos do formulário
  function limparCampos() {
    setUser("");
    setEmail("");
    setCpf("");
    setPassword("");
    setDataNasc("");
  }

  // Função que envia dados para o backend e trata respostas
  async function saveData() {
    // Validação: todos os campos são obrigatórios
    if (!user || !password || !email || !cpf || !dataNasc) {
      showMessage({
        message: "Erro ao Salvar",
        description: 'Preencha os Campos Obrigatórios!',
        type: "warning",
      });
      return;
    }

    try {
      // Formata data em string 'YYYY-MM-DD'
      const formattedDate = dataNasc instanceof Date && !isNaN(dataNasc.getTime())
        ? dataNasc.toISOString().split('T')[0]
        : '';

      // Objeto a ser enviado na requisição
      const obj = {
        user: user,
        email: email,
        password: password,
        cpf: cpf,
        dataNasc: formattedDate,
      };

      // Chamada POST para endpoint de registro
      const res = await api.post('TCC/register.php', obj);

      // Falha de comunicação (status != 200)
      if (res.status !== 200) {
        throw new Error('Erro na comunicação com o servidor');
      }

      // Backend retornou sucesso=false
      if (res.data.success === false) {
        showMessage({
          message: "Erro ao cadastrar",
          description: res.data.message || 'CAMPO INVÁLIDO!',
          type: "warning",
          duration: 3000,
        });
        limparCampos();
      }
      // Cadastro bem-sucedido
      else if (res.data.success === true) {
        showMessage({
          message: "Cadastro Bem-Sucedido",
          description: "Bem-vindo!",
          type: "success",
          duration: 1800,
        });
        setSuccess(true);
        navigation.navigate('Home'); // Navega para tela inicial
      }
      // Caso não caia em nenhum dos casos acima
      else {
        showMessage({
          message: "Ocorreu algum erro",
          description: "Erro inesperado",
          type: 'warning',
          duration: 2000
        });
      }

      console.log('Success flag:', res.data.success);
    } catch (error) {
      console.error(error);
      showMessage({
        message: "Ocorreu algum erro: " + error.message,
        description: "Tente novamente mais tarde.",
        type: 'danger',
        duration: 2000
      });
      setSuccess(false);
    }
  }

  // Dispara animações ao montar componente
  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, { toValue: 0, speed: 4, bounciness: 20, useNativeDriver: true }),
      Animated.timing(opac, { toValue: 1, duration: 1500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    // Fundo em gradiente colorido
    <LinearGradient colors={[ '#1a2a6c', '#b21f1f', '#ff55aa' ]} style={styles.gradient}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Logo animado */}
          <Animated.View style={[styles.logoContainer, { opacity: opac, transform: [{ translateY: offset.y }] }] }>
            <Image
              source={require('../../../assets/img/iconimg.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Formulário animado: itera sobre placeholders e gera campos */}
          <Animated.View style={[styles.form, { opacity: opac, transform: [{ translateY: offset.y }] }] }>
            {['Usuário', 'E-mail', 'Senha', 'CPF', 'Data de nascimento'].map((placeholder, idx) => (
              <View key={idx} style={styles.inputWrapper}>
                <Feather
                  name={placeholder === 'Senha' ? 'lock' : 'user'}
                  size={20}
                  style={styles.icon}
                />
                <TextInput
                  style={styles.input}
                  placeholder={placeholder}
                  placeholderTextColor="#667"
                  value={values[placeholder]}
                  secureTextEntry={placeholder === 'Senha'}
                  keyboardType={
                    placeholder === 'CPF' || placeholder === 'Data de nascimento'
                      ? 'numeric'
                      : 'default'
                  }
                  onChangeText={text => setters[placeholder](text)}
                />
              </View>
            ))}

            {/* Botão para submeter cadastro */}
            <TouchableOpacity style={styles.button} onPress={saveData}>
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>

            {/* Link para ir ao login */}
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.linkText}>Já possui conta? Faça login</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </LinearGradient>
  );
}

// Definição de estilos para a tela de cadastro
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
  icon: { color: '#fdbb2d', marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  button: {
    backgroundColor: '#b21f1f',
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