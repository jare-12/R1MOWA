import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
  useColorScheme,
  RefreshControl,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Ionicons } from '@expo/vector-icons';
import { ClienteBDD } from '../types/types';
import { getClientesPorFecha } from '../services/supabase';
import ClienteFormModal from '../components/clienteFormModal';
import ClienteCard from '../components/ClienteCard';
import ClienteFormEditModal from '../components/clienteFormEditModal';
import { abrirGoogleMaps, obtenerRutaDirections } from '../apis/routeDirectionApi';

export default function MainScreen() {
  const [clientes, setClientes] = useState<ClienteBDD[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<ClienteBDD | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  
  const loadClientes = useCallback(async () => {
    try {
      const data = await getClientesPorFecha(selectedDate);
      setClientes(data);
    } catch (e) {
      console.error('Error fetching clientes:', e);
    }
  }, [selectedDate]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadClientes();
      setLoading(false);
    })();
  }, [loadClientes]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadClientes();
    setRefreshing(false);
  }, [loadClientes]);

  const handleNuevo = (cliente: ClienteBDD) =>
    setClientes((prev) => [cliente, ...prev]);

  const renderCliente = ({ item }: { item: ClienteBDD }) => (
    <ClienteCard
      cliente={item}
      onEdit={() => {
        setEditandoCliente(item);
        setEditModalVisible(true);
      }}
      onDeleted={(id) => setClientes((prev) => prev.filter((c) => c.id !== id))}
    />
  );
  const cerrarModalEdicion = () => {
    setEditModalVisible(false);
    setEditandoCliente(null);
  };

const actualizarClienteLocal = (clienteActualizado: ClienteBDD) => {
  setClientes((prev) =>
    prev.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c))
  );
  onRefresh();
};

async function openMapFunction(){
  setIsRefreshing(true);
  let coordenadas: { latitude: number, longitude: number }[] = [];

  clientes.forEach(cliente => {
    coordenadas.push({
      latitude: cliente.latitud,
      longitude: cliente.longitud
    });
  });
  const startLocation = { latitude: 39.467128271693085, longitude: -0.42699651572677905 };  // aproximado para Calle Colón
  const endLocation = { latitude: 39.46643518465111, longitude: -0.38719235731378177 };

  const ruta = await obtenerRutaDirections(coordenadas, startLocation,endLocation);
  if (ruta) {
    abrirGoogleMaps(ruta);
  } else {
    console.error("No se pudo obtener la ruta");
  }
  setIsRefreshing(false);
}

  return (
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header con selector de fecha */}
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={[styles.headerTitle, isDark && styles.headerDark]}>
            <Text style={[styles.title, isDark && styles.titleDark]}>Clientes</Text>
        <Text style={[styles.titleNum, isDark && styles.titleDark]}>({clientes.length})</Text>
        </View>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
            {selectedDate.toLocaleDateString()}
          </Text>
          <Ionicons
            name="calendar-outline"
            size={20}
            color={isDark ? '#fff' : '#333'}
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </View>

      {/* Lista de clientes */}
      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={clientes}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderCliente}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        />
      )}

      {/* Botones flotantes */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.mapBtn]}
          onPress={() => openMapFunction()}
        >
          <Ionicons name="map-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.addBtn]}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modales */}
      <ClienteFormModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onClienteAgregado={handleNuevo}
      />

      <ClienteFormEditModal
        visible={editModalVisible}
        onClose={cerrarModalEdicion}
        cliente={editandoCliente!}
        onClienteActualizado={(c) => {
            actualizarClienteLocal(c);
            cerrarModalEdicion();
        }}
        />

      {/* DatePicker Modal */}
      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
      />
      {isRefreshing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  containerDark: { backgroundColor: '#121212' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e0e0e0', flexDirection: 'row',justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  headerDark: { backgroundColor: '#1f1f1f', borderBottomColor: '#333' },
  title: { fontSize: 24, fontWeight: '600', color: '#333' },
  titleNum: { fontSize: 20, fontWeight: '600', color: '#333' },
  titleDark: { color: '#f5f5f5' },
  dateButton: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: 16, color: '#333' },
  dateTextDark: { color: '#eee' },
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  actions: { position: 'absolute', bottom: 30, right: 20, flexDirection: 'row' },
  actionBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginLeft: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  mapBtn: { backgroundColor: '#34c759' },
  addBtn: { backgroundColor: '#007aff' },
  overlay: {
    ...StyleSheet.absoluteFillObject, // ocupa toda la pantalla
    backgroundColor: 'rgba(0,0,0,0.5)', // semitransparente
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000, // asegura que esté encima
  },
});
