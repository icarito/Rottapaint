import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Drawing } from '../types';

interface DrawingCardProps {
  drawing: Drawing;
  onOpen: (drawing: Drawing) => void;
  onDelete: (id: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

export function DrawingCard({ drawing, onOpen, onDelete }: DrawingCardProps) {
  const handleDelete = () => {
    Alert.alert(
      '¿Borrar dibujo?',
      `¿Querés eliminar "${drawing.name}"? No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Borrar',
          style: 'destructive',
          onPress: () => onDelete(drawing.id),
        },
      ],
    );
  };

  return (
    <Pressable
      onPress={() => onOpen(drawing)}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Abrir dibujo: ${drawing.name}`}
    >
      <View style={[styles.preview, { backgroundColor: drawing.backgroundColor }]}>
        {drawing.thumbnailSvg ? (
          <SvgXml
            xml={drawing.thumbnailSvg}
            width="100%"
            height="100%"
            preserveAspectRatio="xMidYMid meet"
          />
        ) : (
          <Text style={styles.emptyEmoji}>🎨</Text>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{drawing.name}</Text>
        <Text style={styles.date}>{formatDate(drawing.updatedAt)}</Text>
      </View>

      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
        hitSlop={12}
        accessibilityLabel="Eliminar dibujo"
        accessibilityRole="button"
      >
        <Text style={styles.deleteIcon}>🗑️</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    shadowOpacity: 0.06,
  },
  preview: {
    aspectRatio: 4 / 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  emptyEmoji: {
    fontSize: 48,
  },
  info: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  date: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  deleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnPressed: {
    backgroundColor: '#FFE5E5',
  },
  deleteIcon: {
    fontSize: 16,
  },
});
