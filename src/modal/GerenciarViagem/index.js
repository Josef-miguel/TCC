import React, { useState, useEffect, useContext } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from '../../../services/firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, arrayRemove, deleteDoc } from 'firebase/firestore';

// Fallback theme para quando o contexto não estiver disponível
const defaultTheme = {
  primary: '#f37100',
  background: '#1a1b21',
  backgroundSecondary: '#2b2c33',
  textPrimary: '#ffffff',
  overlay: 'rgba(0,0,0,0.5)',
  backgroundDark: '#363942',
  primaryLight: '#ff8c29',
  textTertiary: '#a0a0a0',
  textSecondary: '#b0b0b0'
};

export default function GerenciarViagem({ modalVisible, setModalVisible, selectedPost }) {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    numSlots: '',
    exit_date: '',
    return_date: ''
  });
  
  const navigation = useNavigation();
  
  // Obter o contexto com fallback seguro
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme || defaultTheme;

  // Buscar participantes da viagem
  const fetchParticipants = async () => {
    if (!selectedPost?.id) return;
    
    setLoading(true);
    try {
      // Buscar todos os usuários que têm este evento em joinedEvents
      const usersRef = collection(db, 'user');
      const q = query(usersRef, where('joinedEvents', 'array-contains', selectedPost.id));
      const querySnapshot = await getDocs(q);
      
      const participantsList = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        participantsList.push({
          id: doc.id,
          nome: userData.nome || userData.userInfo?.nome || 'Usuário',
          email: userData.email || 'email@exemplo.com',
          foto: userData.foto || userData.userInfo?.foto || null
        });
      });
      
      setParticipants(participantsList);
    } catch (error) {
      console.error('Erro ao buscar participantes:', error);
      Alert.alert('Erro', 'Não foi possível carregar os participantes');
    } finally {
      setLoading(false);
    }
  };

  // Carregar participantes quando o modal abrir
  useEffect(() => {
    if (modalVisible && selectedPost) {
      fetchParticipants();
    }
  }, [modalVisible, selectedPost]);

  // Função para navegar para o perfil do participante
  const handleViewProfile = (participant) => {
    setShowMenu(false);
    setModalVisible(false);
    navigation.navigate('VisualizarPerfil', { uid: participant.id });
  };

  // Função para remover usuário da viagem
  const handleRemoveUser = async (participant) => {
    Alert.alert(
      'Remover Participante',
      `Tem certeza que deseja remover ${participant.nome} da viagem?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remover o evento do joinedEvents do usuário
              const userRef = doc(db, 'user', participant.id);
              await updateDoc(userRef, {
                joinedEvents: arrayRemove(selectedPost.id)
              });

              // Atualizar lista local
              setParticipants(prev => 
                prev.filter(p => p.id !== participant.id)
              );

              // Recalcular vagas disponíveis
              const newAvailableSlots = availableSlots + 1;
              setAvailableSlots(newAvailableSlots);

              Alert.alert('Sucesso', 'Participante removido da viagem!');
              setShowMenu(false);
            } catch (error) {
              console.error('Erro ao remover participante:', error);
              Alert.alert('Erro', 'Não foi possível remover o participante.');
            }
          },
        },
      ]
    );
  };

  // Função para mostrar menu de opções
  const handleShowMenu = (participant) => {
    setSelectedParticipant(participant);
    setShowMenu(true);
  };

  // Função para excluir o post
  const handleDeletePost = () => {
    Alert.alert(
      'Excluir Viagem',
      'Tem certeza que deseja excluir esta viagem? Esta ação não pode ser desfeita e todos os participantes serão removidos.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              // Excluir o post da coleção events
              await deleteDoc(doc(db, 'events', selectedPost.id));
              
              // Remover o evento de todos os usuários que participavam
              const usersRef = collection(db, 'user');
              const q = query(usersRef, where('joinedEvents', 'array-contains', selectedPost.id));
              const querySnapshot = await getDocs(q);
              
              const updatePromises = querySnapshot.docs.map(userDoc => {
                return updateDoc(doc(db, 'user', userDoc.id), {
                  joinedEvents: arrayRemove(selectedPost.id)
                });
              });
              
              await Promise.all(updatePromises);
              
              Alert.alert('Sucesso', 'Viagem excluída com sucesso!');
              setModalVisible(false);
            } catch (error) {
              console.error('Erro ao excluir viagem:', error);
              Alert.alert('Erro', 'Não foi possível excluir a viagem.');
            }
          },
        },
      ]
    );
  };

  // Função para editar o post
  const handleEditPost = () => {
    // Preencher o formulário com os dados atuais
    setEditForm({
      title: selectedPost?.title || '',
      description: selectedPost?.desc || '',
      price: selectedPost?.price?.toString() || '',
      numSlots: selectedPost?.numSlots?.toString() || '',
      exit_date: selectedPost?.exit_date || '',
      return_date: selectedPost?.return_date || ''
    });
    setShowEditModal(true);
  };

  // Função para salvar as edições
  const handleSaveEdit = async () => {
    if (!editForm.title || !editForm.description || !editForm.price || !editForm.numSlots) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios.');
      return;
    }

    try {
      await updateDoc(doc(db, 'events', selectedPost.id), {
        title: editForm.title,
        desc: editForm.description,
        price: Number(editForm.price),
        numSlots: Number(editForm.numSlots),
        exit_date: editForm.exit_date,
        return_date: editForm.return_date,
        updatedAt: new Date().toISOString()
      });

      Alert.alert('Sucesso', 'Viagem atualizada com sucesso!');
      setShowEditModal(false);
      // Recarregar os dados se necessário
    } catch (error) {
      console.error('Erro ao atualizar viagem:', error);
      Alert.alert('Erro', 'Não foi possível atualizar a viagem.');
    }
  };

  // Função para cancelar edição
  const handleCancelEdit = () => {
    setShowEditModal(false);
    setEditForm({
      title: '',
      description: '',
      price: '',
      numSlots: '',
      exit_date: '',
      return_date: ''
    });
  };

  // Calcular vagas disponíveis
  const totalSlots = selectedPost?.numSlots || 0;
  const occupiedSlots = participants.length;
  const availableSlots = totalSlots - occupiedSlots;

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: theme.overlay,
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 15,
      padding: 20,
      width: '90%',
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      color: theme.textPrimary,
      fontWeight: 'bold',
      flex: 1,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.backgroundDark,
      marginLeft: 8,
    },
    closeButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: theme.backgroundDark,
    },
    postInfo: {
      backgroundColor: theme.backgroundDark,
      borderRadius: 10,
      padding: 15,
      marginBottom: 20,
    },
    postTitle: {
      fontSize: 18,
      color: theme.textPrimary,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    postRoute: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    slotsInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    slotsText: {
      fontSize: 16,
      color: theme.textPrimary,
      fontWeight: '600',
    },
    slotsAvailable: {
      fontSize: 14,
      color: availableSlots > 0 ? theme.primary : 'red',
      fontWeight: '500',
    },
    participantsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 15,
    },
    participantsTitle: {
      fontSize: 18,
      color: theme.textPrimary,
      fontWeight: 'bold',
      marginLeft: 8,
    },
    participantsCount: {
      fontSize: 14,
      color: theme.textSecondary,
      marginLeft: 8,
    },
    participantItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundDark,
      borderRadius: 10,
      padding: 12,
      marginBottom: 8,
    },
    participantAvatarContainer: {
      marginRight: 12,
    },
    participantAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: theme.primary,
    },
    menuButton: {
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    participantInfo: {
      flex: 1,
    },
    participantName: {
      fontSize: 16,
      color: theme.textPrimary,
      fontWeight: '500',
    },
    participantEmail: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    emptyState: {
      alignItems: 'center',
      padding: 20,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: 10,
    },
    loadingContainer: {
      alignItems: 'center',
      padding: 20,
    },
    refreshButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      padding: 12,
      alignItems: 'center',
      marginTop: 15,
    },
    refreshText: {
      color: 'white',
      fontSize: 16,
      fontWeight: '600',
    },
    // Estilos do menu de opções
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuModal: {
      borderRadius: 15,
      padding: 20,
      width: '80%',
      maxWidth: 300,
    },
    menuTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 15,
      textAlign: 'center',
    },
    menuOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
    },
    menuOptionText: {
      fontSize: 16,
      marginLeft: 12,
    },
    menuCancel: {
      marginTop: 10,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    menuCancelText: {
      fontSize: 16,
      fontWeight: '600',
    },
    // Estilos do modal de edição
    editModal: {
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 15,
      padding: 20,
      width: '95%',
      maxHeight: '90%',
    },
    editHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    editTitle: {
      fontSize: 18,
      color: theme.textPrimary,
      fontWeight: 'bold',
    },
    editForm: {
      marginBottom: 20,
    },
    inputGroup: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      color: theme.textPrimary,
      fontWeight: '500',
      marginBottom: 5,
    },
    textInput: {
      backgroundColor: theme.backgroundDark,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.textPrimary,
      borderWidth: 1,
      borderColor: theme.border || 'transparent',
    },
    multilineInput: {
      minHeight: 80,
      textAlignVertical: 'top',
    },
    editActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    editButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    cancelButton: {
      backgroundColor: theme.backgroundDark,
    },
    editButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonText: {
      color: 'white',
    },
    cancelButtonText: {
      color: theme.textPrimary,
    },
  });

  return (
    <Modal visible={modalVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Gerenciar Viagem</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleEditPost}
                style={styles.actionButton}
              >
                <Ionicons name="create-outline" size={20} color={theme.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeletePost}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color="red" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Informações da Viagem */}
          <View style={styles.postInfo}>
            <Text style={styles.postTitle}>{selectedPost?.title || 'Sem título'}</Text>
            <Text style={styles.postRoute}>
              {selectedPost?.route?.display_start} → {selectedPost?.route?.display_end}
            </Text>
            <View style={styles.slotsInfo}>
              <Text style={styles.slotsText}>
                Vagas: {occupiedSlots}/{totalSlots}
              </Text>
              <Text style={styles.slotsAvailable}>
                {availableSlots > 0 ? `${availableSlots} disponíveis` : 'Esgotado'}
              </Text>
            </View>
          </View>

          {/* Lista de Participantes */}
          <View style={styles.participantsHeader}>
            <Ionicons name="people" size={24} color={theme.primary} />
            <Text style={styles.participantsTitle}>Participantes</Text>
            <Text style={styles.participantsCount}>({participants.length})</Text>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={styles.emptyText}>Carregando participantes...</Text>
            </View>
          ) : participants.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyText}>Nenhum participante ainda</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {participants.map((participant, index) => (
                <View key={participant.id || index} style={styles.participantItem}>
                  <TouchableOpacity
                    onPress={() => handleViewProfile(participant)}
                    style={styles.participantAvatarContainer}
                  >
                    <Image
                      source={
                        participant.foto
                          ? { uri: participant.foto }
                          : require('../../../assets/img/icons/profile-icon.png')
                      }
                      style={styles.participantAvatar}
                    />
                  </TouchableOpacity>
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantName}>{participant.nome}</Text>
                    <Text style={styles.participantEmail}>{participant.email}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleShowMenu(participant)}
                    style={styles.menuButton}
                  >
                    <Ionicons name="ellipsis-vertical" size={20} color={theme.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Botão de Atualizar */}
          <TouchableOpacity
            onPress={fetchParticipants}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshText}>Atualizar Lista</Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Menu de Opções */}
        {showMenu && selectedParticipant && (
          <View style={styles.menuOverlay}>
            <View style={[styles.menuModal, { backgroundColor: theme.backgroundSecondary }]}>
              <Text style={[styles.menuTitle, { color: theme.textPrimary }]}>
                Opções para {selectedParticipant.nome}
              </Text>
              
              <TouchableOpacity
                onPress={() => handleViewProfile(selectedParticipant)}
                style={[styles.menuOption, { borderBottomColor: theme.border }]}
              >
                <Ionicons name="person-outline" size={20} color={theme.primary} />
                <Text style={[styles.menuOptionText, { color: theme.textPrimary }]}>
                  Ver Perfil
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => handleRemoveUser(selectedParticipant)}
                style={styles.menuOption}
              >
                <Ionicons name="person-remove-outline" size={20} color="red" />
                <Text style={[styles.menuOptionText, { color: 'red' }]}>
                  Remover da Viagem
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setShowMenu(false)}
                style={[styles.menuCancel, { backgroundColor: theme.backgroundDark }]}
              >
                <Text style={[styles.menuCancelText, { color: theme.textPrimary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Modal de Edição */}
        {showEditModal && (
          <View style={styles.menuOverlay}>
            <View style={styles.editModal}>
              <View style={styles.editHeader}>
                <Text style={styles.editTitle}>Editar Viagem</Text>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.editForm} showsVerticalScrollIndicator={false}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Título da Viagem</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.title}
                    onChangeText={(text) => setEditForm({...editForm, title: text})}
                    placeholder="Digite o título da viagem"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Descrição</Text>
                  <TextInput
                    style={[styles.textInput, styles.multilineInput]}
                    value={editForm.description}
                    onChangeText={(text) => setEditForm({...editForm, description: text})}
                    placeholder="Descreva a viagem"
                    placeholderTextColor={theme.textTertiary}
                    multiline
                    numberOfLines={4}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Preço (R$)</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.price}
                    onChangeText={(text) => setEditForm({...editForm, price: text})}
                    placeholder="0.00"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Número de Vagas</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.numSlots}
                    onChangeText={(text) => setEditForm({...editForm, numSlots: text})}
                    placeholder="0"
                    placeholderTextColor={theme.textTertiary}
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data de Saída</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.exit_date}
                    onChangeText={(text) => setEditForm({...editForm, exit_date: text})}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Data de Retorno</Text>
                  <TextInput
                    style={styles.textInput}
                    value={editForm.return_date}
                    onChangeText={(text) => setEditForm({...editForm, return_date: text})}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={theme.textTertiary}
                  />
                </View>
              </ScrollView>

              <View style={styles.editActions}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={[styles.editButton, styles.cancelButton]}
                >
                  <Text style={[styles.editButtonText, styles.cancelButtonText]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveEdit}
                  style={[styles.editButton, styles.saveButton]}
                >
                  <Text style={[styles.editButtonText, styles.saveButtonText]}>
                    Salvar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
