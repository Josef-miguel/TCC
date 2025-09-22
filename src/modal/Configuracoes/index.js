import React, { useState, useContext, useEffect } from "react";
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
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback theme para quando o contexto não estiver disponível
const defaultTheme = {
  primary: '#f37100',
  background: '#1a1b21',
  backgroundSecondary: '#2b2c33',
  textPrimary: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
  backgroundDark: '#363942',
  primaryLight: '#ff8c29',
  textTertiary: '#a0a0a0'
};

export default function Configuracoes({ modalVisible, setModalVisible }) {
  const [notificacoes, setNotificacoes] = useState(true);
  
  // Obter o contexto com fallback seguro
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || defaultTheme;
  const isDarkTheme = themeContext?.isDarkTheme ?? true;
  const toggleTheme = themeContext?.toggleTheme ?? (() => console.warn('ThemeContext não disponível'));

  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language); 
  const [showPicker, setShowPicker] = useState(false);

  // Carregar idioma salvo ao abrir o modal
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@app_language');
        if (savedLanguage) {
          setSelectedLanguage(savedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    if (modalVisible) {
      loadLanguage();
    }
  }, [modalVisible]);

  const changeLanguage = async (language) => {
    try {
      setSelectedLanguage(language);
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('@app_language', language);
      setShowPicker(false);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

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
      textAlign: "center",
    },
    item: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 15,
      backgroundColor: theme.backgroundDark,
      padding: 12,
      borderRadius: 8,
    },
    left: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    label: {
      marginLeft: 10,
      fontSize: 16,
      color: theme.textPrimary,
    },
    closeBtn: {
      alignSelf: "center",
      marginTop: 10,
      padding: 10,
      backgroundColor: theme.primary,
      borderRadius: 5,
    },
    closeText: {
      color: "white",
      fontSize: 16,
      fontWeight: "bold",
    },
    right: {
      flexDirection: "row",
      alignItems: "center",
    },
    selected: {
      fontSize: 14,
      marginRight: 8,
      color: theme.primary,
    },
    pickerContainer: {
      backgroundColor: theme.backgroundDark,
      borderRadius: 8,
      marginBottom: 15,
      overflow: "hidden",
    },
    picker: {
      height: 50,
      width: "100%",
      color: theme.textPrimary,
    },
  });

  // Função para obter o nome do idioma
  const getLanguageName = (code) => {
    switch (code) {
      case 'pt': return t('settings.languages.ptBR');
      case 'en': return t('settings.languages.en');
      case 'zh': return t('settings.languages.zhCN');
      default: return code;
    }
  };

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{t("settings.title")}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Notificações */}
            <View style={styles.item}>
              <View style={styles.left}>
                <Icon name="bell-ring-outline" size={24} color={theme.primary} />
                <Text style={styles.label}>{t("settings.notifications")}</Text>
              </View>
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                thumbColor={notificacoes ? theme.primary : "#f4f3f4"}
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
                <Text style={styles.label}>{t("settings.lightTheme")}</Text>
              </View>
              <Switch
                value={!isDarkTheme}
                onValueChange={toggleTheme}
                thumbColor={!isDarkTheme ? theme.primary : "#f4f3f4"}
                trackColor={{
                  false: theme.backgroundDark,
                  true: theme.primaryLight,
                }}
              />
            </View>

            {/* Idioma */}
            <TouchableOpacity
              onPress={() => setShowPicker(!showPicker)}
              style={styles.item}
            >
              <View style={styles.left}>
                <Icon name="translate" size={24} color={theme.primary} />
                <Text style={styles.label}>{t("settings.language")}</Text>
              </View>
              <View style={styles.right}>
                <Text style={styles.selected}>{getLanguageName(selectedLanguage)}</Text>
                <Icon
                  name={showPicker ? "chevron-up" : "chevron-down"}
                  size={24}
                  color={theme.textTertiary}
                />
              </View>
            </TouchableOpacity>

            {/* Picker exibido abaixo do botão */}
            {showPicker && (
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedLanguage}
                  onValueChange={changeLanguage}
                  style={styles.picker}
                >
                  <Picker.Item label={t('settings.languages.ptBR')} value="pt" />
                  <Picker.Item label={t('settings.languages.en')} value="en" />
                  <Picker.Item label={t('settings.languages.zhCN')} value="zh" />
                </Picker>
              </View>
            )}

            {/* Alterar Senha */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="lock-reset" size={24} color={theme.primary} />
                <Text style={styles.label}>{t("settings.changePassword")}</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Excluir Conta */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="delete-outline" size={24} color="red" />
                <Text style={[styles.label, { color: "red" }]}>
                  {t("settings.deleteAccount")}
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
                <Text style={styles.label}>{t("settings.termsSupport")}</Text>
              </View>
              <Icon name="chevron-right" size={24} color={theme.textTertiary} />
            </TouchableOpacity>

            {/* Botão Fechar */}
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeBtn}
            >
              <Text style={styles.closeText}>{t("settings.close")}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}