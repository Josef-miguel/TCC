import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { ThemeContext } from '../../context/ThemeContext';

export default function TravelAgenda({navigation}) {
  const { theme } = useContext(ThemeContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const travels = [
    { id: '1', date: '2025-05-15', title: 'Viagens atuas...' },
    { id: '2', date: '2025-05-20', title: 'Viagem Paris' },
    { id: '3', date: '2025-05-25', title: 'Viagem Tóquio' },
  ];

  const markedDates = travels.reduce((acc, travel) => {
    acc[travel.date] = {
      customStyles: {
        container: {},
        text: {},
      },
      marked: true,
    };
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
  };

  const selectedTravel = travels.find(t => t.date === selectedDate);

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
              return <Text style={[styles.star, { color: theme?.star }]}>★</Text>;
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
          }}
        />
      </View>
      <View style={[styles.travelView, { backgroundColor: theme?.cardBackground }]}>
        <Text style={[styles.travelTitle, { color: theme?.textPrimary }]}>
          {selectedTravel ? selectedTravel.title : 'Selecione uma data'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header:{
    marginBottom: 30,
  },
  headerText:{
    fontSize: 18, 
    fontWeight: 'bold', 
    flex: 1, 
    textAlign: 'center'
  },
  flecha: {
    marginTop: 70,
  },
  calendar: {
    flex: 2,
    borderBottomWidth: 1,
  },
  star: {
    position: 'absolute',
    fontSize: 12,
    top: 2,
  },
  travelView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelTitle: {
    fontSize: 18,
    textAlign: 'center',
  },
});
