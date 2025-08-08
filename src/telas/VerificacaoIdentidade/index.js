import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';

export default function CadastroScreen() {
  const [tipo, setTipo] = useState(null);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [showAutonomoModal, setShowAutonomoModal] = useState(false);

  const [empresa, setEmpresa] = useState({ nome: '', cnpj: '', funcionario: '' });
  const [autonomo, setAutonomo] = useState({ nome: '', documento: '' });

  const [veiculo, setVeiculo] = useState({
    placa: '',
    cnh: '',
    assentos: ''
  });

  const handleTipoChange = (value) => {
    setTipo(value);
    if (value === 'empresa') setShowEmpresaModal(true);
    if (value === 'autonomo') setShowAutonomoModal(true);
  };

  return (
    <SafeAreaView>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.label}>Você é uma empresa ou pessoa autônoma?</Text>

          <View style={styles.buttonRow}>
            <Button title="Empresa" onPress={() => handleTipoChange('empresa')} />
            <Button title="Pessoa Autônoma" onPress={() => handleTipoChange('autonomo')} />
          </View>

          {tipo === 'menor' && (
            <Text style={styles.warning}>Como você é menor de idade, não poderá conduzir uma viagem.</Text>
          )}

          {/* MODAL - Empresa */}
          <Modal visible={showEmpresaModal} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Empresa</Text>
                <TextInput
                  placeholder="Nome da empresa"
                  style={styles.input}
                  value={empresa.nome}
                  onChangeText={(text) => setEmpresa({ ...empresa, nome: text })}
                />
                <TextInput
                  placeholder="CNPJ"
                  style={styles.input}
                  value={empresa.cnpj}
                  onChangeText={(text) => setEmpresa({ ...empresa, cnpj: text })}
                />
                <TextInput
                  placeholder="Nome do funcionário"
                  style={styles.input}
                  value={empresa.funcionario}
                  onChangeText={(text) => setEmpresa({ ...empresa, funcionario: text })}
                />
                <Button title="Fechar" onPress={() => setShowEmpresaModal(false)} />
              </View>
            </View>
          </Modal>

          {/* MODAL - Pessoa Autônoma */}
          <Modal visible={showAutonomoModal} animationType="slide" transparent={true}>
            <View style={styles.modalContainer}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Pessoa Autônoma</Text>
                <TextInput
                  placeholder="Nome"
                  style={styles.input}
                  value={autonomo.nome}
                  onChangeText={(text) => setAutonomo({ ...autonomo, nome: text })}
                />
                <TextInput
                  placeholder="Documento"
                  style={styles.input}
                  value={autonomo.documento}
                  onChangeText={(text) => setAutonomo({ ...autonomo, documento: text })}
                />
                <Button title="Fechar" onPress={() => setShowAutonomoModal(false)} />
              </View>
            </View>
          </Modal>

          {/* MEIO DE LACOMOÇÃO */}
          <Text style={styles.sectionTitle}>Meio de locomoção</Text>
          <TextInput
            placeholder="Placa do veículo"
            style={styles.input}
            value={veiculo.placa}
            onChangeText={(text) => setVeiculo({ ...veiculo, placa: text })}
          />
          <TextInput
            placeholder="CNH"
            style={styles.input}
            value={veiculo.cnh}
            onChangeText={(text) => setVeiculo({ ...veiculo, cnh: text })}
          />
          <TextInput
            placeholder="Número de assentos"
            style={styles.input}
            keyboardType="numeric"
            value={veiculo.assentos}
            onChangeText={(text) => setVeiculo({ ...veiculo, assentos: text })}
          />
          <Button title="Cadastrar veículo" onPress={() => alert('Veículo cadastrado!')} />

          <Text style={styles.sectionTitle}>Seus veículos</Text>
          {/* Lista de veículos cadastrados pode ser exibida aqui futuramente */}
          <View style={styles.vehicleListPlaceholder}>
            <Text style={{ color: '#666' }}>Nenhum veículo cadastrado</Text>
          </View>
        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1b21',
    padding: 20,
    flexGrow: 1,
  },
  title: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: '#f37100',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  registerButton: {
    backgroundColor: '#f37100',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  warning: {
    color: 'red',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    marginTop: 30,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#2c2d34',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#363942',
    padding: 20,
    borderRadius: 10,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    color: '#fff',
    marginBottom: 12,
    fontWeight: 'bold',
  },
  closeText: {
    color: '#f37100',
    textAlign: 'right',
    marginTop: 10,
    fontWeight: 'bold',
  },
  vehicleList: {
    backgroundColor: '#2c2d34',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
});