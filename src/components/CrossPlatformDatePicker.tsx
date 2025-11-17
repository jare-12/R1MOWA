import React, { useState } from "react";
import {
  Platform,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Text,
  View,
  StyleProp,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Colors } from "../types/const";

interface Props {
  date: Date;
  buttonStyle?: StyleProp<ViewStyle>; 
  onConfirm: (date: Date) => void;
  isDark?: boolean;
}

export const CrossPlatformDatePicker: React.FC<Props> = ({
  date,
  buttonStyle,
  onConfirm,
  isDark = false,
}) => {
  const [showWebModal, setShowWebModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const dateStr = date.toISOString().split("T")[0];
  const [tempDate, setTempDate] = useState(dateStr);

  const handlePress = () => {
    if (Platform.OS === "web") {
      setShowWebModal(true);
    } else {
      setShowDatePicker(true);
    }
  };

  const handleWebConfirm = (value: string) => {
    const newDate = new Date(value);
    onConfirm(newDate);
    setShowWebModal(false);
  };

  return (
    <View>
      {/* Botón original */}
      <TouchableOpacity style={[styles.dateButton, buttonStyle]} onPress={handlePress}>
        <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
          {date.toLocaleDateString()}
        </Text>

        <Ionicons
          name="calendar-outline"
          size={20}
          color={isDark ? "#fff" : "#333"}
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>

      {/* Modal web PRO */}
      {Platform.OS === "web" && (
        <Modal animationType="fade" transparent={true} visible={showWebModal}>
            <View style={styles.modalContentWrap}>
                <View style={styles.modalContent}>
                    <Text style={{ margin: 10, fontSize: 18, fontWeight: 600 }}>       
                        Seleccionar fecha
                    </Text>
                    <input
                        type="date"
                        value={tempDate}
                        onChange={(e) => setTempDate(e.target.value)}
                        style={{
                            margin: 10,
                            padding: "12px",
                            fontSize: "16px",
                            borderRadius: "8px",
                            border: "1px solid #ccc",
                            cursor: "pointer",
                        }}
                    />
                    <TouchableOpacity
                        style={[styles.button, { margin: 10, backgroundColor: Colors.primary }]}
                        onPress={() => {
                            handleWebConfirm(tempDate);
                        }}
                    >
                        <Text style={styles.buttonText}>Confirmar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, { margin: 10, backgroundColor: Colors.danger }]}
                        onPress={() => setShowWebModal(false)}
                    >
                        <Text style={styles.buttonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
      )}

      {/* Modal nativo en móvil */}
      {Platform.OS !== "web" && (
        <DateTimePickerModal
          isVisible={showDatePicker}
          mode="date"
          textColor = {isDark ? '#fff' : '#000000ff'}
          onConfirm={(date) => {
            setShowDatePicker(false);
            onConfirm(date);
          }}
          onCancel={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );

};

const styles = StyleSheet.create({
  dateButton: { flexDirection: 'row', alignItems: 'center' },
  modalContent: {
        backgroundColor: '#fff',
        borderRadius: 8,
        height: 'auto',
        width: '45%',
        overflow: 'hidden',
        alignSelf:"center"
    },
  modalContentWrap:{
    flex: 1,
    zIndex: 99999,
    backgroundColor: 'rgba(99, 98, 98, 0.5)',
    height: '100%',
    width: '100%',
    padding: 20,
  },
  dateText: { fontSize: 16, color: '#333' },
  dateTextDark: { color: '#eee' },
  button: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 12,
    marginHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});