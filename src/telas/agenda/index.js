// miguel isack mexendo na agenda

import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
 
const { width } = Dimensions.get('window');
const cellSize = width / 7; // Ajusta o tamanho das células com base na largura da tela
 
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const daysAbbr = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
 
const TravelCalendarScreen = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
 
  // Dados mock de viagens (substitua com dados reais conforme necessário)
  const trips = [
    { name: 'Viagem à Praia', date: new Date(2023, 5, 12), time: '10:00' },
    { name: 'Reunião', date: new Date(2023, 5, 13), time: '14:00' },
    { name: 'Passeio', date: new Date(2023, 5, 20), time: '09:00' },
  ];
 
  const tripDates = new Set(trips.map(trip => trip.date.toISOString().split('T')[0]));
 
  const generateCalendarData = (month, year) => {
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Domingo
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const calendar = [];
    for (let i = 0; i < 35; i++) {
      if (i < firstDay || i >= firstDay + daysInMonth) {
        calendar.push(null);
      } else {
        const day = i - firstDay + 1;
        calendar.push(new Date(year, month, day));
      }
    }
    return calendar;
  };
 
  const calendarData = generateCalendarData(currentMonth, currentYear);
 
  const filteredTrips = trips
    .filter(trip => trip.date.getMonth() === currentMonth && trip.date.getFullYear() === currentYear)
    .sort((a, b) => a.date - b.date);
 
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  const goToNextMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
 
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPreviousMonth}>
          <Text style={styles.arrow}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.monthYear}>{`${monthNames[currentMonth]} ${currentYear}`}</Text>
        <TouchableOpacity onPress={goToNextMonth}>
          <Text style={styles.arrow}>{'>'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={calendarData}
        numColumns={7}
        renderItem={({ item }) => (
          <View
            style={[
              styles.cell,
              { width: cellSize, height: cellSize },
              tripDates.has(item?.toISOString().split('T')[0]) && styles.highlightedCell,
            ]}
          >
            {item && (
              <>
                <Text style={styles.dateText}>{item.getDate()}</Text>
                {tripDates.has(item.toISOString().split('T')[0]) && (
                  <Text style={styles.star}>*</Text> // Substitua por um ícone se desejar
                )}
              </>
            )}
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
      />
      <FlatList
        data={filteredTrips}
        renderItem={({ item }) => (
          <View style={styles.tripItem}>
            <Text style={styles.tripName}>{item.name}</Text>
            <Text style={styles.tripDay}>{daysAbbr[item.date.getDay()]}</Text>
            <Text style={styles.tripTime}>{item.time}</Text>
          </View>
        )}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhuma viagem neste mês</Text>}
      />
    </View>
  );
};
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginVertical: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f0f0f0',
  },
  arrow: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  monthYear: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  cell: {
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  highlightedCell: {
    backgroundColor: '#e6e6fa', // Cor leve para destacar dias com viagens
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  star: {
    color: 'purple',
    fontSize: 20,
    position: 'absolute',
    top: 2,
    right: 2,
  },
  tripItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tripName: {
    fontSize: 16,
    flex: 2,
    color: '#333',
  },
  tripDay: {
    fontSize: 14,
    flex: 1,
    color: '#666',
    textAlign: 'center',
  },
  tripTime: {
    fontSize: 14,
    flex: 1,
    color: '#666',
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
});
 
export default TravelCalendarScreen;