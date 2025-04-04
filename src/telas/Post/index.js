// Nesta seção deverão estar contidas todas as informações da viagem/excrusão como um mapa com a localização da excursão, imagens do destino, sistema de avaliação, um botão para entrar em contato com o organização e um botão de participar da viagem que leva para um modal de confirmação
// O modal de confirmação devem ter perguntas sobre quem irá viajar e quem vai ir na viagem, que por sua vez leva para um modal de pagamento na qual estão disponíveis opções de pagamento e um botão pagar que abrirá um alerta de pagamento concluído.
//Modal para o chat
// Modal de gostos ou algoritomo de recomendação antes da tela de feed em si.
// A tela de feed deverá conter uma sidebar com os botões Agenda, Minhas viagens. Para o organizador deverá ter um botão extra Criar viagem. Alem de um ícone de perfil que leva para a tela perfil
// Também deverá conter posts que levam para os mesmos e uma seção de mais populares, além de um sistema de pesquisa

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Image, Animated, ImageBackground} from 'react-native';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';


export default function Post({navigation}) {

  const[offset] = useState(new Animated.ValueXY({x:0, y:90}));
  const[opac] = useState(new Animated.Value(0));

  useEffect(()=> {
    Animated.parallel([
      Animated.spring(offset.y, {
        toValue:0, 
        speed:4,
        bounciness:20
      }),
      Animated.timing(opac, {
        toValue:1,
        duration:2000,
      })
    ]).start();
   
  }, []);
  
  return (
    <ImageBackground source={require('../../../assets/img/fundo.png')} style={styles.imgBg} >
                
    <KeyboardAvoidingView 
    style={styles.background}>
     <View style={styles.logo}>
       <Image style={{width:320}} resizeMode = "contain" source={require('../../../assets/img/iconimg.png')}></Image>
     </View>

    <Animated.View 
    style={[styles.formulario,
      {
        opacity: opac,
        transform: [{translateY: offset.y}]
      }
    
    ]}>
      
      <TextInput 
      style={styles.input}
      placeholder="Usuario"
      type='email'
      dataCorrect={false}
      onChangeText={()=>{}}
      ></TextInput>

      <TextInput
      style={styles.input}
      placeholder="Senha"
      secureTextEntry={true}
      dataCorrect={false}
      onChangeText={()=>{}}
      ></TextInput>
    
      
      <View style={styles.viewBotao}>
      <TouchableOpacity 
        style={styles.botao}
       onPress={() => navigation.navigate('Cadastro')}>
         <Text style={styles.textoBotao}>Entrar</Text>
      </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.botaoRecuperar}
       onPress={() => navigation.navigate('Cadastro')}>
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
    //backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logo: {
    flex: 1,
    
    justifyContent: 'center',
  },

  formulario: {
    flex: 1,
    paddingBottom:30,
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginTop:-50
  },

  input: {
    backgroundColor: '#FFF',
    marginBottom: 15,
    color: '#222',
    fontSize: 17,
    borderRadius: 7,
    padding:10,
    width: '90%'
  },

  viewBotao:{
    width: '90%',
    borderRadius: 7,
  },

  botao: {
    backgroundColor: '#1a7487',
    height:45,
    alignItems:'center',
    justifyContent:'center',
    borderRadius: 7,
    padding:10,
    
    
  },
  textoBotao:{
    color:'#FFF',
    fontSize:18
  },

  botaoRecuperar:{
    marginTop:15,
  },

  textoRecuperar:{
    color:'#FFF',
    
  },

  imgBg:{
    flex:1,
    width: null,
    height: null,
    opacity: 1,
    justifyContent: "flex-start",
    backgroundColor: '#000'
  },
});
