import React from 'react';

import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Registro from './src/telas/Registro';
import Post from './src/telas/Post';
import feed from './src/telas/feed';
import perfil from './src/telas/perfil';

import {Ionicons} from '@expo/vector-icons'
import { TextInput } from 'react-native-web';
const Tab = createBottomTabNavigator();

function Tabs(){

   return(
 <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        color= '#d0d'
        size = 30
        if (route.name === 'Post') {
          iconName = focused
            ? 'home-outline'
            : 'home-outline';
        } else if (route.name === 'historico') {
          iconName = focused ? 'person-outline' : 'person-outline';
        }else if (route.name === 'formapagamento') {
          iconName = focused ? 'people-outline' : 'people-outline';
        }
        
        //aqui define os ícones que irão aparecer nas Tabs
        return <Ionicons name={iconName} size={size} color={color} />;
      },
    })}
    tabBarOptions={{
      labelStyle: {
        fontSize: 12},
      activeTintColor: '#3f64c7',
      inactiveTintColor: 'gray',      
    }}    
    >
      <Tab.Screen name= "historico" component={historico}></Tab.Screen>
      <Tab.Screen name= "formapagamento" component={formapagemento}></Tab.Screen>
    </Tab.Navigator>
   )
}

export default function App() {

   
  const Stack = createStackNavigator();


  return (
    <NavigationContainer>
      <Text>Email:</Text>
      <TextInput></TextInput>
      <Text>Senha:</Text>
      <TextInput></TextInput>
      <Text>CPF:</Text>
      <TextInput></TextInput>
      <Text>Data de nascimento:</Text>
      <TextInput></TextInput>
    

    <Stack.Navigator initialRouteName='Post'>

      <Stack.Screen 
          name="historico" 
          component={Tabs}
          options={{
            title:'Meu Aplicativo',
            headerStyle:{
            backgroundColor: '#D80303',
            },
            headerTintColor: '#FFF' , 
            headerShown: true         
          }}
          >

      </Stack.Screen>
      <Stack.Screen name="Post" component={Post} options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen name="feed" component={feed} ></Stack.Screen>      
      <Stack.Screen name="historico" component={historico} ></Stack.Screen>
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
});
