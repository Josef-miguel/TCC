import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Image, Animated, ScrollView, ImageBackground } from 'react-native';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';

export default function Cadastro({ navigation }) {
  const [offset] = useState(new Animated.ValueXY({ x: 0, y: 90 }));
  const [opac] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.spring(offset.y, {
        toValue: 0,
        speed: 4,
        bounciness: 20
      }),
      Animated.timing(opac, {
        toValue: 1,
        duration: 2000,
      })
    ]).start();
  }, []);

  // Gradiente simulado com uma View com cores sobrepostas
  const GradientBackground = ({ children }) => (
    <View style={styles.gradientContainer}>
      <View style={[styles.gradientLayer, styles.gradientLayer1]} />
      <View style={[styles.gradientLayer, styles.gradientLayer2]} />
      <View style={[styles.gradientLayer, styles.gradientLayer3]} />
      {children}
    </View>
  );

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <KeyboardAvoidingView style={styles.container}>
          <View style={styles.logo}>
            <Image
              style={{ width: 320 }}
              resizeMode="contain"
              source={require('../../../assets/img/iconimg.png')}
            />
          </View>

          <Animated.View
            style={[
              styles.formulario,
              {
                opacity: opac,
                transform: [{ translateY: offset.y }]
              }
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder="Usuario"
              placeholderTextColor="#999"
              type="email"
              dataCorrect={false}
              onChangeText={() => { }}
            />

            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#999"
              secureTextEntry={true}
              dataCorrect={false}
              onChangeText={() => { }}
            />

            <TextInput
              style={styles.input}
              placeholder="CPF"
              placeholderTextColor="#999"
              type="numeric"
              dataCorrect={false}
              onChangeText={() => { }}
            />

            <TextInput
              style={styles.input}
              placeholder="Data de nascimento"
              placeholderTextColor="#999"
              type="numeric"
              dataCorrect={false}
              onChangeText={() => { }}
            />

      
      <View style={styles.viewBotao}>
      <TouchableOpacity 
        style={styles.botao}
       onPress={() => navigation.navigate('Home')}>
         <Text style={styles.textoBotao}>Entrar</Text>
      </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.botaoRecuperar}
       onPress={() => navigation.navigate('Login')}>
         <Text style={styles.textoRecuperar}>Já possui conta?</Text>
      </TouchableOpacity>

            <View style={styles.viewBotao}>
              <TouchableOpacity
                style={styles.botao}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.textoBotao}>Entrar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.botaoRecuperar}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.textoRecuperar}>Já possui conta?</Text>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
    position: 'relative',
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientLayer1: {
    backgroundColor: '#191919',
    opacity: 0.4,
  },
  gradientLayer2: {
    backgroundColor: '#0d2d3a',
    opacity: 0.3,
  },
  gradientLayer3: {
    backgroundColor: '#1a7487',
    opacity: 0.3,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logo: {
    flex: 1,
    justifyContent: 'center',
    marginBottom: 20,
  },
  formulario: {
    flex: 1,
    paddingBottom: 30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop: -50,
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
});