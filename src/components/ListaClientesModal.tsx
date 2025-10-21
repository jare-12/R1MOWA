// --------------- ListaClientesModal.tsx ---------------

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClienteBDD } from '../types/types';

interface ListaClientesModalProps {
  visible: boolean;
  clientes: ClienteBDD[];
  onClose: () => void;
  onMostrarFormulario: () => void;
}

export default function ListaClientesModal({
  visible,
  clientes,
  onClose,
  onMostrarFormulario,
}: ListaClientesModalProps) {
  const renderClienteItem = ({ item, index }: { item: ClienteBDD; index: number }) => (
    <View style={styles.clienteCard}>
      <Text style={styles.clienteTitle}>{`${index + 1}. ${item.nombre}`}</Text>
      <Text>{`Teléfono: ${item.numero_telefono}`}</Text>
      <Text>
        {`Dirección: ${item.direccion}${item.direccion_extra ? ', ' + item.direccion_extra : ''}`}
      </Text>
      <Text>{`Producto: ${item.producto}`}</Text>
      <Text>{`Disponibilidad: ${item.disponibilidad}`}</Text>
      <Text>{`Estimación: ${item.estimacion} min`}</Text>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.listaModalWrap}>
        <View style={styles.listaModalContent}>
          <View style={styles.listaHeader}>
            <Text style={styles.listaTitle}>Clientes Registrados</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={30} color="#333" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={clientes}
            keyExtractor={(_, index) => `cliente-${index}`}
            renderItem={renderClienteItem}
            contentContainerStyle={{ paddingBottom: 16 }}
          />

          <TouchableOpacity
            style={styles.addClienteButton}
            onPress={() => {
              onClose();
              onMostrarFormulario();
            }}
          >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <Text style={styles.addClienteText}> Añadir Cliente</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  listaModalWrap: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  listaModalContent: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '80%',
    padding: 16,
  },
  listaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listaTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  clienteCard: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#f9f9f9',
  },
  clienteTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  addClienteButton: {
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  addClienteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
