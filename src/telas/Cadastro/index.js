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
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { showMessage } from "react-native-flash-message";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "../../../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ThemeContext } from "../../context/ThemeContext";
import { useTranslation } from 'react-i18next';

export default function Cadastro({ navigation }) {
  // Contexto de tema
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const { t } = useTranslation();

  // Controle de animações: deslocamento vertical e opacidade
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));
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

  // Dispara animações ao montar componente
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

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || dataNasc;
    setShow(Platform.OS === "ios");
    setDataNasc(currentDate);
  };

  return (
    <View style={[styles.background, { backgroundColor: theme?.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <Animated.View
            style={[
              styles.logoContainer,
              { opacity: opac, transform: [{ translateY: offset.y }] },
            ]}
          >
            <Image
              source={require("../../../assets/img/JSGlogo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
            
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              {t('register.title')}
            </Text>
            <Text style={[styles.subtitle, { color: theme?.textSecondary }]}>
              {t('register.subtitle')}
            </Text>
            
            {/* Botão para alternar tema */}
            <TouchableOpacity 
              style={[styles.themeToggle, { backgroundColor: theme?.backgroundSecondary }]}
              onPress={themeContext?.toggleTheme}
            >
              <Feather 
                name={themeContext?.isDarkTheme ? "sun" : "moon"} 
                size={20} 
                color={theme?.primary} 
              />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              { opacity: opac, transform: [{ translateY: offset.y }] },
            ]}
          >
            {/* Campo Usuário */}
            <View style={[styles.inputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Feather name="user" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TextInput
                style={[styles.input, { color: theme?.textPrimary }]}
                placeholder={t('register.userPlaceholder')}
                placeholderTextColor={theme?.textTertiary}
                value={user}
                onChangeText={(text) => setUser(text)}
              />
            </View>

            {/* Campo E-mail */}
            <View style={[styles.inputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Feather name="mail" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TextInput
                style={[styles.input, { color: theme?.textPrimary }]}
                placeholder={t('register.emailPlaceholder')}
                placeholderTextColor={theme?.textTertiary}
                value={email}
                onChangeText={(text) => setEmail(text)}
              />
            </View>

            {/* Campo Senha */}
            <View style={[styles.inputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Feather name="lock" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TextInput
                style={[styles.input, { color: theme?.textPrimary }]}
                placeholder={t('register.passwordPlaceholder')}
                placeholderTextColor={theme?.textTertiary}
                value={password}
                secureTextEntry={true}
                onChangeText={(text) => setPassword(text)}
              />
            </View>

            {/* Campo CPF */}
            <View style={[styles.inputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Feather name="clipboard" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TextInput
                style={[styles.input, { color: theme?.textPrimary }]}
                placeholder={t('register.cpfPlaceholder')}
                placeholderTextColor={theme?.textTertiary}
                value={cpf}
                keyboardType="numeric"
                onChangeText={(text) => setCpf(text)}
              />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: theme?.backgroundSecondary }]}>
              <Feather name="calendar" size={20} style={[styles.icon, { color: theme?.primary }]} />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShow(true)}
              >
                <Text style={[styles.dateText, { color: theme?.textPrimary }]}>
                  {dataNasc.toLocaleDateString()}
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

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: theme?.primary }]} 
              onPress={saveData}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>{t('register.registerButton')}</Text>
            </TouchableOpacity>

            {/* Link para ir ao login */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={[styles.linkText, { color: theme?.textPrimary }]}>
                {t('register.loginLink')}
              </Text>
            </TouchableOpacity>


          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// Definição de estilos para a tela de cadastro
const styles = StyleSheet.create({
  background: { flex: 1 },
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: { marginBottom: 30, alignItems: "center", position: "relative" },
  logo: { width: 100, height: 100, borderRadius: 0 },
  title: { fontSize: 24, fontWeight: "bold", marginTop: 15, marginBottom: 5 },
  subtitle: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  form: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 25,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  dateText: { fontSize: 16 },
  button: {
    borderRadius: 25,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonText: { fontSize: 18, fontWeight: "bold" },
  linkText: {
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
  themeToggle: {
    position: "absolute",
    top: -50,
    right: 0,
    padding: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
});
