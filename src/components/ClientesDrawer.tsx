// --------------------- components/ClientesDrawer.tsx ---------------------

import React, {
  forwardRef,
  useRef,
  useImperativeHandle,
  useEffect,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ClienteBDD } from '../types/types';
import { DrawerLayout, GestureHandlerRootView } from 'react-native-gesture-handler';

export interface ClientesDrawerHandle {
  openDrawer: () => void;
  closeDrawer: () => void;
}

interface ClientesDrawerProps {
  clientesOrdenados: ClienteBDD[];
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const ClientesDrawer = forwardRef<ClientesDrawerHandle, ClientesDrawerProps>(
  ({ clientesOrdenados, open, onClose, children }, ref) => {
    const drawerRef = useRef<DrawerLayout>(null);

    // Exponer open/close al padre
    useImperativeHandle(ref, () => ({
      openDrawer: () => {
        drawerRef.current?.openDrawer();
      },
      closeDrawer: () => {
        drawerRef.current?.closeDrawer();
      },
    }));

    // Cuando cambie `open`, abrimos o cerramos el drawer
    useEffect(() => {
      if (open) {
        drawerRef.current?.openDrawer();
      } else {
        drawerRef.current?.closeDrawer();
      }
    }, [open]);

    const renderDrawerContent = () => (
      <SafeAreaView style={styles.drawerContainer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>Clientes Ordenados</Text>
          <TouchableOpacity
            onPress={() => {
              drawerRef.current?.closeDrawer();
              onClose();
            }}
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <FlatList
          data={clientesOrdenados}
          keyExtractor={(_, index) => `ord-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.clienteCardDrawer}>
              <Text style={styles.clienteIndice}>{index + 1}.</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.clienteNombre}>{item.nombre}</Text>
                <Text style={styles.clienteDetalle}>
                  {item.direccion}
                  {item.direccion_extra ? `, ${item.direccion_extra}` : ''}
                </Text>
                <Text style={styles.clienteDetalle}>{`Tel: ${item.numero_telefono}`}</Text>
              </View>
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      </SafeAreaView>
    );

    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <DrawerLayout
          ref={drawerRef}
          drawerWidth={Dimensions.get('window').width * 0.75}
          drawerPosition="left"
          renderNavigationView={renderDrawerContent}
          onDrawerClose={onClose}
        >
          {children}
        </DrawerLayout>
      </GestureHandlerRootView>
    );
  }
);

export default ClientesDrawer;

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  clienteCardDrawer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  clienteIndice: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
    textAlign: 'right',
    marginRight: 8,
  },
  clienteNombre: {
    fontSize: 16,
    fontWeight: '600',
  },
  clienteDetalle: {
    fontSize: 14,
    color: '#555',
  },
});
