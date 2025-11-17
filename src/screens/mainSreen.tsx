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
import { Ionicons } from '@expo/vector-icons';
import { ClienteBDD } from '../types/types';
import { getClientesPorFecha } from '../services/supabase';
import ClienteFormModal from '../components/clienteFormModal';
import ClienteCard from '../components/ClienteCard';
import ClienteFormEditModal from '../components/clienteFormEditModal';
import { abrirGoogleMaps } from '../apis/OrdenarRutaPorDirecciones';
import { Colors, LocationsConstants } from '../types/const';
import { RouteOptimizer } from '../apis/RouteOptimizerOptions';
import { CrossPlatformDatePicker } from '../components/CrossPlatformDatePicker';

export default function MainScreen() {
  const [clientes, setClientes] = useState<ClienteBDD[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState<ClienteBDD | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const optimizer = new RouteOptimizer({ penaltyK: 275, twoOptMaxIter: 500, debug: false });
  const startLocation = { latitude: LocationsConstants.START_LOCATION.latitude, longitude: LocationsConstants.START_LOCATION.longitude };
  const endLocation = { latitude: LocationsConstants.END_LOCATION.latitude, longitude: LocationsConstants.END_LOCATION.longitude };

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

  const actualizarClienteEstadoLocal = (clienteActualizado: ClienteBDD) => {
  setClientes((prev) =>
    prev.map((c) => (c.id === clienteActualizado.id ? clienteActualizado : c))
  );
};


  const renderCliente = ({ item }: { item: ClienteBDD }) => (
    <ClienteCard
      cliente={item}
      onEdit={() => {
        setEditandoCliente(item);
        setEditModalVisible(true);
      }}
      onChangeState={(c)=>{
        actualizarClienteEstadoLocal(c);
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
};

async function sortClients(){
  setIsRefreshing(true);

  let clientesAux: ClienteBDD[] = clientes.filter(
    c => c.estado !== 'Instalado' && c.estado !== 'Ausente'
  );

  let clientesInstalados = clientes.filter(
    c => c.estado === 'Instalado' || c.estado === 'Ausente'
  );

  let clientesOrdenados = await optimizer.optimize(clientesAux, startLocation, endLocation);

  let clientesFinales = [...clientesOrdenados, ...clientesInstalados];

  setClientes(clientesFinales);

  setIsRefreshing(false);
}

async function openMapFunction(){
  setIsRefreshing(true);
  let coordenadas: { latitude: number, longitude: number }[] = [];

  let clientesAux: ClienteBDD[] = clientes.filter(
    c => c.estado !== 'Instalado' && c.estado !== 'Ausente'
  );
  
  clientesAux.forEach(cliente => {
    coordenadas.push({
      latitude: cliente.latitude,
      longitude: cliente.longitude
    });
  });

  const waypointOrdenados = [startLocation, ...coordenadas, endLocation];
 if (waypointOrdenados) {
    abrirGoogleMaps(waypointOrdenados);
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
          style={[styles.actionBtn, styles.sortBtn]}
          onPress={() => sortClients()}
        >
          <Ionicons name="footsteps-outline" size={30} color="#fff" />
        </TouchableOpacity>
        <CrossPlatformDatePicker
          date={selectedDate}
          onConfirm={(date) => setSelectedDate(date)}
          isDark={isDark}
        />
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
  loaderWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16, paddingBottom: 100 },
  actions: { position: 'absolute', bottom: 30, right: 20, flexDirection: 'row' },
  actionBtn: { width: 56, height: 56, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginLeft: 12, elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  mapBtn: { backgroundColor:  Colors.primary},
  sortBtn: { backgroundColor: Colors.primary },
  addBtn: { backgroundColor: Colors.secondary },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
