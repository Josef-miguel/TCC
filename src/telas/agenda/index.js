import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, Dimensions, StatusBar } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from "../../../services/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const { width, height } = Dimensions.get('window');


export default function TravelAgenda({navigation}) {
  const { theme } = useContext(ThemeContext);

const [selectedDate, setSelectedDate] = useState(null);
const [travels, setTravels] = useState([]);
const [modalVisible, setModalVisible] = useState(false);
const [selectedEvent, setSelectedEvent] = useState(null);
const auth = getAuth();

  
useEffect(() => {
  if (!auth.currentUser) return;

  const userRef = doc(db, "user", auth.currentUser.uid);

  const unsubscribe = onSnapshot(userRef, async (snap) => {
    if (!snap.exists()) {
      console.log("Documento do usuário não existe");
      return;
    }

    const joined = snap.data().joinedEvents || [];
    console.log("UIDs dos eventos que o usuário participa:", joined);

    if (joined.length === 0) {
      console.log("Usuário não participa de nenhum evento");
      setTravels([]);
      return;
    }

    // busca eventos no Firestore usando os UIDs dos documentos
    const eventosPromises = joined.map(async (eventId) => {
      try {
        const eventRef = doc(db, "events", eventId);
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          return {
            ...eventSnap.data(),
            id: eventSnap.id // garantir que o ID está disponível
          };
        }
        return null;
      } catch (error) {
        console.error(`Erro ao buscar evento ${eventId}:`, error);
        return null;
      }
    });

    const eventosResults = await Promise.all(eventosPromises);
    const lista = eventosResults.filter(evento => evento !== null);

    console.log("Eventos encontrados:", lista);
    console.log("Quantidade de eventos carregados:", lista.length);
    setTravels(lista);
  });

  return () => unsubscribe();
}, []);

  const markedDates = travels.reduce((acc, travel) => {
    // Usar exit_date se disponível, senão usar date
    let eventDate = travel.exit_date || travel.date;
    
    // Converter Timestamp para string se necessário
    if (eventDate && typeof eventDate === 'object' && eventDate.seconds) {
      const date = new Date(eventDate.seconds * 1000);
      eventDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    if (eventDate) {
      acc[eventDate] = {
        customStyles: {
          container: {},
          text: {},
        },
        marked: true,
        dotColor: theme?.primary || '#f37100',
      };
    }
    return acc;
  }, {});

  if (selectedDate) {
    markedDates[selectedDate] = {
      ...markedDates[selectedDate],
      selected: true,
      selectedColor: theme?.primary,
    };
  }

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
    
    // Verificar se há evento nesta data
    const eventOnThisDate = travels.find(t => {
      let eventDate = t.exit_date || t.date;
      
      // Converter Timestamp para string se necessário
      if (eventDate && typeof eventDate === 'object' && eventDate.seconds) {
        const date = new Date(eventDate.seconds * 1000);
        eventDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
      }
      
      return eventDate === day.dateString;
    });
    
    if (eventOnThisDate) {
      setSelectedEvent(eventOnThisDate);
      setModalVisible(true);
    }
  };

  const selectedTravel = travels.find(t => {
    let eventDate = t.exit_date || t.date;
    
    // Converter Timestamp para string se necessário
    if (eventDate && typeof eventDate === 'object' && eventDate.seconds) {
      const date = new Date(eventDate.seconds * 1000);
      eventDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    }
    
    return eventDate === selectedDate;
  });

  return (
    <View style={[styles.container, { backgroundColor: theme?.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme?.primary} />
      
      {/* Header com gradiente */}
      <LinearGradient
        colors={[theme?.primary || '#f37100', theme?.primaryDark || '#e55a00']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" color="white" size={28} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Minha Agenda</Text>
            <Text style={styles.headerSubtitle}>
              {travels.length} evento{travels.length !== 1 ? 's' : ''} agendado{travels.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            activeOpacity={0.7}
          >
            <Ionicons name="filter" color="white" size={24} />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      {/* Calendário com design melhorado */}
      <View style={styles.calendarContainer}>
        <View style={[styles.calendarCard, { backgroundColor: theme?.cardBackground }]}>
          <Calendar
            style={styles.calendar}
            current="2025-05-01"
            markedDates={markedDates}
            onDayPress={handleDayPress}
            markingType="custom"
            renderCustomMarked={(date) => {
              if (markedDates[date]) {
                return (
                  <View style={styles.eventMarker}>
                    <Ionicons name="airplane" size={12} color="white" />
                  </View>
                );
              }
              return null;
            }}
            theme={{
              backgroundColor: 'transparent',
              calendarBackground: 'transparent',
              dayTextColor: theme?.textPrimary,
              textDisabledColor: theme?.textTertiary,
              todayTextColor: theme?.primary,
              selectedDayBackgroundColor: theme?.primary,
              monthTextColor: theme?.textPrimary,
              arrowColor: theme?.primary,
              textSectionTitleColor: theme?.textSecondary,
              calendarWidth: '100%',
              dayHeaderFontSize: 13,
              dayHeaderFontWeight: '600',
              dayTextFontSize: 15,
              dayTextFontWeight: '500',
              monthTextFontSize: 20,
              monthTextFontWeight: 'bold',
              textDayFontSize: 15,
              textDayFontWeight: '500',
              textDayHeaderFontSize: 13,
              textDayHeaderFontWeight: '600',
              textMonthFontSize: 20,
              textMonthFontWeight: 'bold',
              textYearFontSize: 16,
              textYearFontWeight: '600',
            }}
            hideExtraDays={false}
            disableMonthChange={false}
            firstDay={0}
            hideDayNames={false}
            showWeekNumbers={false}
            disableArrowLeft={false}
            disableArrowRight={false}
            disableAllTouchEventsForDisabledDays={true}
          />
        </View>
      </View>

        {/* Lista de eventos com design melhorado */}
        <View style={styles.eventsSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="list" size={20} color={theme?.primary} />
              <Text style={[styles.sectionTitle, { color: theme?.textPrimary }]}>
                Próximos Eventos
              </Text>
            </View>
            <Text style={[styles.eventCount, { color: theme?.textSecondary }]}>
              {travels.length} evento{travels.length !== 1 ? 's' : ''}
            </Text>
          </View>
          
          {travels.length > 0 ? (
            <ScrollView 
              style={styles.eventsList} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.eventsListContent}
            >
              {travels.map((event, index) => {
                let eventDate = event.exit_date || event.date;
                
                // Converter Timestamp para string se necessário
                if (eventDate && typeof eventDate === 'object' && eventDate.seconds) {
                  const date = new Date(eventDate.seconds * 1000);
                  eventDate = date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
                }
                
                return (
                  <TouchableOpacity 
                    key={event.id || index}
                    style={[styles.eventCard, { backgroundColor: theme?.cardBackground }]}
                    onPress={() => setSelectedDate(eventDate)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.eventCardHeader}>
                      <View style={[styles.eventIconContainer, { backgroundColor: theme?.primary + '20' }]}>
                        <Ionicons 
                          name={event.type === 1 ? "airplane" : event.type === 2 ? "bus" : "musical-notes"} 
                          size={20} 
                          color={theme?.primary} 
                        />
                      </View>
                      <View style={styles.eventCardInfo}>
                        <Text style={[styles.eventCardTitle, { color: theme?.textPrimary }]}>
                          {event.title || 'Evento sem título'}
                        </Text>
                        <Text style={[styles.eventCardType, { color: theme?.textSecondary }]}>
                          {event.type === 1 ? 'Viagem' : 
                           event.type === 2 ? 'Excursão' : 
                           event.type === 3 ? 'Show' : 'Tipo não especificado'}
                        </Text>
                      </View>
                      <View style={styles.eventCardDateContainer}>
                        <Text style={[styles.eventCardDateText, { color: theme?.primary }]}>
                          {(() => {
                            let date = event.exit_date || event.date;
                            if (date && typeof date === 'object' && date.seconds) {
                              const dateObj = new Date(date.seconds * 1000);
                              return dateObj.getDate();
                            }
                            return '?';
                          })()}
                        </Text>
                        <Text style={[styles.eventCardMonthText, { color: theme?.textSecondary }]}>
                          {(() => {
                            let date = event.exit_date || event.date;
                            if (date && typeof date === 'object' && date.seconds) {
                              const dateObj = new Date(date.seconds * 1000);
                              return dateObj.toLocaleDateString('pt-BR', { month: 'short' });
                            }
                            return '';
                          })()}
                        </Text>
                      </View>
                    </View>
                    
                    {event.route && (
                      <View style={styles.eventCardRoute}>
                        <Ionicons name="location" size={14} color={theme?.textTertiary} />
                        <Text style={[styles.eventCardRouteText, { color: theme?.textTertiary }]}>
                          {event.route.display_start} → {event.route.display_end}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.eventCardFooter}>
                      <View style={styles.eventCardStatus}>
                        <View style={[styles.statusDot, { backgroundColor: theme?.success || '#4CAF50' }]} />
                        <Text style={[styles.statusText, { color: theme?.textSecondary }]}>
                          Confirmado
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color={theme?.textTertiary} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIconContainer, { backgroundColor: theme?.primary + '10' }]}>
                <Ionicons name="calendar-outline" size={48} color={theme?.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme?.textPrimary }]}>
                Nenhum evento agendado
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme?.textSecondary }]}>
                Participe de eventos para vê-los aqui
              </Text>
              <TouchableOpacity 
                style={[styles.exploreButton, { backgroundColor: theme?.primary }]}
                activeOpacity={0.8}
              >
                <Text style={styles.exploreButtonText}>Explorar Eventos</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Modal com detalhes do evento melhorado */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme?.cardBackground }]}>
              {/* Header do modal com gradiente */}
              <LinearGradient
                colors={[theme?.primary || '#f37100', theme?.primaryDark || '#e55a00']}
                style={styles.modalHeaderGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.modalHeader}>
                  <View style={styles.modalHeaderContent}>
                    <Text style={styles.modalTitle}>Detalhes do Evento</Text>
                    <Text style={styles.modalSubtitle}>Informações completas</Text>
                  </View>
                  <TouchableOpacity 
                    onPress={() => setModalVisible(false)}
                    style={styles.closeButton}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
              
              {selectedEvent && (
                <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
                  <Text style={[styles.modalEventTitle, { color: theme?.textPrimary }]}>
                    {selectedEvent.title}
                  </Text>
                  
                  <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                    <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Descrição</Text>
                    <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                      {selectedEvent.desc || 'Sem descrição disponível'}
                    </Text>
                  </View>

                  <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                    <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Data de Saída</Text>
                    <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                      {(() => {
                        let date = selectedEvent.exit_date || selectedEvent.date;
                        if (date && typeof date === 'object' && date.seconds) {
                          const dateObj = new Date(date.seconds * 1000);
                          return dateObj.toLocaleDateString('pt-BR');
                        }
                        return date || 'Data não informada';
                      })()}
                    </Text>
                  </View>

                  {selectedEvent.return_date && (
                    <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                      <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Data de Retorno</Text>
                      <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                        {(() => {
                          let date = selectedEvent.return_date;
                          if (date && typeof date === 'object' && date.seconds) {
                            const dateObj = new Date(date.seconds * 1000);
                            return dateObj.toLocaleDateString('pt-BR');
                          }
                          return date || 'Data não informada';
                        })()}
                      </Text>
                    </View>
                  )}

                  <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                    <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Tipo de Viagem</Text>
                    <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                      {selectedEvent.type === 1 ? 'Viagem' : 
                       selectedEvent.type === 2 ? 'Excursão' : 
                       selectedEvent.type === 3 ? 'Show' : 'Tipo não especificado'}
                    </Text>
                  </View>

                  <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                    <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Vagas Disponíveis</Text>
                    <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                      {selectedEvent.numSlots || 'Não informado'}
                    </Text>
                  </View>

                  {selectedEvent.route && (
                    <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                      <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Rota</Text>
                      <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                        De: {selectedEvent.route.display_start || 'Início não informado'}
                      </Text>
                      <Text style={[styles.modalText, { color: theme?.textSecondary }]}>
                        Para: {selectedEvent.route.display_end || 'Destino não informado'}
                      </Text>
                    </View>
                  )}

                  {selectedEvent.images && selectedEvent.images.length > 0 && (
                    <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                      <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Imagens</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modalImageContainer}>
                        {selectedEvent.images.map((image, index) => (
                          <Image 
                            key={index}
                            source={{ uri: image }} 
                            style={styles.modalEventImage}
                            resizeMode="cover"
                          />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {selectedEvent.comments && selectedEvent.comments.length > 0 && (
                    <View style={[styles.modalInfoSection, { borderColor: theme?.border }]}>
                      <Text style={[styles.modalSectionTitle, { color: theme?.textPrimary }]}>Comentários</Text>
                      {selectedEvent.comments.slice(0, 5).map((comment, index) => (
                        <View key={index} style={styles.modalCommentItem}>
                          <Text style={[styles.modalCommentAuthor, { color: theme?.textPrimary }]}>
                            {comment.username || 'Usuário'}
                          </Text>
                          <Text style={[styles.modalCommentText, { color: theme?.textSecondary }]}>
                            "{comment.comment_text}"
                          </Text>
                        </View>
                      ))}
                      {selectedEvent.comments.length > 5 && (
                        <Text style={[styles.modalMoreComments, { color: theme?.textTertiary }]}>
                          +{selectedEvent.comments.length - 5} comentários
                        </Text>
                      )}
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
     </View>
   );
 };

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Header com gradiente
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Calendário
  calendarContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  calendarCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  calendar: {
    borderRadius: 12,
  },
  eventMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f37100',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },

  // Seção de eventos
  eventsSection: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  eventCount: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventsList: {
    flex: 1,
  },
  eventsListContent: {
    paddingBottom: 20,
  },
  
  // Cards de eventos
  eventCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventCardInfo: {
    flex: 1,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  eventCardType: {
    fontSize: 14,
    fontWeight: '500',
  },
  eventCardDateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  eventCardDateText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  eventCardMonthText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  eventCardRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventCardRouteText: {
    fontSize: 13,
    marginLeft: 6,
    fontWeight: '500',
  },
  eventCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventCardStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Estado vazio
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  exploreButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  exploreButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeaderGradient: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    flex: 1,
    padding: 20,
  },
  modalEventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalInfoSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalImageContainer: {
    marginTop: 8,
  },
  modalEventImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  modalCommentItem: {
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalCommentAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalCommentText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  modalMoreComments: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});
