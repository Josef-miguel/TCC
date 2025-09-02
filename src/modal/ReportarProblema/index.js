import React, { useState, useContext } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { ThemeContext } from "../../context/ThemeContext";

const ReportarProblema = ({ visible, setVisible }) => {
  const themeContext = useContext(ThemeContext);
  const theme = themeContext?.theme;

  const [selectedProblem, setSelectedProblem] = useState("");
  const [customProblem, setCustomProblem] = useState("");

  const handleSendReport = () => {
    if (!selectedProblem) {
      alert("Selecione um problema para continuar.");
      return;
    }

    if (selectedProblem === "outro" && !customProblem.trim()) {
      alert("Por favor, descreva o problema.");
      return;
    }

    const report =
      selectedProblem === "outro" ? customProblem : selectedProblem;

    // Aqui você pode salvar no Firestore ou enviar para backend
    alert(`Problema reportado: ${report}`);

    // Fecha o modal depois do envio
    setVisible(false);
    setSelectedProblem("");
    setCustomProblem("");
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: theme?.background }]}>
          <Text style={[styles.title, { color: theme?.textPrimary }]}>
            Reportar um problema
          </Text>

          <Text style={[styles.label, { color: theme?.textPrimary }]}>
            Selecione o tipo de problema:
          </Text>

          <View style={[styles.pickerBox, { borderColor: theme?.border }]}>
            <Picker
              selectedValue={selectedProblem}
              onValueChange={(itemValue) => setSelectedProblem(itemValue)}
              style={{ color: theme?.textPrimary }}
            >
              <Picker.Item label="Selecione um problema..." value="" />
              <Picker.Item
                label="Informações incorretas"
                value="informacoes_incorretas"
              />
              <Picker.Item label="Viagem suspeita" value="viagem_suspeita" />
              <Picker.Item
                label="Organizador não confiável"
                value="organizador_duvidoso"
              />
              <Picker.Item label="Outro" value="outro" />
            </Picker>
          </View>

          {/* Campo extra aparece apenas se selecionar "Outro" */}
          {selectedProblem === "outro" && (
            <TextInput
              style={[
                styles.input,
                { color: theme?.textPrimary, borderColor: theme?.border },
              ]}
              placeholder="Descreva o problema"
              placeholderTextColor={theme?.textSecondary || "#888"}
              value={customProblem}
              onChangeText={setCustomProblem}
              multiline
            />
          )}

          <View style={styles.buttonsRow}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme?.primary }]}
              onPress={handleSendReport}
            >
              <Text style={[styles.buttonText, { color: theme?.textInverted }]}>
                Enviar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#ccc" }]}
              onPress={() => setVisible(false)}
            >
              <Text style={[styles.buttonText, { color: "#000" }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  container: {
    width: "100%",
    borderRadius: 10,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
  },
  pickerBox: {
    borderWidth: 1,
    borderRadius: 6,
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    minHeight: 60,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginHorizontal: 5,
  },
  buttonText: {
    fontWeight: "bold",
  },
});

export default ReportarProblema;
