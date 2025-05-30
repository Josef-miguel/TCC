import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar, CalendarDay } from '@marceloterreiro/flash-calendar';

const TravelAgenda = () => {
  const [selectedDate, setSelectedDate] = useState(null);
  const travels = [
    { id: '1', date: '2025-05-15', title: 'Viagens atuas...' },
    { id: '2', date: '2025-05-20', title: 'Viagem Paris' },
    { id: '3', date: '2025-05-25', title: 'Viagem Tóquio' },
  ];

  const travelDates = travels.map(t => t.date);

  const handleDayPress = (dateId) => {
    console.log('Selected date:', dateId); // Debug log to confirm date selection
    setSelectedDate(dateId);
  };

  const renderDay = ({ dateId }) => {
    const hasTravel = travelDates.includes(dateId);
    const isSelected = selectedDate === dateId;
    return (
      <View style={styles.dayContainer}>
        {hasTravel && <Text style={styles.star}>★</Text>}
        <CalendarDay
          dateId={dateId}
          state={isSelected ? 'selected' : 'idle'}
          style={styles.day}
        >
          <Text style={styles.dayText}>{dateId.split('-')[2]}</Text>
        </CalendarDay>
      </View>
    );
  };

  const selectedTravel = travels.find(t => t.date === selectedDate);

  return (
    <View style={styles.container}>
      <View style={styles.calendar}>
        <Calendar
          calendarMonthId="2025-05-01"
          onCalendarDayPress={handleDayPress}
          renderDay={renderDay}
          style={styles.calendarContainer}
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
  calendarContainer: {
    flex: 1,
    backgroundColor: '#fff', // Ensure the calendar has a visible background
  },
  dayContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  day: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayText: {
    fontSize: 16,
    color: '#333',
  },
  star: {
    position: 'absolute',
    fontSize: 12,
    color: '#800080',
    top: 2,
    zIndex: 1,
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