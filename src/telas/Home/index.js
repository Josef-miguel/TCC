// Modal de gostos ou algoritomo de recomendação antes da tela de feed em si.
// A tela de feed deverá conter uma sidebar com os botões Agenda, Minhas viagens. Para o organizador deverá ter um botão extra Criar viagem. Alem de um ícone de perfil que leva para a tela perfil
// Também deverá conter posts que levam para os mesmos e uma seção de mais populares, além de um sistema de pesquisa

import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Image, Animated, ImageBackground} from 'react-native';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';


export default function Home({navigation}) {

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
// Ideia para modal do chat 
// import React, { useState, useCallback, useEffect } from 'react';
// import { View, StyleSheet, Platform } from 'react-native';
// import { GiftedChat, InputToolbar, Send, Bubble } from 'react-native-gifted-chat';
// import { Ionicons } from '@expo/vector-icons';

// export default function Login() {
//   const [messages, setMessages] = useState([]);

//   useEffect(() => {
//     setMessages([
//       {
//         _id: 3,
//         text: "No worries. Let me know if you need any help 😊",
//         createdAt: new Date(),
//         user: {
//           _id: 2,
//           name: 'Brooke',
//         },
//       },
//       {
//         _id: 2,
//         text: "It's going well. Thanks for asking!",
//         createdAt: new Date(),
//         user: {
//           _id: 1,
//           name: 'Lucas',
//         },
//       },
//       {
//         _id: 1,
//         text: 'How’s your project going?',
//         createdAt: new Date(),
//         user: {
//           _id: 2,
//           name: 'Brooke',
//         },
//       },
//     ]);
//   }, []);

//   const onSend = useCallback((newMessages = []) => {
//     setMessages((previousMessages) =>
//       GiftedChat.append(previousMessages, newMessages)
//     );
//   }, []);

//   const renderSend = (props) => (
//     <Send {...props}>
//       <View style={styles.sendButton}>
//         <Ionicons name="send" size={24} color="#007AFF" />
//       </View>
//     </Send>
//   );

//   const renderBubble = (props) => (
//     <Bubble
//       {...props}
//       wrapperStyle={{
//         right: {
//           backgroundColor: '#007AFF',
//         },
//         left: {
//           backgroundColor: '#f0f0f0',
//         },
//       }}
//       textStyle={{
//         right: {
//           color: '#fff',
//         },
//         left: {
//           color: '#000',
//         },
//       }}
//     />
//   );

//   const renderInputToolbar = (props) => (
//     <InputToolbar
//       {...props}
//       containerStyle={{
//         borderTopWidth: 1,
//         borderTopColor: '#e8e8e8',
//         padding: 4,
//       }}
//     />
//   );

//   return (
//     <GiftedChat
//       messages={messages}
//       onSend={(messages) => onSend(messages)}
//       user={{
//         _id: 1,
//       }}
//       renderSend={renderSend}
//       renderBubble={renderBubble}
//       renderInputToolbar={renderInputToolbar}
//       alwaysShowSend
//       placeholder="You're the best"
//     />
//   );
// }

// const styles = StyleSheet.create({
//   sendButton: {
//     marginRight: 10,
//     marginBottom: 5,
//   },
// });
