import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StyleSheet
} from 'react-native';

export default function CadastroScreen() {
  const [step, setStep] = useState(1);          // Etapa atual
  const [tipo, setTipo] = useState(null);
  const [empresa, setEmpresa] = useState({ nome: '', cnpj: '', funcionario: '' });
  const [autonomo, setAutonomo] = useState({ nome: '', documento: '' });
  const [veiculo, setVeiculo] = useState({ placa: '', cnh: '', assentos: '' });

  const next = () => setStep(step + 1);
  const prev = () => setStep(step - 1);

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {step === 1 && (
        <View style={styles.container}>
          <Text style={styles.label}>Você é uma empresa ou pessoa autônoma?</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#f37100' }]}
              onPress={() => { setTipo('empresa'); next(); }}>
              <Text style={styles.buttonText}>Empresa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: '#0077ff' }]}
              onPress={() => { setTipo('autonomo'); next(); }}>
              <Text style={styles.buttonText}>Autônomo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {step === 2 && tipo === 'empresa' && (
        <View style={styles.container}>
          <Text style={styles.label}>Cadastro da Empresa</Text>
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
          <TouchableOpacity style={styles.nextButton} onPress={next}><Text style={styles.buttonText}>Próximo</Text></TouchableOpacity>
          <TouchableOpacity onPress={prev}><Text style={styles.voltarText}>Voltar</Text></TouchableOpacity>
        </View>
      )}

      {step === 2 && tipo === 'autonomo' && (
        <View style={styles.container}>
          <Text style={styles.label}>Cadastro Autônomo</Text>
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
          <TouchableOpacity style={styles.nextButton} onPress={next}><Text style={styles.buttonText}>Próximo</Text></TouchableOpacity>
          <TouchableOpacity onPress={prev}><Text style={styles.voltarText}>Voltar</Text></TouchableOpacity>
        </View>
      )}

      {step === 3 && (
        <View style={styles.container}>
          <Text style={styles.label}>Meio de locomoção</Text>
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
          <TouchableOpacity style={styles.nextButton} onPress={() => alert('Cadastro finalizado!')}>
            <Text style={styles.buttonText}>Finalizar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={prev}><Text style={styles.voltarText}>Voltar</Text></TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: { flex: 1, backgroundColor: '#1a1b21' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  label: { color: '#fff', fontSize: 20, marginBottom: 20, fontWeight: 'bold', textAlign: 'center' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around' },
  button: { padding: 15, borderRadius: 8, width: '40%', alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  input: { backgroundColor: '#2c2d34', color: '#fff', borderRadius: 6, padding: 12, marginBottom: 15 },
  nextButton: { backgroundColor: '#f37100', padding: 15, alignItems: 'center', borderRadius: 8 },
  voltarText: { color: '#999', marginTop: 15, textAlign: 'center' }
});
