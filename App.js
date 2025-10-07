import React, { useState, createContext, useContext, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  Dimensions
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import FlashMessage from "react-native-flash-message";
import { AuthProvider, useAuth } from "./services/AuthContext";
import { db } from "./services/firebase";
import Login from "./src/telas/Login";
import Cadastro from "./src/telas/Cadastro";
import Home from "./src/telas/Home";
import Agenda from "./src/telas/Agenda";
import Formapagamento from "./src/telas/Formapagamento";
import Chat from "./src/telas/Chat";
import ChatEmGrupo from "./src/telas/ChatEmGrupo";
import MinhasViagens from "./src/telas/MinhasViagens";
import Perfil from "./src/telas/Perfil";
import Avaliacoes from "./src/telas/Avaliacoes";
import Post from "./src/telas/Post";
import Favoritos from "./src/telas/Favoritos";
import Algoritmo from "./src/telas/Algoritmo";
import VisualizarPerfil from "./src/telas/VisualizarPerfil";
import CriarPost from "./src/modal/CriarPost";
import VerificacaoIdentidade from "./src/telas/VerificacaoIdentidade";
import Notificacoes from "./src/telas/Notificacoes";
import { Ionicons } from "@expo/vector-icons";
import { Provider as PaperProvider } from 'react-native-paper';
import { NotificationProvider } from './src/context/NotificationContext';
import { ThemeProvider, ThemeContext } from './src/context/ThemeContext';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

export const appContext = createContext();


const Tab = createBottomTabNavigator();
const { width, height } = Dimensions.get("window");

function Tabs() {
  const { theme } = useContext(ThemeContext);
  const { userData, setUserData } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState(false);

  // sempre sincroniza quando o userData mudar
  useEffect(() => {
    if (userData?.isOrganizer !== undefined) {
      setIsOrganizer(userData.isOrganizer);
    }
  }, [userData?.isOrganizer]);

  // Atualiza valor no Firestore
  const changeOrganizerStatus = async (newStatus) => {
    try {
      const userRef = doc(db, 'user', userData.uid);
      await updateDoc(userRef, { isOrganizer: newStatus });

      // Atualiza localmente também
      setUserData((prev) => ({
        ...prev,
        isOrganizer: newStatus,
      }));
      setIsOrganizer(newStatus);
    } catch (e) {
      console.error('Erro ao atualizar isOrganizer:', e);
    }
  };

  // Alterna entre organizador e não-organizador
  const toggleOrganizer = () => {
    if (userData?.isOrganizer !== undefined) {
      const newStatus = !userData.isOrganizer;
      changeOrganizerStatus(newStatus);
    }
  };

  // Mostra botão só se for organizador
  const activeOrganizerPost = () => {
    if (isOrganizer) {
      return (
        <TouchableOpacity
          style={[
            styles.createPostButton,
            {
              backgroundColor: theme?.cardBackground,
              borderColor: theme?.primary,
            },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle" size={50} color={theme?.primary} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <appContext.Provider value={{ isOrganizer, toggleOrganizer }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === "Home") iconName = "home";
            else if (route.name === "Perfil") iconName = "people-circle-outline";
            else if (route.name === "Criar Post") iconName = "add-circle";
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarStyle: {
            backgroundColor: theme?.backgroundSecondary || "#2b2c33",
            borderTopWidth: 1,
            borderColor: theme?.primary || "#f37100",
          },
          tabBarActiveTintColor: theme?.primary || "#f37100",
          tabBarInactiveTintColor: theme?.textTertiary || "#999999",
        })}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          options={{ headerShown: false }}
        />
        <Tab.Screen
          name="Criar Post"
          component={() => null}
          options={{
            tabBarButton: () => activeOrganizerPost(),
          }}
        />
        <Tab.Screen
          name="Perfil"
          component={Perfil}
          options={{ headerShown: false }}
        />
      </Tab.Navigator>

      <CriarPost modalVisible={modalVisible} setModalVisible={setModalVisible} />
    </appContext.Provider>
  );
}



export default function App() {
  const Stack = createStackNavigator();
  return (
    <I18nextProvider i18n={i18n}>
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <SafeAreaProvider style={{ flex: 1 }}>
            <PaperProvider>
              <NavigationContainer>
              <Stack.Navigator
                initialRouteName="Cadastro"
                screenOptions={{ 
                  headerShown: false,
                  gestureEnabled: true,
                  gestureDirection: 'horizontal',
                  transitionSpec: {
                    open: {
                      animation: 'timing',
                      config: {
                        duration: 400,
                      },
                    },
                    close: {
                      animation: 'timing',
                      config: {
                        duration: 400,
                      },
                    },
                  },
                  cardStyleInterpolator: ({ current, layouts, next }) => {
                    return {
                      cardStyle: {
                        transform: [
                          {
                            translateX: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [layouts.screen.width, 0],
                            }),
                          },
                          {
                            scale: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.9, 1],
                            }),
                          },
                          {
                            rotateY: current.progress.interpolate({
                              inputRange: [0, 1],
                              outputRange: ['15deg', '0deg'],
                            }),
                          },
                        ],
                        opacity: current.progress.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 0.5, 1],
                        }),
                      },
                      overlayStyle: {
                        opacity: current.progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 0.3],
                        }),
                      },
                    };
                  },
                }}
              >
                <Stack.Screen
                  name="Login"
                  component={Login}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Home"
                  component={Tabs}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Cadastro"
                  component={Cadastro}
                  options={{ headerShown: false }}
                ></Stack.Screen>

                <Stack.Screen
                  name="Agenda"
                  component={Agenda}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Formapagamento"
                  component={Formapagamento}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="VerificacaoIdentidade"
                  component={VerificacaoIdentidade}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="MinhasViagens"
                  component={MinhasViagens}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Perfil"
                  component={Perfil}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Post"
                  component={Post}
                  options={{ headerShown: false }}
                ></Stack.Screen>
                <Stack.Screen
                  name="Favoritos"
                  component={Favoritos}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Algoritmo"
                  component={Algoritmo}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Chat"
                  component={Chat}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ChatEmGrupo"
                  component={ChatEmGrupo}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Notificacoes"
                  component={Notificacoes}
                  options={{ headerShown: false }}
                />

                <Stack.Screen 
                  name="Avaliacoes" 
                  component={Avaliacoes} 
                  options={{ headerShown: false }}
                /> 
                <Stack.Screen
                  name="VisualizarPerfil"
                  component={VisualizarPerfil}
                  options={{ headerShown: false }}

                />
              </Stack.Navigator>
            </NavigationContainer>
            <FlashMessage position="top" style={{paddingVertical: 10}}/>
          </PaperProvider>
        </SafeAreaProvider>
      </AuthProvider>
    </NotificationProvider>
    </ThemeProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    height: height,
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  createPostButton: {
    top: -20,
    right: -30,
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    height: 70,
    borderRadius: 50,
    borderWidth: 1,
  
    // Sombras
    shadowColor: "#f37100",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8, // necessário no Android
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 15,
    minHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  imagePlaceholder: {
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  placeholderText: {
    color: "#888",
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: "top",
  },
  tripTypeContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  tripTypeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  mapPlaceholder: {
    height: 100,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
});
