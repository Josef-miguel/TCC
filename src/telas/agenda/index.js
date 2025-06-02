import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';

const TravelAgenda = () => {
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
      selectedColor: '#b0b0b0',
    };
  }

  const handleDayPress = (day) => {
    setSelectedDate(day.dateString);
  };

  const selectedTravel = travels.find(t => t.date === selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.calendar}>
        <Calendar
          current="2025-05-01"
          markedDates={markedDates}
          onDayPress={handleDayPress}
          markingType="custom"
          renderCustomMarked={(date) => {
            if (markedDates[date]) {
              return <Text style={styles.star}>★</Text>;
            }
            return null;
          }}
        />
      </View>
      <View style={styles.travelView}>
        <Text style={styles.travelTitle}>
          {selectedTravel ? selectedTravel.title : 'Selecione uma data'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  calendar: {
    marginTop: 50,
    flex: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  star: {
    position: 'absolute',
    fontSize: 12,
    color: '#800080',
    top: 2,
  },
  travelView: {
    flex: 1,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  travelTitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
  },
});

export default TravelAgenda;