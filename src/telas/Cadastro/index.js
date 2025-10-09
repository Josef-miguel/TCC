import React, { useState, useEffect, useContext } from "react";
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
  Dimensions,
  StatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "../../../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ThemeContext } from "../../context/ThemeContext";
import { useTranslation } from 'react-i18next';
import { StandardInput, StandardButton, StandardCard, StandardHeader } from '../../components/CommonComponents';
import { textStyles, spacing, borderRadius, shadows } from '../../styles/typography';

export default function Cadastro({ navigation }) {
  // Contexto de tema
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { t } = useTranslation();

  // Controle de animações aprimoradas
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 50 }));
  const [opac] = useState(new Animated.Value(0));
  const [scale] = useState(new Animated.Value(0.8));
  const [slideAnimation] = useState(new Animated.Value(Dimensions.get('window').width));
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNasc, setDataNasc] = useState(new Date());
  const [success, setSuccess] = useState("");
  const [show, setShow] = useState(false);

  const values = {
    Usuário: user,
    "E-mail": email,
    Senha: password,
    CPF: cpf,
  };

  const setters = {
    Usuário: setUser,
    "E-mail": setEmail,
    Senha: setPassword,
    CPF: setCpf,
  };

  function limparCampos() {
    setUser("");
    setEmail("");
    setCpf("");
    setPassword("");
    setDataNasc(new Date());
  }

  async function addUser(obj) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        obj.email,
        obj.password
      );
      const uid = userCredential.user.uid;
      console.log("Usuário registrado:", userCredential.user);

      // Agora salva no Firestore:
      await setDoc(doc(db, "user", uid), {
        nome: obj.user,
        email: obj.email,
        cpf: obj.cpf,
        dataNasc: obj.dataNasc,
        preferences : {
          favoriteType : [],
          favoriteBudget : [],
          favoriteDuration : [],
          favoriteTags : [],
        },
        isOrganizer: false,
        currentJoinedEvents: [],
        uid: uid, // salva o UID do Auth também, boa prática!
      });

      setSuccess(true);
      showMessage({
        message: t('register.registrationSuccess'),
        description: "Bem-vindo!",
        type: "success",
        duration: 1800,
      });
      navigation.navigate("Algoritmo");
    } catch (e) {
      console.error("Erro ao adicionar usuário: ", e);
      showMessage({
        message: t('register.registrationError'),
        description: e.message || t('register.invalidField'),
        type: "warning",
        duration: 3000,
      });
    }
  }

  async function saveData() {
    if (!user || !password || !email || !cpf || !dataNasc) {
      showMessage({
        message: t('register.saveError'),
        description: t('register.fillRequiredFields'),
        type: "warning",
      });
      return;
    }

    const formattedDate =
      dataNasc instanceof Date && !isNaN(dataNasc.getTime())
        ? dataNasc.toISOString().split("T")[0]
        : "";

    const obj = {
      user: user || "",
      email: email || "",
      password: password || "",
      cpf: cpf || "",
      dataNasc: formattedDate || "",
    };

    addUser(obj);
  }

  // Dispara animações aprimoradas ao montar componente
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

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataNasc;
    setShow(Platform.OS === "ios");
    setDataNasc(currentDate);
  };

  return (
    <View style={[styles.background, { backgroundColor: theme?.background }]}>
      <StatusBar 
        barStyle={theme?.mode === 'dark' ? 'light-content' : 'dark-content'} 
        backgroundColor={theme?.background} 
      />
      
      {/* Header com navegação */}
      <StandardHeader
        title="Criar Conta"
        rightIcon={themeContext?.isDarkTheme ? "sunny" : "moon"}
        onRightPress={themeContext?.toggleTheme}
        theme={theme}
        style={styles.header}
      />
      
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          {/* Logo animado com melhor design */}
          <Animated.View
            style={[
              styles.logoContainer,
              { 
                opacity: opac, 
                transform: [
                  { translateY: offset.y },
                  { scale: scale }
                ] 
              },
            ]}
          >
            <View style={[styles.logoWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Image
                source={require("../../../assets/img/JSGlogo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={[styles.title, { 
              color: theme?.textPrimary,
              fontSize: 28,
              fontWeight: 'bold',
              textAlign: 'center',
              lineHeight: 34,
              numberOfLines: 0,
              flexWrap: 'wrap'
            }]}>
              Criar Conta
            </Text>
            <Text style={[styles.subtitle, { 
              color: theme?.textSecondary,
              fontSize: 16,
              textAlign: 'center',
              lineHeight: 22,
              numberOfLines: 0,
              flexWrap: 'wrap',
              opacity: 0.8
            }]}>
              Preencha os dados para se cadastrar
            </Text>
          </Animated.View>

          {/* Formulário com animação de slide */}
          <Animated.View
            style={[
              styles.form,
              { 
                opacity: opac, 
                transform: [
                  { translateY: offset.y },
                  { translateX: slideAnimation }
                ] 
              },
            ]}
          >
            <StandardCard theme={theme} style={styles.formCard}>
              {/* Campo Usuário */}
              <StandardInput
                placeholder="Nome de usuário"
                value={user}
                onChangeText={setUser}
                icon="person-outline"
                theme={theme}
                style={styles.input}
              />

              {/* Campo E-mail */}
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

              {/* Campo Senha */}
              <StandardInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                icon="lock-closed"
                secureTextEntry
                theme={theme}
                style={styles.input}
              />

              {/* Campo CPF */}
              <StandardInput
                placeholder="CPF"
                value={cpf}
                onChangeText={setCpf}
                icon="card"
                keyboardType="numeric"
                theme={theme}
                style={styles.input}
              />

              {/* Campo Data de Nascimento */}
              <View style={[styles.dateInputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
                <Feather name="calendar" size={20} style={[styles.dateIcon, { color: theme?.textTertiary }]} />
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShow(true)}
                >
                  <Text style={[styles.dateText, { color: theme?.textPrimary }]}>
                    {dataNasc.toLocaleDateString('pt-BR')}
                  </Text>
                </TouchableOpacity>
              </View>

              {show && (
                <DateTimePicker
                  value={dataNasc}
                  mode="date"
                  display="default"
                  onChange={onChange}
                />
              )}

              {/* Botão de Cadastro */}
              <StandardButton
                title="Cadastrar"
                onPress={saveData}
                variant="primary"
                size="large"
                theme={theme}
                style={styles.button}
              />

              {/* Link para ir ao login */}
              <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.linkContainer}>
                <Text style={[textStyles.body, { 
                  color: theme?.primary, 
                  textAlign: 'center',
                  fontSize: 16,
                  fontWeight: '500',
                  lineHeight: 22,
                  numberOfLines: 0,
                  flexWrap: 'wrap'
                }]}>
                  Já tem uma conta? Faça login
                </Text>
              </TouchableOpacity>
            </StandardCard>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// Definição de estilos aprimorados para a tela de cadastro
const styles = StyleSheet.create({
  background: { 
    flex: 1 
  },
  scroll: { 
    flexGrow: 1 
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
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
    alignItems: "center" 
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
    fontWeight: "bold", 
    marginBottom: spacing.sm,
    textAlign: 'center'
  },
  subtitle: { 
    fontSize: 16, 
    marginBottom: spacing.lg, 
    textAlign: "center",
    opacity: 0.8
  },
  form: { 
    width: "100%" 
  },
  formCard: {
    padding: spacing['2xl'],
    ...shadows.lg,
  },
  input: {
    marginBottom: spacing.lg,
  },
  dateInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base,
    marginBottom: spacing.lg,
    height: 50,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  dateIcon: { 
    marginRight: spacing.sm 
  },
  dateInput: { 
    flex: 1, 
    justifyContent: 'center'
  },
  dateText: { 
    fontSize: 16 
  },
  button: {
    marginVertical: spacing.lg,
  },
  linkContainer: {
    marginTop: 0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
