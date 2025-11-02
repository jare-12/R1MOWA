import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  useColorScheme,
} from 'react-native';
import * as Location from 'expo-location';
import { Picker } from '@react-native-picker/picker';
import { ClienteBDD } from '../types/types';
import { addClienteToSupabase } from '../services/supabase';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Colors } from '../types/const';

interface ClienteFormModalProps {
  visible: boolean;
  onClose: () => void;
  onClienteAgregado: (nuevoCliente: ClienteBDD) => void;
}

export default function ClienteFormModal({
  visible,
  onClose,
  onClienteAgregado,
}: ClienteFormModalProps) {
  const [nombre, setNombre] = useState<string>('');
  const [numero, setNumero] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [direccionExtra, setDireccionExtra] = useState<string>('');
  const [producto, setProducto] = useState<string>('');
  const [disponibilidad, setDisponibilidad] = useState<'Mañana' | 'Tarde' | 'NC'>('Mañana');
  const [estimacion, setEstimacion] = useState<string>('');
  const [fecha, setFecha] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const geocodearDireccion = async (
  fullAddress: string
): Promise<{ latitude: number; longitude: number }> => {

  // 1️⃣ Solicitar permisos
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permiso para acceder a la ubicación denegado');
  }

  // 2️⃣ Geocodificar la dirección
  const resultados = await Location.geocodeAsync(fullAddress);

  if (!resultados || resultados.length === 0) {
    throw new Error('No se pudo geocodificar la dirección');
  }

  return {
    latitude: resultados[0].latitude,
    longitude: resultados[0].longitude,
  };
};

  const handleEnviarCliente = async () => {
    if (
      !nombre.trim() ||
      !numero.trim() ||
      !direccion.trim() ||
      !producto.trim() ||
      !estimacion.trim() ||
      !fecha
    ) {
      Alert.alert(
        '¡Campos incompletos!',
        'Por favor, completa todos los campos obligatorios.'
      );
      return;
    }

    setLoading(true);

    try {
      const fullAddress = direccionExtra.trim()
        ? `${direccion.trim()}, ${direccionExtra.trim()}`
        : direccion.trim();

      const { latitude, longitude } = await geocodearDireccion(direccion);

      const nuevoCliente: ClienteBDD = {
        estado: 'Pendiente',
        nombre: nombre.trim(),
        numero_telefono: numero.trim(),
        direccion: direccion.trim(),
        direccion_extra: direccionExtra.trim(),
        producto: producto.trim(),
        disponibilidad,
        estimacion: estimacion.trim(),
        latitude: latitude,
        longitude: longitude,
        fecha,
      };

      let clienteBBDD = await addClienteToSupabase(nuevoCliente);
      onClienteAgregado(clienteBBDD);

      // Limpiar campos y cerrar
      setNombre('');
      setNumero('');
      setDireccion('');
      setDireccionExtra('');
      setProducto('');
      setDisponibilidad('Mañana');
      setEstimacion('');
      setFecha(new Date());
      onClose();
    } catch (error: any) {
      console.error(error);
      Alert.alert('Error', error.message || 'Algo salió mal.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDate = (selectedDate: Date) => {
    setShowDatePicker(false);
    setFecha(selectedDate);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => !loading && onClose()}
    >
      <KeyboardAvoidingView
        style={styles.modalWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Añadir Nuevo Cliente</Text>
          <ScrollView style={styles.scrollForm}>
            {/* ==== FORMULARIO ==== */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre del cliente</Text>
              <TextInput
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
                placeholder="Ej: Juan Pérez"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Número del cliente</Text>
              <TextInput
                style={styles.input}
                value={numero}
                onChangeText={setNumero}
                placeholder="Ej: 600123456"
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={direccion}
                onChangeText={setDireccion}
                placeholder="Calle Falsa 123, Madrid"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dirección Extra (piso, puerta…)</Text>
              <TextInput
                style={styles.input}
                value={direccionExtra}
                onChangeText={setDireccionExtra}
                placeholder="Piso 2, Puerta A"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Producto</Text>
              <TextInput
                style={styles.input}
                value={producto}
                onChangeText={setProducto}
                placeholder="Ej: Caja de regalo"
                editable={!loading}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setShowDatePicker(true)}
                disabled={loading}
              >
                <Text>
                  {fecha.toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <DateTimePickerModal
              isVisible={showDatePicker}
              mode="date"
              onConfirm={handleConfirmDate}
              textColor = {isDark ? '#fff' : '#000000ff'}
              onCancel={() => setShowDatePicker(false)}
            />

            <View style={styles.formGroup}>
              <Text style={styles.label}>
                Disponibilidad (Mañana / Tarde / Cualquiera)
              </Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={disponibilidad}
                  onValueChange={(val) =>
                    setDisponibilidad(val as 'Mañana' | 'Tarde' | 'NC')
                  }
                  enabled={!loading}
                >
                  <Picker.Item label="Mañana" value="Mañana" />
                  <Picker.Item label="Tarde" value="Tarde" />
                  <Picker.Item label="Cualquiera" value="NC" />
                </Picker>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Estimación en minutos</Text>
              <TextInput
                style={styles.input}
                value={estimacion}
                onChangeText={setEstimacion}
                placeholder="Ej: 15"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </ScrollView>

          {/* BOTONES ABAJO */}
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.light }]}
              onPress={handleEnviarCliente}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Enviando...' : 'Enviar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: Colors.danger }]}
              onPress={() => !loading && onClose()}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: '90%',
    overflow: 'hidden',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: Colors.accent,
    color: '#fff',
    marginBottom: 10,
  },
  scrollForm: {
    flex: 1,
    paddingVertical: 0,
  },
  formGroup: {
    marginTop: 10,
    marginHorizontal: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
    backgroundColor: '#fafafa',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#bbb',
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
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
