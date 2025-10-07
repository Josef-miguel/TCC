import React, { useState, useContext, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Modal,
  Platform // IMPORTACAO ADICIONADA
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';
import { db } from "../../../services/firebase";
import { doc, onSnapshot, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";


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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" style={styles.flecha} color={theme?.primary} size={32} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: theme?.primary }]}>Agenda</Text>
      </View>
      <View style={[styles.calendar, { borderBottomColor: theme?.primary }]}>
                 <Calendar
           style={{ backgroundColor: theme?.cardBackground }}
           current="2025-05-01"
           markedDates={markedDates}
           onDayPress={handleDayPress}
           markingType="custom"
           renderCustomMarked={(date) => {
             if (markedDates[date]) {
               return <Ionicons name="airplane" size={16} color={theme?.primary || '#f37100'} />;
             }
             return null;
           }}
           theme={{
             backgroundColor: theme?.background,
             calendarBackground: theme?.cardBackground,
             dayTextColor: theme?.textPrimary,
             textDisabledColor: theme?.textTertiary,
             todayTextColor: theme?.primary,
             selectedDayBackgroundColor: theme?.primary,
             monthTextColor: theme?.textPrimary,
             arrowColor: theme?.primary,
             textSectionTitleColor: theme?.textPrimary,
             // Configurações para exibir o calendário completo
             calendarWidth: '100%',
             dayHeaderFontSize: 14,
             dayHeaderFontWeight: 'bold',
             dayTextFontSize: 16,
             dayTextFontWeight: '600',
             monthTextFontSize: 18,
             monthTextFontWeight: 'bold',
             textDayFontSize: 16,
             textDayFontWeight: '600',
             textDayHeaderFontSize: 14,
             textDayHeaderFontWeight: 'bold',
             textMonthFontSize: 18,
             textMonthFontWeight: 'bold',
             textYearFontSize: 18,
             textYearFontWeight: 'bold',
           }}
           // Configurações para melhor visualização
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

        {/* Lista de todos os eventos do usuário */}
       <View style={[styles.eventsListContainer, { backgroundColor: theme?.cardBackground }]}>
         <Text style={[styles.eventsListTitle, { color: theme?.textPrimary }]}>
           Meus Eventos ({travels.length})
         </Text>
         
         {travels.length > 0 ? (
           <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
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
                   style={[styles.eventCard, { borderColor: theme?.border }]}
                   onPress={() => setSelectedDate(eventDate)}
                 >
                   <View style={styles.eventCardHeader}>
                     <Ionicons name="airplane" size={20} color={theme?.primary || '#f37100'} />
                     <Text style={[styles.eventCardTitle, { color: theme?.textPrimary }]}>
                       {event.title || 'Evento sem título'}
                     </Text>
                   </View>
                   
                   <View style={styles.eventCardInfo}>
                     <View style={styles.eventCardDate}>
                       <Ionicons name="calendar" size={16} color={theme?.textSecondary} />
                                               <Text style={[styles.eventCardDateText, { color: theme?.textSecondary }]}>
                          Saída: {(() => {
                            let date = event.exit_date || event.date;
                            if (date && typeof date === 'object' && date.seconds) {
                              const dateObj = new Date(date.seconds * 1000);
                              return dateObj.toLocaleDateString('pt-BR');
                            }
                            return date || 'Data não informada';
                          })()}
                        </Text>
                     </View>
                     
                     {event.return_date && (
                       <View style={styles.eventCardDate}>
                         <Ionicons name="calendar-outline" size={16} color={theme?.textSecondary} />
                                                   <Text style={[styles.eventCardDateText, { color: theme?.textSecondary }]}>
                            Retorno: {(() => {
                              let date = event.return_date;
                              if (date && typeof date === 'object' && date.seconds) {
                                const dateObj = new Date(date.seconds * 1000);
                                return dateObj.toLocaleDateString('pt-BR');
                              }
                              return date || 'Data não informada';
                            })()}
                          </Text>
                       </View>
                     )}
                     
                     <View style={styles.eventCardType}>
                       <Ionicons name="location" size={16} color={theme?.textSecondary} />
                       <Text style={[styles.eventCardTypeText, { color: theme?.textSecondary }]}>
                         {event.type === 1 ? 'Viagem' : 
                          event.type === 2 ? 'Excursão' : 
                          event.type === 3 ? 'Show' : 'Tipo não especificado'}
                       </Text>
                     </View>
                   </View>
                   
                   {event.route && (
                     <View style={styles.eventCardRoute}>
                       <Text style={[styles.eventCardRouteText, { color: theme?.textTertiary }]}>
                         {event.route.display_start} → {event.route.display_end}
                       </Text>
                     </View>
                   )}
                 </TouchableOpacity>
               );
             })}
           </ScrollView>
         ) : (
           <View style={styles.noEvents}>
             <Ionicons name="airplane-outline" size={48} color={theme?.textTertiary} />
             <Text style={[styles.noEventsText, { color: theme?.textTertiary }]}>
               Você ainda não participa de nenhum evento
             </Text>
           </View>
         )}
               </View>
        
        {/* Modal com detalhes do evento */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme?.cardBackground }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme?.textPrimary }]}>
                  Detalhes da Viagem
                </Text>
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color={theme?.textPrimary} />
                </TouchableOpacity>
              </View>
              
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20, // Espaçamento mínimo
    paddingBottom: 12,
  },
  headerText: {
    fontSize: 18, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'center'
  },
  
  calendar: {
    flex: 3,
    borderBottomWidth: 1,
   },
  // Estilos para a lista de eventos
     eventsListContainer: {
     flex: 1,
     padding: 16,
     borderTopWidth: 1,
     borderTopColor: '#333',
   },
  eventsListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  eventsList: {
    flex: 1,
  },
  eventCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  eventCardInfo: {
    marginBottom: 8,
  },
  eventCardDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventCardDateText: {
    fontSize: 14,
    marginLeft: 6,
  },
  eventCardType: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  eventCardTypeText: {
    fontSize: 14,
    marginLeft: 6,
  },
  eventCardRoute: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 8,
  },
  eventCardRouteText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  noEvents: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
     noEventsText: {
     fontSize: 16,
     textAlign: 'center',
     marginTop: 16,
   },
   // Estilos para o modal
   modalOverlay: {
     flex: 1,
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
     justifyContent: 'center',
     alignItems: 'center',
   },
   modalContent: {
     width: '90%',
     height: '80%',
     borderRadius: 16,
     padding: 20,
     elevation: 5,
     shadowColor: '#000',
     shadowOffset: {
       width: 0,
       height: 2,
     },
     shadowOpacity: 0.25,
     shadowRadius: 3.84,
   },
   modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     marginBottom: 20,
     paddingBottom: 15,
     borderBottomWidth: 1,
     borderBottomColor: '#333',
   },
   modalTitle: {
     fontSize: 20,
     fontWeight: 'bold',
   },
   closeButton: {
     padding: 5,
   },
   modalScrollView: {
     flex: 1,
   },
   modalEventTitle: {
     fontSize: 24,
     fontWeight: 'bold',
     textAlign: 'center',
     marginBottom: 20,
   },
   modalInfoSection: {
     borderWidth: 1,
     borderRadius: 8,
     padding: 12,
     marginBottom: 12,
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
     width: 140,
     height: 100,
     borderRadius: 8,
     marginRight: 8,
   },
   modalCommentItem: {
     marginBottom: 12,
     paddingBottom: 8,
     borderBottomWidth: 1,
     borderBottomColor: '#333',
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
