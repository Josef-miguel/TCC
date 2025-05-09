import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Image, Animated, ImageBackground, Alert} from 'react-native';
import { TouchableOpacity, TextInput } from 'react-native-gesture-handler';
import { showMessage } from "react-native-flash-message";


import api from "../../../services/api";


export default function Login({navigation}) {
  
  const[offset] = useState(new Animated.ValueXY({x:0, y:90}));
  const[opac] = useState(new Animated.Value(0));
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  
  useEffect(()=> {
    Animated.parallel([
      Animated.spring(offset.y, {
        toValue:0, 
        speed:4,
        bounciness:20,
        useNativeDriver: true
      }),
      Animated.timing(opac, {
        toValue:1,
        duration:2000,
        useNativeDriver: true
      })
    ]).start();
    
  }, []);
  function limparCampos(){
    setUser('');
    setPassword('');
    
  }
  
  async function saveData(){
    if (!user || !password) {
      showMessage({
        message: "Erro ao Salvar",
        description: 'Preencha os Campos Obrigatórios!',
        type: "warning",
      });
      return;
    }
    
    try{
      const obj = {
        user : user || '',
        password : password || ''
      }
      
      const res = await api.post('TCC/login.php', obj);
      console.log(res.data);
      if (res.status !== 200) {
        throw new Error('Erro na comunicação com o servidor');
      }
      if (res.data.success == false) {
        showMessage({
          message: "Erro ao Logar",
          description: res.data.message || 'Usuário ou senha inválidos!',
          type: "warning",
          duration: 3000,
        });
        limparCampos();
        return;
      }
      else if (res.data.success == true){
        setSuccess(true);
        showMessage({
          message: "Login Bem-Sucedido",
          description: "Bem-vindo!",
          type: "success",
          duration: 800,
        });
        navigation.navigate('Home');
      }
      else{
        Alert.alert("ta tudo errado");
      }
      
    
  } catch (error) {
    console.log(error)
    Alert.alert("Ops", "Alguma coisa deu errado, tente novamente. " + error);
    setSuccess(false);
  }
  }
  
  
  
  return (
    // <ImageBackground source={require('../../../assets/img/bg2.png')} style={styles.imgBg}>
    
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
      
      <View style={styles.areaInput}>
        <Image source={require('../../../assets/img/icons/profile-icon.png')} style={styles.icon}></Image>
        <TextInput 
          style={styles.input}
          placeholder="Usuario"
          type='email'
          dataCorrect={false}
          onChangeText={user => setUser(user)}
        ></TextInput>
      </View>

      <View style={styles.areaInput}>
        <Image source={require('../../../assets/img/icons/lock-icon.png')} style={styles.icon}></Image>
        <TextInput
          style={styles.input}
          placeholder="Senha"
          secureTextEntry={true}
          dataCorrect={false}
          onChangeText={password => setPassword(password)}
        ></TextInput>
      </View>
    
      
      <View style={styles.viewBotao}>
      <TouchableOpacity 
        style={styles.botao}
       onPress={() => {
        saveData();
       }}>
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
    // </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: 'center',
    justifyContent: 'center',
  },

  icon: {
    width: 32,
    height: 32,
    marginVertical: 'auto'
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

  areaInput: {
    flexDirection: 'row',
    backgroundColor: '#FFF000',
    color: '#222',
    borderRadius: 7,
    padding:5,
    width: '90%',
    backgroundColor: '#FFF',
    marginBottom: 15
  },

  input: {
    marginVertical: 'auto',
    marginLeft: 5,
    fontSize: 16
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
    width: '100%',
    height: '100%',
    opacity: 1,
    justifyContent: "flex-start",
    backgroundColor: '#000'
  },
});
