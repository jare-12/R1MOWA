import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
} from 'react-native';
import { ClienteBDD } from '../types/types';

const ESTADOS: ClienteBDD['estado'][] = ['Pendiente', 'Entregado', 'Instalado', 'Ausente'];

type EstadoSelectorProps = {
  estado: ClienteBDD['estado'];
  onChange: (nuevoEstado: ClienteBDD['estado']) => void;
  isDark: boolean;
};

export default function EstadoSelector({ estado, onChange, isDark }: EstadoSelectorProps) {
  const [visible, setVisible] = useState(false);

  const handleSelect = (nuevoEstado: ClienteBDD['estado']) => {
    onChange(nuevoEstado);
    setVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={[
          styles.selector, 
          isDark && styles.selectorDark,
        ]}
      >
        <Text style={[styles.selectorText, isDark && styles.selectorTextDark]}>
          {estado}
        </Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity style={styles.backdrop} onPress={() => setVisible(false)}>
          <View style={[styles.modalContainer, isDark && styles.modalDark]}>
            {ESTADOS.map((item) => (
              <TouchableOpacity key={item} onPress={() => handleSelect(item)} style={styles.item}>
                <Text style={[styles.itemText, isDark && styles.itemTextDark]}>
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  selector: {
  },
  selectorDark: {
    backgroundColor: '#222',
    borderColor: '#555',
  },
  selectorText: {
    color: '#000',
    fontSize: 13,
  },
  selectorTextDark: {
    color: '#fff',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    margin: 40,
    borderRadius: 10,
    padding: 10,
  },
  modalDark: {
    backgroundColor: '#333',
  },
  item: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
  },
  itemTextDark: {
    color: '#fff',
  },
});
