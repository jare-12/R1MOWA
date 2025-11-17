import React, { useEffect, useState } from 'react';
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
import { Picker } from '@react-native-picker/picker';
import { ClienteBDD } from '../types/types';
import { updateClienteInSupabase } from '../services/supabase';
import { Colors } from '../types/const';
import { CrossPlatformDatePicker } from './CrossPlatformDatePicker';
import { geocodearDireccion } from '../services/geocoding';

interface ClienteFormModalProps {
  visible: boolean;
  cliente: ClienteBDD;
  onClose: () => void;
  onClienteActualizado: (nuevoCliente: ClienteBDD) => void;
}
 
export default function ClienteFormEditModal({
  visible,
  cliente,
  onClose,
  onClienteActualizado,
}: ClienteFormModalProps) {
  const [nombre, setNombre] = useState<string>("");
  const [numero, setNumero] = useState<string>("");
  const [estado, setEstado] = useState<ClienteBDD['estado']>('Pendiente');
  const [direccion, setDireccion] = useState<string>("");
  const [direccionExtra, setDireccionExtra] = useState<string>("");
  const [producto, setProducto] = useState<string>("");
  const [disponibilidad, setDisponibilidad] = useState<'Mañana' | 'Tarde' | 'NC'>('Mañana');
  const [estimacion, setEstimacion] = useState<string>("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [loading, setLoading] = useState<boolean>(false);
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  useEffect(() => {
    if (cliente) {
        setNombre(cliente.nombre);
        setNumero(cliente.numero_telefono?.toString() || '');
        setEstado(cliente.estado || 'Pendiente');
        setDireccion(cliente.direccion);
        setDireccionExtra(cliente.direccion_extra || '');
        setProducto(cliente.producto || '');
        setDisponibilidad(cliente.disponibilidad || 'NC');
        setEstimacion(cliente.estimacion?.toString() || '');
        setFecha(new Date(cliente.fecha));
    }
  }, [cliente]);

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
      const { latitude, longitude } = await geocodearDireccion(direccion);

      const ClienteActualizado: ClienteBDD = {
        estado: estado,
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
      console.log(ClienteActualizado.disponibilidad)
      if (cliente.id === undefined) {
        throw new Error('El cliente no tiene un ID definido.');
      }
      let clienteActualizadoBD = await updateClienteInSupabase(cliente.id, ClienteActualizado);
      onClienteActualizado(clienteActualizadoBD);

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
          <Text style={styles.modalTitle}>Actualizar Cliente</Text>
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
              <Text style={styles.label}>Dirección *Importante código postal</Text>
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
              <CrossPlatformDatePicker
                date={fecha}
                buttonStyle={styles.input}
                onConfirm={(date) => handleConfirmDate(date)}
                isDark={isDark}
              />
            </View>
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
                  mode="dropdown"
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
                {loading ? 'Actulizar...' : 'Actualizar'}
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
