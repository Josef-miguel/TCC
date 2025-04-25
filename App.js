import React, { useState } from 'react';
import { StyleSheet, Text, View, Modal, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';





import Login from './src/telas/Login';
import Cadastro from './src/telas/Cadastro';
import Home from './src/telas/Home';
import Agenda from './src/telas/Agenda';
import formapagamento from './src/telas/Formapagamento';
import Historico  from './src/telas/Historico';
import perfil from './src/telas/Perfil';
import Post from './src/telas/Post';

import CriarPost from './src/modal/CriarPost';


import {Ionicons} from '@expo/vector-icons';


const Tab= createBottomTabNavigator();

function Tabs(){
  const [modalVisible, setModalVisible] = useState(false);

  
  return (
    <>
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
        else if (route.name === 'perfil'){
          iconName = focused ? 'people-circle-outline' : 'people-circle-outline';
        }
        else if (route.name === 'Historico'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'formapagamento'){
          iconName = focused ? 'wallet-outline' : 'wallet-outline';
        }
        else if (route.name === 'Agenda'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
        }
        else if (route.name === 'Criar Post') {
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
       <Tab.Screen name= "Home"component={Home}></Tab.Screen> 
       <Tab.Screen name= "Agenda"  component={Agenda}></Tab.Screen> 
       <Tab.Screen
          name="Criar Post"
          component={() => null}
          options={{
            tabBarButton: (props) => (
              <TouchableOpacity
                style={styles.createPostButton}
                onPress={() => setModalVisible(true)} // Open the modal
              >
                <Ionicons name="add-circle" size={50} color="#3f64c7" />
              </TouchableOpacity>
            ),
          }}
        /> 
       <Tab.Screen name= "formapagamento" component={formapagamento}></Tab.Screen> 
       <Tab.Screen name= "Historico" component={Historico}></Tab.Screen> 
       <Tab.Screen name= "perfil" component={perfil}></Tab.Screen> 
       <Tab.Screen name= "Post" component={Post}></Tab.Screen> 

      {/* <Tab.Screen name= "Produtos" component={Produtos}></Tab.Screen>
      <Tab.Screen name= "Cadastro" component={Cadastro}></Tab.Screen> */}
    </Tab.Navigator>
    <CriarPost modalVisible={modalVisible} setModalVisible={setModalVisible}></CriarPost>
  </>
  
        // aqui

  );
}

export default function App() {

const Stack= createStackNavigator();
  return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName='Cadastro'>

    <Stack.Screen name="Login" component={Login} options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen 
          name="Home" 
          component={Tabs}
          options={{headerShown: false}}
          >

      </Stack.Screen>
       <Stack.Screen name ="Cadastro" component={Cadastro} options={{headerShown: false}}></Stack.Screen> 
  
        <Stack.Screen name ="Agenda" component={Agenda} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Forma de pagamento" component={formapagamento} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Historico" component={Historico} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Perfil" component={perfil} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Post" component={Post} options={{headerShown: false}}></Stack.Screen>  


    </Stack.Navigator>
  </NavigationContainer>
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