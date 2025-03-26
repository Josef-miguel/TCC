
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    // Fazer tela splash com o ícone
    <View style={styles.container}>
      <Text>Página Inicial</Text>
{/* Tela login  */}
<Text>Ainda não possui uma conta</Text>
{/* Leva para tela de registro */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
