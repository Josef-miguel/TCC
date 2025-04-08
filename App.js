import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';





import Login from './src/telas/Login';
import Cadastro from './src/telas/Cadastro'
import Home from './src/telas/Home'
import agenda from './src/telas/agenda'
import formapagamento from './src/telas/formapagamento'
import historico from './src/telas/historico'
import perfil from './src/telas/perfil'
import Post from './src/telas/Post'
import Registro from './src/telas/Registro'
import {Ionicons} from '@expo/vector-icons';

const Tab= createBottomTabNavigator();

function Tabs(){
  return (
    <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Produtos') {
          iconName = focused
            ? 'home'
            : 'home';
        } else if (route.name === 'Produtos') {
          iconName = focused ? 'list' : 'list';
        }else if (route.name === 'Login') {
          iconName = focused ? 'people' : 'people';
        }
        
        else if (route.name === 'Cadastro'){
          iconName = focused ? 'albums-outline' : 'albums-outline';
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
      <Tab.Screen name= "Login" component={Login}></Tab.Screen>
      <Tab.Screen name= "Cadastro" component={Cadastro}></Tab.Screen>
       <Tab.Screen name= "Home" component={Home}></Tab.Screen> 
       <Tab.Screen name= "agenda" component={agenda}></Tab.Screen> 
       <Tab.Screen name= "formapagamento" component={formapagamento}></Tab.Screen> 
       <Tab.Screen name= "historico" component={historico}></Tab.Screen> 
       <Tab.Screen name= "perfil" component={perfil}></Tab.Screen> 
       <Tab.Screen name= "Post" component={Post}></Tab.Screen> 
       <Tab.Screen name= "Registro" component={Registro}></Tab.Screen> 
      {/* <Tab.Screen name= "Produtos" component={Produtos}></Tab.Screen>
      <Tab.Screen name= "Cadastro" component={Cadastro}></Tab.Screen> */}
    </Tab.Navigator>
  );
}

export default function App() {

const Stack= createStackNavigator();
  return (
  <NavigationContainer>
    <Stack.Navigator initialRouteName='Login'>

    <Stack.Screen name="Login" component={Login} options={{headerShown: false}}></Stack.Screen>
      <Stack.Screen 
          name="Produtos" 
          component={Tabs}
          options={{headerShown: false}}
          >

      </Stack.Screen>
       <Stack.Screen name ="Cadastro" component={Cadastro} options={{headerShown: false}}></Stack.Screen> 
        <Stack.Screen name ="Home" component={Home} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="agenda" component={agenda} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="formapagamento" component={formapagamento} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="historico" component={historico} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="perfil" component={perfil} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Post" component={Post} options={{headerShown: false}}></Stack.Screen>  
        <Stack.Screen name ="Registro" component={Registro} options={{headerShown: false}}></Stack.Screen>  

{/* miguel */}

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
// teste