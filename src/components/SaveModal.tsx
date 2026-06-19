import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SaveModalProps {
  visible: boolean;
  defaultName: string;
  onSave: (name: string) => void;
  onCancel: () => void;
}

export function SaveModal({ visible, defaultName, onSave, onCancel }: SaveModalProps) {
  const [name, setName] = useState(defaultName);

  const handleSave = () => {
    const trimmed = name.trim();
    onSave(trimmed || defaultName);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.avoidingView}
        >
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.title}>💾 Guardar dibujo</Text>
            <Text style={styles.label}>Nombre del dibujo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Mi dibujo"
              maxLength={40}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={handleSave}
            />
            <View style={styles.buttons}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [styles.btn, styles.cancelBtn, pressed && styles.pressed]}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={({ pressed }) => [styles.btn, styles.saveBtn, pressed && styles.pressed]}
              >
                <Text style={styles.saveText}>Guardar ✓</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  avoidingView: {
    width: '100%',
    maxWidth: 420,
  },
  sheet: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 28,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6C6C70',
  },
  input: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1C1C1E',
    backgroundColor: '#F9F9F9',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F2F2F7',
  },
  saveBtn: {
    backgroundColor: '#34C759',
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
});
