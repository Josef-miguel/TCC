import React, { useState, useContext } from "react";
import {
  Modal,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { ThemeContext } from "../../context/ThemeContext";
import { Picker } from "@react-native-picker/picker";

// Fallback theme para quando o contexto não estiver disponível
const defaultTheme = {
  primary: '#f37100',
  background: '#1a1b21',
  backgroundSecondary: '#2b2c33',
  textPrimary: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
  backgroundDark: '#363942',
  primaryLight: '#ff8c29',
  textTertiary: '#a0a4ad'
};

export default function Configuracoes({ modalVisible, setModalVisible }) {
  const [notificacoes, setNotificacoes] = useState(true);
  
  // Obter o contexto com fallback seguro
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || defaultTheme;
  const isDarkTheme = themeContext?.isDarkTheme ?? true;
  const toggleTheme = themeContext?.toggleTheme ?? (() => console.warn('ThemeContext não disponível'));
  const [selectedValue, setSelectedValue] = useState("java");
  const [visible, setVisible] = useState(false);

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: "center",
      alignItems: "center",
    },
    modal: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 10,
      padding: 20,
      width: "85%",
      maxHeight: "90%",
    },
    title: {
      fontSize: 20,
      color: theme.textPrimary,
      fontWeight: "bold",
      marginBottom: 20,
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
      backgroundColor: theme.backgroundSecondary,
      padding: 12,
      borderRadius: 8,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
    },
    label: {
      marginLeft: 10,
      fontSize: 16,
      color: theme.textPrimary,
    },
    closeBtn: {
      alignSelf: "center",
      marginTop: 10,
    },
    closeText: {
      color: theme.primary,
      fontSize: 16,
    },
  });

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Configurações</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Notificações */}
            <View style={styles.item}>
              <View style={styles.left}>
                <Icon name="bell-ring-outline" size={24} color={theme.primary} />
                <Text style={styles.label}>Notificações</Text>
              </View>
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                thumbColor={notificacoes ? theme.primary : "#888"}
                trackColor={{
                  false: theme.backgroundDark,
                  true: theme.primaryLight,
                }}
              />
            </View>

            {/* Tema claro */}
            <View style={styles.item}>
              <View style={styles.left}>
                <Icon
                  name={isDarkTheme ? "weather-night" : "weather-sunny"}
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.label}>Tema claro</Text>
              </View>
              <Switch
                value={!isDarkTheme}
                onValueChange={toggleTheme}
                thumbColor={!isDarkTheme ? theme.primary : "#888"}
                trackColor={{
                  false: theme.backgroundDark,
                  true: theme.primaryLight,
                }}
              />
            </View>

            {/* Idioma */}
            <TouchableOpacity
            onPress={() => setVisible(true)}
            style={styles.item}
            >
              <View style={styles.left}>
                <Icon name="translate" size={24} color={theme.primary} />
                <Text style={styles.label}>Idioma</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textTertiary} />
            </TouchableOpacity>
            <Modal visible={visible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedValue}
              onValueChange={(itemValue) => setSelectedValue(itemValue)}
            >
              <Picker.Item label="Português (Brasileiro)" value="PT-BR" />
              <Picker.Item label="English" value="ENG" />
              <Picker.Item label="官话" value="CMN" />
              <Picker.Item label="C#" value="csharp" />
            </Picker>
            <Button title="Fechar" onPress={() => setVisible(false)} />
          </View>
        </View>
      </Modal>

            {/* Alterar Senha */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="lock-reset" size={24} color={theme.primary} />
                <Text style={styles.label}>Alterar senha</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Excluir Conta */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="delete-outline" size={24} color="red" />
                <Text style={[styles.label, { color: "red" }]}>
                  Excluir conta
                </Text>
              </View>
            </TouchableOpacity>

            {/* Termos e Suporte */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon
                  name="file-document-outline"
                  size={24}
                  color={theme.primary}
                />
                <Text style={styles.label}>Termos e Suporte</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Botão Fechar */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
