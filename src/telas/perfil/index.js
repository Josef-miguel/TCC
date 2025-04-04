import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Image, Animated, ImageBackground } from 'react-native';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';
import { Switch } from "react-native";
export default function perfil({navigation}) {

  const [offset] = useState(new Animated.ValueXY({x: 0, y: 90}));
  const [opac] = useState(new Animated.Value(0));
  const [vendedor,setVendedor] = useState("");
  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, {
        toValue: 0, 
        speed: 4,
        bounciness: 20,
      }),
      Animated.timing(opac, {
        toValue: 1,
        duration: 2000,
      })
    ]).start();
   
  }, []);
  const isWeb = typeof navigator !== "undefined" && navigator.userAgent;

  return (
    <ImageBackground source={require('../../../assets/img/fundo.png')} style={styles.imgBg} >
      <KeyboardAvoidingView style={styles.background}>
        <View style={styles.logo}></View>

        <Animated.View style={[styles.formulario, { opacity: opac, transform: [{ translateY: offset.y }] }]}>
     

          {/* Ícone de perfil redondo (sem input) */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>P</Text> {/* Exemplo: Exibe a inicial "P" */}
          </View>

          {/* Outros campos */}
          <TextInput 
            style={styles.input}
            placeholder="Nome:"
            type="text"
            dataCorrect={false}
            onChangeText={() => {}}
          />
          <TextInput
            style={styles.input}
            placeholder="Sobrenome:"
            type="text"
            dataCorrect={false}
            onChangeText={() => {}}
          />
          <TextInput
            style={styles.input}
            placeholder="Descrição:"
            type="text"
            dataCorrect={false}
            onChangeText={() => {}}
          />
          
          <View style={styles.viewBotao}>
            <TouchableOpacity style={styles.botao} onPress={() => navigation.navigate('Cadastro')}>
              <Text style={styles.textoBotao}>Formas de pagamento</Text>
            </TouchableOpacity>
          </View>
          <Text>Ativar modo organizador</Text>
          <Switch
            style={isWeb ? {transform: [{translate: -2}]} : {} }
            trackColor={{ false: "#ccc", true: "#4caf50" }}
            thumbColor="#f45"
            value={vendedor}
            onValueChange={(vendedor) => setVendedor(vendedor)}
          ></Switch>
          <TouchableOpacity style={styles.botaoRecuperar} onPress={() => navigation.navigate('Cadastro')}>
            <Text style={styles.textoRecuperar}>Ainda não possui uma conta? Registre-se</Text>
          </TouchableOpacity>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    flex: 1,
    justifyContent: 'center',
  },

  formulario: {
    flex: 1,
    paddingBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop: -50,
  },

  bolinha: {
    backgroundColor: '#FFF',
    marginBottom: 15,
    color: '#222',
    fontSize: 17,
    borderRadius: 100,
    padding: 10,
    width: '90%',
  },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: '#ccc',
    overflow: 'hidden',
    marginBottom: 20,  // Distância do ícone do restante dos campos
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  iconText: {
    fontSize: 30,
    textAlign: 'center',
    lineHeight: 80,  // Centraliza verticalmente
    fontWeight: 'bold',
    color: '#222',
  },

  input: {
    backgroundColor: '#FFF',
    marginBottom: 15,
    color: '#222',
    fontSize: 17,
    borderRadius: 7,
    padding: 10,
    width: '90%',
  },

  viewBotao: {
    width: '90%',
    borderRadius: 7,
  },

  botao: {
    backgroundColor: '#1a7487',
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7,
    padding: 10,
  },

  textoBotao: {
    color: '#FFF',
    fontSize: 18,
  },

  botaoRecuperar: {
    marginTop: 15,
  },

  textoRecuperar: {
    color: '#FFF',
  },

  imgBg: {
    flex: 1,
    width: null,
    height: null,
    opacity: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#000',
  },
});
