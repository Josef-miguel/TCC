import React, { useState, createContext, useContext } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import FlashMessage from "react-native-flash-message";
import {AuthProvider} from "./services/AuthContext";



import Login from './src/telas/Login';
import Cadastro from './src/telas/Cadastro';
import Home from './src/telas/Home';
import Agenda from './src/telas/Agenda';
import Formapagamento from './src/telas/Formapagamento';
import Chat from './src/telas/Chat';
import Historico  from './src/telas/Historico';
import Perfil from './src/telas/Perfil';

import Post from './src/telas/Post';
import Favoritos from './src/telas/Favoritos';

import CriarPost from './src/modal/CriarPost';

export const appContext = createContext();

import {Ionicons} from '@expo/vector-icons';

const Tab= createBottomTabNavigator();
const organizerMode = () => {
  // tudo o que vai ser exclusivo do organizador. Ex: tema diferenciado e os caraio
}


function Tabs(){
  const [modalVisible, setModalVisible] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(true);
  
  const toggleOrganizer = () => {
    setIsOrganizer(prev => !prev);
  }
  
  const activeOrganizerPost = () => {
    if (isOrganizer){
      return(      
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => setModalVisible(true)} // Open the modal
          >
          <Ionicons name="add-circle" size={50} color="#3f64c7" />
          </TouchableOpacity>
              
      );
    } else if (!isOrganizer){
      return (null);
    }
  }
  
  
  return (
    <>
  <appContext.Provider value={{organizerMode, toggleOrganizer}}>
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Home') {
          iconName = focused
          ? 'home'
          : 'home';
        } else if (route.name === 'Home') {
          iconName = focused ? 'list' : 'list';
        }else if (route.name === 'Login') {
          iconName = focused ? 'people' : 'people';
        }
        
        else if (route.name === 'Cadastro'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'Post'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'Perfil'){
          iconName = focused ? 'people-circle-outline' : 'people-circle-outline';
        }
        else if (route.name === 'Historico'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'Formapagamento'){
          iconName = focused ? 'wallet-outline' : 'wallet-outline';
        }
        else if (route.name === 'Agenda'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'Criar Post') {
          iconName = focused ? 'add-circle' : 'add-circle'; 
        }
        else if (route.name === 'Chat') {
          iconName = focused ? 'add-circle' : 'add-circle'; 
        }
        
        
        //aqui define os ícones que irão aparecer nas Tabs
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      activeTintColor: '#3f64c7',
      inactiveTintColor: 'gray',      
    }}    
    >  
      {/* <Tab.Screen name= "Login" component={Login}></Tab.Screen>
      <Tab.Screen name= "Cadastro" component={Cadastro}></Tab.Screen> */}
       <Tab.Screen name= "Home" component={Home} options={{headerShown: false}}></Tab.Screen> 
        

       <Tab.Screen
          name="Criar Post"
          component={() => null}
          enabled={false}
          options={{
            tabBarButton: (props) => activeOrganizerPost()
              // (
              // <TouchableOpacity
              // style={styles.createPostButton}
              // onPress={() => setModalVisible(true)} // Open the modal
              // >
              // <Ionicons name="add-circle" size={50} color="#3f64c7" />
              // </TouchableOpacity>
              // ),
              }}
          />  

       <Tab.Screen name= "Perfil" component={Perfil} options={{headerShown: false}}></Tab.Screen> 
       {/* <Tab.Screen name= "Chat" component={Chat}></Tab.Screen>  */}
        

    </Tab.Navigator>
    <CriarPost modalVisible={modalVisible} setModalVisible={setModalVisible}></CriarPost>
    </appContext.Provider>
  </>


  );
}

export default function App() {

const Stack= createStackNavigator();
  return (
    <>
  <AuthProvider>
    <SafeAreaProvider>
    <NavigationContainer>
    <Stack.Navigator initialRouteName='Cadastro' screenOptions={{headerShown: false}}>

    
    <Stack.Screen name="Login" component={Login} options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen 
          name="Home" 
          component={Tabs}
          options={{headerShown: false}}
      ></Stack.Screen>
       <Stack.Screen name ="Cadastro" component={Cadastro} options={{headerShown: false}}></Stack.Screen> 
  
        <Stack.Screen name ="Agenda" component={Agenda} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Formapagamento" component={Formapagamento} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Historico" component={Historico} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Perfil" component={Perfil} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Post" component={Post} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name="Favoritos" component={Favoritos} options={{headerShown: false}} />
        <Stack.Screen name="Chat" component={Chat} options={{headerShown: false}} />

    </Stack.Navigator>
    <FlashMessage position="top"/>
  </NavigationContainer>
  </SafeAreaProvider>
  </AuthProvider>
</>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostButton: {
    top: -20,
    right: -30,
    justifyContent: 'center',
    alignItems: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    minHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  placeholderText: {
    color: '#888',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  tripTypeContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  tripTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  tripTypeButtonActive: {
    backgroundColor: '#e0f7fa',
    borderColor: '#00bcd4',
  },
  tripTypeText: {
    fontSize: 12,
    color: '#333',
  },
  tripTypeTextActive: {
    color: '#00bcd4',
    fontWeight: 'bold',
  },
  mapPlaceholder: {
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  termsText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  termsLink: {
    color: '#00bcd4',
    textDecorationLine: 'underline',
  },
  submitButton: {
    backgroundColor: '#00bcd4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});