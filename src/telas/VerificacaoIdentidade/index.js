import React, { useState, useContext } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet, ScrollView, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

export default function VerificacaoIdentidade({ navigation }) {
  const [step, setStep] = useState(1);
  const [tipo, setTipo] = useState(null);
  const [empresa, setEmpresa] = useState({ nome: '', cnpj: '', funcionario: '' });
  const [autonomo, setAutonomo] = useState({ nome: '', documento: '' });
  const [veiculo, setVeiculo] = useState({ placa: '', cnh: '', assentos: '' });

  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const next = () => setStep(step + 1);
  const prev = () => {
    if (step === 1) {
      navigation.goBack(); // Volta para a tela anterior
    } else {
      setStep(step - 1);
    }
  };

  const handleFinalizar = () => {
    Alert.alert(
      'Cadastro Finalizado!',
      'Sua verificação de identidade foi enviada para análise.',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack() // Volta para o perfil após finalizar
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeAreaContainer, { backgroundColor: theme?.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme?.backgroundSecondary }]}>
        <TouchableOpacity onPress={prev} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme?.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme?.textPrimary }]}>
          Verificação de Identidade
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Indicador de Progresso */}
        <View style={styles.progressContainer}>
          <View style={styles.progressSteps}>
            <View style={[styles.progressStep, step >= 1 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 1 && styles.progressTextActive]}>1</Text>
            </View>
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step >= 2 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 2 && styles.progressTextActive]}>2</Text>
            </View>
            <View style={[styles.progressLine, step >= 3 && styles.progressLineActive]} />
            <View style={[styles.progressStep, step >= 3 && styles.progressStepActive]}>
              <Text style={[styles.progressText, step >= 3 && styles.progressTextActive]}>3</Text>
            </View>
          </View>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressLabel, step >= 1 && styles.progressLabelActive]}>Tipo</Text>
            <Text style={[styles.progressLabel, step >= 2 && styles.progressLabelActive]}>Dados</Text>
            <Text style={[styles.progressLabel, step >= 3 && styles.progressLabelActive]}>Veículo</Text>
          </View>
        </View>

        {/* Step 1 - Seleção do Tipo */}
        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              Selecione o tipo de verificação
            </Text>
            <Text style={[styles.subtitle, { color: theme?.textSecondary }]}>
              Escolha a opção que melhor se adequa ao seu perfil
            </Text>

            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme?.backgroundSecondary }]}
                onPress={() => { setTipo('empresa'); next(); }}
              >
                <Ionicons name="business" size={40} color={theme?.primary} />
                <Text style={[styles.optionTitle, { color: theme?.textPrimary }]}>Empresa</Text>
                <Text style={[styles.optionDescription, { color: theme?.textSecondary }]}>
                  Ideal para empresas que desejam cadastrar seus veículos
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.optionButton, { backgroundColor: theme?.backgroundSecondary }]}
                onPress={() => { setTipo('autonomo'); next(); }}
              >
                <Ionicons name="person" size={40} color={theme?.primary} />
                <Text style={[styles.optionTitle, { color: theme?.textPrimary }]}>Autônomo</Text>
                <Text style={[styles.optionDescription, { color: theme?.textSecondary }]}>
                  Para motoristas autônomos que oferecem serviços de transporte
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 2 - Dados da Empresa ou Autônomo */}
        {step === 2 && tipo === 'empresa' && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              Dados da Empresa
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Nome da Empresa</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="Digite o nome da empresa"
                placeholderTextColor={theme?.textTertiary}
                value={empresa.nome}
                onChangeText={(text) => setEmpresa({ ...empresa, nome: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>CNPJ</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="00.000.000/0000-00"
                placeholderTextColor={theme?.textTertiary}
                value={empresa.cnpj}
                onChangeText={(text) => setEmpresa({ ...empresa, cnpj: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Nome do Funcionário</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="Nome completo do responsável"
                placeholderTextColor={theme?.textTertiary}
                value={empresa.funcionario}
                onChangeText={(text) => setEmpresa({ ...empresa, funcionario: text })}
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: theme?.backgroundSecondary }]}
                onPress={prev}
              >
                <Text style={[styles.secondaryButtonText, { color: theme?.textPrimary }]}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme?.primary }]}
                onPress={next}
              >
                <Text style={[styles.primaryButtonText, { color: theme?.textInverted }]}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 2 && tipo === 'autonomo' && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              Dados Pessoais
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Nome Completo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="Seu nome completo"
                placeholderTextColor={theme?.textTertiary}
                value={autonomo.nome}
                onChangeText={(text) => setAutonomo({ ...autonomo, nome: text })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>CPF</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="000.000.000-00"
                placeholderTextColor={theme?.textTertiary}
                value={autonomo.documento}
                onChangeText={(text) => setAutonomo({ ...autonomo, documento: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: theme?.backgroundSecondary }]}
                onPress={prev}
              >
                <Text style={[styles.secondaryButtonText, { color: theme?.textPrimary }]}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme?.primary }]}
                onPress={next}
              >
                <Text style={[styles.primaryButtonText, { color: theme?.textInverted }]}>Continuar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Step 3 - Dados do Veículo */}
        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={[styles.title, { color: theme?.textPrimary }]}>
              Dados do Veículo
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Placa do Veículo</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="ABC-1A23"
                placeholderTextColor={theme?.textTertiary}
                value={veiculo.placa}
                onChangeText={(text) => setVeiculo({ ...veiculo, placa: text })}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Número da CNH</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="Número da Carteira de Habilitação"
                placeholderTextColor={theme?.textTertiary}
                value={veiculo.cnh}
                onChangeText={(text) => setVeiculo({ ...veiculo, cnh: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme?.textSecondary }]}>Número de Assentos</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme?.background, color: theme?.textPrimary, borderColor: theme?.border }]}
                placeholder="Quantidade de passageiros"
                placeholderTextColor={theme?.textTertiary}
                value={veiculo.assentos}
                onChangeText={(text) => setVeiculo({ ...veiculo, assentos: text })}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.secondaryButton, { backgroundColor: theme?.backgroundSecondary }]}
                onPress={prev}
              >
                <Text style={[styles.secondaryButtonText, { color: theme?.textPrimary }]}>Voltar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.primaryButton, { backgroundColor: theme?.primary }]}
                onPress={handleFinalizar}
              >
                <Text style={[styles.primaryButtonText, { color: theme?.textInverted }]}>Finalizar Cadastro</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    padding: 20,
    paddingBottom: 40,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  progressSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressStep: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#f37100',
  },
  progressText: {
    color: '#999',
    fontWeight: 'bold',
  },
  progressTextActive: {
    color: '#fff',
  },
  progressLine: {
    width: 60,
    height: 2,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 5,
  },
  progressLineActive: {
    backgroundColor: '#f37100',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 300,
  },
  progressLabel: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    width: 80,
  },
  progressLabelActive: {
    color: '#f37100',
    fontWeight: '500',
  },
  stepContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 0,
    marginBottom: 5,
  },
  optionDescription: {
    fontSize: 14,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 0,
  },
  primaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});