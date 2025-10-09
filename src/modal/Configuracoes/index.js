

import React, { useState, useContext, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Switch,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  TextInput
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from "../../context/ThemeContext";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from "../../../services/firebase";
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";

const Configuracoes = ({ modalVisible, setModalVisible }) => {
  const [notificacoes, setNotificacoes] = useState(true);
  const [biometricAuth, setBiometricAuth] = useState(false);
  
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;
  const isDarkTheme = themeContext?.isDarkTheme ?? true;
  const toggleTheme = themeContext?.toggleTheme ?? (() => {});

  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Estados para alterar senha
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('@app_language');
        const savedNotifications = await AsyncStorage.getItem('@app_notifications');
        const savedBiometric = await AsyncStorage.getItem('@app_biometric');
        
        if (savedLanguage) setSelectedLanguage(savedLanguage);
        if (savedNotifications !== null) setNotificacoes(JSON.parse(savedNotifications));
        if (savedBiometric !== null) setBiometricAuth(JSON.parse(savedBiometric));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };

    if (modalVisible) {
      loadSettings();
    }
  }, [modalVisible]);

  const changeLanguage = async (language) => {
    try {
      setSelectedLanguage(language);
      await i18n.changeLanguage(language);
      await AsyncStorage.setItem('@app_language', language);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificacoes(value);
    try {
      await AsyncStorage.setItem('@app_notifications', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving notification setting:', error);
    }
  };

  const toggleBiometricAuth = async (value) => {
    setBiometricAuth(value);
    try {
      await AsyncStorage.setItem('@app_biometric', JSON.stringify(value));
    } catch (error) {
      console.error('Error saving biometric setting:', error);
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleChangePassword = () => {
    setChangePasswordModalVisible(true);
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return "A senha deve ter pelo menos 6 caracteres";
    }
    return null;
  };

  const handleChangePasswordSubmit = async () => {
    // Validações
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Erro", "Por favor, preencha todos os campos");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Erro", "As senhas não coincidem");
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert("Erro", passwordError);
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert("Erro", "A nova senha deve ser diferente da senha atual");
      return;
    }

    setIsChangingPassword(true);

    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        Alert.alert("Erro", "Usuário não encontrado");
        return;
      }

      // Reautenticar o usuário
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Atualizar a senha
      await updatePassword(user, newPassword);

      Alert.alert(
        "Sucesso", 
        "Senha alterada com sucesso!",
        [
          {
            text: "OK",
            onPress: () => {
              setChangePasswordModalVisible(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }
          }
        ]
      );
    } catch (error) {
      console.error("Erro ao alterar senha:", error);
      
      let errorMessage = "Erro ao alterar senha";
      if (error.code === 'auth/wrong-password') {
        errorMessage = "Senha atual incorreta";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "A nova senha é muito fraca";
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = "Por favor, faça login novamente para alterar a senha";
      }
      
      Alert.alert("Erro", errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closeChangePasswordModal = () => {
    setChangePasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("settings.deleteAccount"),
      t("settings.deleteAccountMessage"),
      [
        { text: t("common.cancel"), style: "cancel" },
        { 
          text: t("common.delete"), 
          style: "destructive",
          onPress: () => console.log("Excluir conta") 
        }
      ]
    );
  };

  const handleTermsAndSupport = () => {
    Alert.alert(
      t("settings.termsAndSupport"),
      t("settings.termsAndSupportMessage"),
      [
        { text: "Termos de Uso", onPress: () => console.log("Abrir termos") },
        { text: "Suporte", onPress: () => console.log("Abrir suporte") },
        { text: t("common.close"), style: "cancel" }
      ]
    );
  };

  const SettingItem = ({ 
    icon, 
    title, 
    rightComponent, 
    onPress, 
    isLast = false,
    isDanger = false 
  }) => (
    <TouchableOpacity 
      style={[
        styles.settingItem,
        { 
          backgroundColor: theme?.background,
          borderBottomColor: theme?.border,
          borderBottomWidth: isLast ? 0 : 1
        }
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isDanger ? '#ff3b30' : theme?.primary} 
        />
        <Text style={[
          styles.settingLabel,
          { color: isDanger ? '#ff3b30' : theme?.textPrimary }
        ]}>
          {title}
        </Text>
      </View>
      {rightComponent}
    </TouchableOpacity>
  );

  const SwitchSetting = ({ value, onValueChange, icon, title }) => (
    <View style={[
      styles.settingItem,
      { 
        backgroundColor: theme?.background,
        borderBottomColor: theme?.border
      }
    ]}>
      <View style={styles.settingLeft}>
        <Ionicons name={icon} size={22} color={theme?.primary} />
        <Text style={[styles.settingLabel, { color: theme?.textPrimary }]}>
          {title}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        thumbColor={value ? theme?.primary : '#f4f3f4'}
        trackColor={{ false: '#767577', true: theme?.primary + '80' }}
      />
    </View>
  );

  const LanguageOption = ({ code, name, isSelected, onSelect }) => (
    <TouchableOpacity
      style={[
        styles.languageOption,
        { 
          backgroundColor: theme?.background,
          borderColor: theme?.border
        },
        isSelected && { backgroundColor: theme?.primary + '20' }
      ]}
      onPress={() => onSelect(code)}
    >
      <Text style={[
        styles.languageText,
        { color: theme?.textPrimary },
        isSelected && { color: theme?.primary, fontWeight: '600' }
      ]}>
        {name}
      </Text>
      {isSelected && (
        <Ionicons name="checkmark" size={20} color={theme?.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal 
      visible={modalVisible} 
      transparent 
      animationType="slide"
      statusBarTranslucent
    >
      <View style={[styles.overlay, { backgroundColor: theme?.overlay }]}>
        <View style={[
          styles.modalContainer, 
          { backgroundColor: theme?.backgroundSecondary }
        ]}>
          {/* Header */}
          <View style={[
            styles.header,
            { backgroundColor: theme?.backgroundSecondary }
          ]}>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.backButton}
            >
              <Ionicons name="close" size={28} color={theme?.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
              {t("settings.title")}
            </Text>
            <View style={styles.headerRight} />
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Seção: Preferências */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                {t("settings.preferences")}
              </Text>
              
              <View style={[
                styles.sectionContent,
                { backgroundColor: theme?.background }
              ]}>
                <SwitchSetting
                  icon="notifications-outline"
                  title={t("settings.notifications")}
                  value={notificacoes}
                  onValueChange={toggleNotifications}
                />
                
                <SwitchSetting
                  icon={isDarkTheme ? "moon" : "sunny"}
                  title={t("settings.lightTheme")}
                  value={!isDarkTheme}
                  onValueChange={toggleTheme}
                />
                
                <SwitchSetting
                  icon="finger-print"
                  title={t("settings.biometricAuth")}
                  value={biometricAuth}
                  onValueChange={toggleBiometricAuth}
                />

                <TouchableOpacity
                  style={[
                    styles.languageSelector,
                    { backgroundColor: theme?.background }
                  ]}
                  onPress={() => toggleSection('language')}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons name="language" size={22} color={theme?.primary} />
                    <Text style={[styles.settingLabel, { color: theme?.textPrimary }]}>
                      {t("settings.language")}
                    </Text>
                  </View>
                  <View style={styles.languageSelectorRight}>
                    <Text style={[styles.currentLanguage, { color: theme?.textSecondary }]}>
                      {selectedLanguage === 'pt' ? 'Português' : 
                       selectedLanguage === 'en' ? 'English' : '中文'}
                    </Text>
                    <Ionicons 
                      name={expandedSection === 'language' ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color={theme?.textTertiary} 
                    />
                  </View>
                </TouchableOpacity>

                {expandedSection === 'language' && (
                  <View style={styles.languageOptions}>
                    <LanguageOption
                      code="pt"
                      name="Português (Brasil)"
                      isSelected={selectedLanguage === 'pt'}
                      onSelect={changeLanguage}
                    />
                    <LanguageOption
                      code="en"
                      name="English"
                      isSelected={selectedLanguage === 'en'}
                      onSelect={changeLanguage}
                    />
                    <LanguageOption
                      code="zh"
                      name="中文 (Chinês)"
                      isSelected={selectedLanguage === 'zh'}
                      onSelect={changeLanguage}
                    />
                  </View>
                )}
              </View>
            </View>

            {/* Seção: Conta */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                {t("settings.account")}
              </Text>
              
              <View style={[
                styles.sectionContent,
                { backgroundColor: theme?.background }
              ]}>
                <SettingItem
                  icon="lock-closed-outline"
                  title={t("settings.changePassword")}
                  rightComponent={
                    <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
                  }
                  onPress={handleChangePassword}
                />
                
                <SettingItem
                  icon="trash-outline"
                  title={t("settings.deleteAccount")}
                  isDanger={true}
                  onPress={handleDeleteAccount}
                />
              </View>
            </View>

            {/* Seção: Ajuda e Suporte */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                {t("settings.helpSupport")}
              </Text>
              
              <View style={[
                styles.sectionContent,
                { backgroundColor: theme?.background }
              ]}>
                <SettingItem
                  icon="document-text-outline"
                  title={t("settings.termsAndSupport")}
                  rightComponent={
                    <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
                  }
                  onPress={handleTermsAndSupport}
                />
                
                <SettingItem
                  icon="help-circle-outline"
                  title={t("settings.faq")}
                  rightComponent={
                    <Ionicons name="chevron-forward" size={20} color={theme?.textTertiary} />
                  }
                  onPress={() => console.log("Abrir FAQ")}
                />
                
                <SettingItem
                  icon="star-outline"
                  title={t("settings.rateApp")}
                  onPress={() => console.log("Avaliar app")}
                  isLast={true}
                />
              </View>
            </View>

            {/* Informações do App */}
            <View style={styles.appInfo}>
              <Text style={[styles.appVersion, { color: theme?.textTertiary }]}>
                JSG Excursões v1.0.0
              </Text>
              <Text style={[styles.appCopyright, { color: theme?.textTertiary }]}>
                © 2024 JSG. Todos os direitos reservados.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Modal de Alterar Senha */}
      <Modal
        visible={changePasswordModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeChangePasswordModal}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme?.overlay }]}>
          <View style={[styles.changePasswordModal, { backgroundColor: theme?.backgroundSecondary }]}>
            <View style={[styles.changePasswordHeader, { borderBottomColor: theme?.border }]}>
              <TouchableOpacity onPress={closeChangePasswordModal}>
                <Ionicons name="close" size={24} color={theme?.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.changePasswordTitle, { color: theme?.textPrimary }]}>
                Alterar Senha
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.changePasswordContent} showsVerticalScrollIndicator={false}>
              <Text style={[styles.changePasswordSubtitle, { color: theme?.textSecondary }]}>
                Para sua segurança, digite sua senha atual e a nova senha desejada.
              </Text>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: theme?.textPrimary }]}>
                  Senha Atual
                </Text>
                <TextInput
                  style={[styles.passwordInput, { 
                    backgroundColor: theme?.background,
                    borderColor: theme?.border,
                    color: theme?.textPrimary
                  }]}
                  placeholder="Digite sua senha atual"
                  placeholderTextColor={theme?.textTertiary}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: theme?.textPrimary }]}>
                  Nova Senha
                </Text>
                <TextInput
                  style={[styles.passwordInput, { 
                    backgroundColor: theme?.background,
                    borderColor: theme?.border,
                    color: theme?.textPrimary
                  }]}
                  placeholder="Digite a nova senha"
                  placeholderTextColor={theme?.textTertiary}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={[styles.passwordHint, { color: theme?.textTertiary }]}>
                  Mínimo de 6 caracteres
                </Text>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={[styles.inputLabel, { color: theme?.textPrimary }]}>
                  Confirmar Nova Senha
                </Text>
                <TextInput
                  style={[styles.passwordInput, { 
                    backgroundColor: theme?.background,
                    borderColor: theme?.border,
                    color: theme?.textPrimary
                  }]}
                  placeholder="Confirme a nova senha"
                  placeholderTextColor={theme?.textTertiary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.changePasswordButton,
                  { backgroundColor: theme?.primary },
                  isChangingPassword && styles.disabledButton
                ]}
                onPress={handleChangePasswordSubmit}
                disabled={isChangingPassword}
              >
                <Text style={styles.changePasswordButtonText}>
                  {isChangingPassword ? "Alterando..." : "Alterar Senha"}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 36,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 20,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  languageSelectorRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLanguage: {
    fontSize: 14,
    marginRight: 8,
  },
  languageOptions: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  languageText: {
    fontSize: 14,
  },
  appInfo: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  appVersion: {
    fontSize: 14,
    marginBottom: 4,
  },
  appCopyright: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Estilos para o modal de alterar senha
  changePasswordModal: {
    flex: 1,
    marginTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  changePasswordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  changePasswordTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  changePasswordContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  changePasswordSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 30,
    lineHeight: 20,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  passwordHint: {
    fontSize: 12,
    marginTop: 4,
  },
  changePasswordButton: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  changePasswordButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default Configuracoes;