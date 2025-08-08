import React, { useState, useEffect } from "react";
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

export default function Cadastro({ navigation }) {
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
        uid: uid, // salva o UID do Auth também, boa prática!
      });

      setSuccess(true);
      showMessage({
        message: "Cadastro Bem-Sucedido",
        description: "Bem-vindo!",
        type: "success",
        duration: 1800,
      });
      navigation.navigate("Algoritmo");
    } catch (e) {
      console.error("Erro ao adicionar usuário: ", e);
      showMessage({
        message: "Erro ao cadastrar",
        description: e.message || "CAMPO INVÁLIDO!",
        type: "warning",
        duration: 3000,
      });
    }
  }

  async function saveData() {
    if (!user || !password || !email || !cpf || !dataNasc) {
      showMessage({
        message: "Erro ao Salvar",
        description: "Preencha os Campos Obrigatórios!",
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
    <View style={styles.background}>
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
          </Animated.View>

          <Animated.View
            style={[
              styles.form,
              { opacity: opac, transform: [{ translateY: offset.y }] },
            ]}
          >
            {/* Campo Usuário */}
            <View style={styles.inputWrapper}>
              <Feather name="user" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Usuário"
                placeholderTextColor="#667"
                value={user}
                onChangeText={(text) => setUser(text)}
              />
            </View>

            {/* Campo E-mail */}
            <View style={styles.inputWrapper}>
              <Feather name="mail" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="E-mail"
                placeholderTextColor="#667"
                value={email}
                onChangeText={(text) => setEmail(text)}
              />
            </View>

            {/* Campo Senha */}
            <View style={styles.inputWrapper}>
              <Feather name="lock" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="Senha"
                placeholderTextColor="#667"
                value={password}
                secureTextEntry={true}
                onChangeText={(text) => setPassword(text)}
              />
            </View>

            {/* Campo CPF */}
            <View style={styles.inputWrapper}>
              <Feather name="clipboard" size={20} style={styles.icon} />
              <TextInput
                style={styles.input}
                placeholder="CPF"
                placeholderTextColor="#667"
                value={cpf}
                keyboardType="numeric"
                onChangeText={(text) => setCpf(text)}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Feather name="calendar" size={20} style={styles.icon} />
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShow(true)}
              >
                <Text style={{ color: "#fff", fontSize: 16 }}>
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

            <TouchableOpacity style={styles.button} onPress={saveData}>
              <Text style={styles.buttonText}>Registrar</Text>
            </TouchableOpacity>

            {/* Link para ir ao login */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkText}>Já possui conta? Faça login</Text>
            </TouchableOpacity>


          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
}

// Definição de estilos para a tela de cadastro
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#1a1b21" },
  scroll: { flexGrow: 1 },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logoContainer: { marginBottom: 30, alignItems: "center" },
  logo: { width: 100, height: 100, borderRadius: 0 },
  form: { width: "100%" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2b2c33",
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
  icon: { color: "#f37100", marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: "#fff" },
  button: {
    backgroundColor: "#f37100",
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
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  linkText: {
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    textDecorationLine: "underline",
  },
});
