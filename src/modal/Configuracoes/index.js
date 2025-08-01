import React, { useState } from 'react';
import { Modal, View, Text, Switch, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

export default function Configuracoes({ modalVisible, setModalVisible }) {
  const [notificacoes, setNotificacoes] = useState(true);
  const [modoEscuro, setModoEscuro] = useState(false);

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Configurações</Text>

          <ScrollView showsVerticalScrollIndicator={false}>

            {/* Notificações */}
            <View style={styles.item}>
              <View style={styles.left}>
                <Icon name="bell-ring-outline" size={24} color="#f37100" />
                <Text style={styles.label}>Notificações</Text>
              </View>
              <Switch
                value={notificacoes}
                onValueChange={setNotificacoes}
                thumbColor={notificacoes ? '#f37100' : '#888'}
              />
            </View>

            {/* Modo Escuro */}
            <View style={styles.item}>
              <View style={styles.left}>
                <Icon name="theme-light-dark" size={24} color="#f37100" />
                <Text style={styles.label}>Modo escuro</Text>
              </View>
              <Switch
                value={modoEscuro}
                onValueChange={setModoEscuro}
                thumbColor={modoEscuro ? '#f37100' : '#888'}
              />
            </View>

            {/* Idioma */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="translate" size={24} color="#f37100" />
                <Text style={styles.label}>Idioma</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            {/* Alterar Senha */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="lock-reset" size={24} color="#f37100" />
                <Text style={styles.label}>Alterar senha</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            {/* Excluir Conta */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="delete-outline" size={24} color="red" />
                <Text style={[styles.label, { color: 'red' }]}>Excluir conta</Text>
              </View>
            </TouchableOpacity>

            {/* Termos e Suporte */}
            <TouchableOpacity style={styles.item}>
              <View style={styles.left}>
                <Icon name="file-document-outline" size={24} color="#f37100" />
                <Text style={styles.label}>Termos e Suporte</Text>
              </View>
              <Icon name="chevron-right" size={24} color="#ccc" />
            </TouchableOpacity>

            {/* Botão Fechar */}
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Fechar</Text>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: '#2e2f38',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    maxHeight: '90%',
  },
  title: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    marginLeft: 10,
    fontSize: 16,
    color: '#fff',
  },
  closeBtn: {
    alignSelf: 'center',
    marginTop: 10,
  },
  closeText: {
    color: '#f37100',
    fontSize: 16,
  },
});
