import React, { useState } from 'react';
import { View, Text, StyleSheet, useColorScheme, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Picker } from '@react-native-picker/picker';
import { ClienteBDD } from '../types/types';
import { deleteClienteFromSupabase, updateClienteEstado } from '../services/supabase';
import EstadoSelector from './EstadoSelector';

interface ClienteCardProps {
  cliente: ClienteBDD;
  onDeleted: (id: number) => void;
  onEdit: (cliente: ClienteBDD) => void; 
}
// ClienteCard.tsx

const estadoColors: Record<string, string> = {
  Pendiente: '#F2F2F2',   // gris claro
  Entregado: '#E6F4EA',   // verde claro
  Instalado: '#E3F2FD',   // azul claro
  Ausente: '#FDECEA',     // rojo claro
};

export default function ClienteCard({ cliente, onDeleted, onEdit }: ClienteCardProps) {
  const isDark = useColorScheme() === 'dark';
  const [estado, setEstado] = useState<ClienteBDD['estado']>(cliente.estado);

  const handleDelete = async () => {
    Alert.alert(
      'Confirmar eliminación',
      `¿Seguro que quieres eliminar a ${cliente.nombre}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClienteFromSupabase(cliente.id!);
              onDeleted(cliente.id!);
            } catch (e) {
              console.error('Error al eliminar:', e);
              Alert.alert('Error', 'No se pudo eliminar el cliente');
            }
          },
        },
      ]
    );
  };

  const handleEstadoChange = async (nuevoEstado: ClienteBDD['estado']) => {
    setEstado(nuevoEstado);
    try {
      await updateClienteEstado(cliente.id!, nuevoEstado);
    } catch (e) {
      console.error('Error actualizando estado:', e);
      Alert.alert('Error', 'No se pudo actualizar el estado');
      setEstado(cliente.estado);
    }
  };

  const renderRightActions = () => (
    <RectButton style={styles.deleteButton} onPress={handleDelete}>
      <Ionicons name="trash-outline" size={24} color="#fff" />
    </RectButton>
  );

  const renderLeftActions = () => (
  <RectButton style={styles.editButton} onPress={() => onEdit(cliente)}>
    <Ionicons name="create-outline" size={24} color="#fff" />
  </RectButton>
);

  const backgroundColor = estadoColors[estado] || (isDark ? '#1e1e1e' : '#fff');

  return (
    <Swipeable
        renderRightActions={renderRightActions}
        renderLeftActions={renderLeftActions}
        >
      <View style={[styles.card, { backgroundColor }]}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={[styles.name, isDark && styles.nameDark]}>{cliente.nombre}</Text>
          <EstadoSelector
            estado={estado}
            onChange={handleEstadoChange}
            isDark={isDark}
          />
        </View>

        {/* Dirección */}
        <Text style={[styles.detail, isDark && styles.detailDark]}>
          {cliente.direccion}
          {cliente.direccion_extra ? `, ${cliente.direccion_extra}` : ''}
        </Text>

        {/* Teléfono */}
        {cliente.numero_telefono && (
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={16} color={isDark ? '#bbb' : '#777'} />
            <Text style={[styles.detail, isDark && styles.detailDark]}>
              {' '}{cliente.numero_telefono}
            </Text>
          </View>
        )}

        {/* Producto */}
        {cliente.producto && (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag-outline" size={16} color={isDark ? '#bbb' : '#777'} />
            <Text style={[styles.detail, isDark && styles.detailDark]}>
              {' '}{cliente.producto}
            </Text>
          </View>
        )}
        
        {/* Disponibilidad */}
        {cliente.disponibilidad && (
          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={16} color={isDark ? '#bbb' : '#777'} />
            <Text style={[styles.detail, isDark && styles.detailDark]}>
              {' '}{cliente.disponibilidad}
            </Text>
          </View>
        )}
      </View>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  editButton: {
  backgroundColor: '#2196F3',
  justifyContent: 'center',
  alignItems: 'center',
  width: 64,
  borderRadius: 12,
  marginBottom: 16,
},
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: '#212121',
  },
  nameDark: {
    color: '#fff',
  },
  detail: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
    lineHeight: 20,
  },
  detailDark: {
    color: '#ccc',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    borderRadius: 12,
    marginBottom: 16,
  },
});

