import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer} from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';





import Login from './src/telas/Login';
import Cadastro from './src/telas/Cadastro'
 import Home from './src/telas/Home'
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
