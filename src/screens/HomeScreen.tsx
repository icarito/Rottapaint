import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DrawingCard } from '../components/DrawingCard';
import { useStorage } from '../hooks/useStorage';
import { Drawing } from '../types';
import { generateId } from '../utils/svgPath';
import { DEFAULT_BACKGROUND } from '../utils/colors';

interface HomeScreenProps {
  onOpenDrawing: (drawing: Drawing) => void;
  onNewDrawing: (drawing: Drawing) => void;
}

function newBlankDrawing(width: number, height: number): Drawing {
  const now = Date.now();
  return {
    id: generateId(),
    name: `Dibujo ${new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`,
    createdAt: now,
    updatedAt: now,
    paths: [],
    canvasWidth: width,
    canvasHeight: height,
    backgroundColor: DEFAULT_BACKGROUND,
  };
}

export function HomeScreen({ onOpenDrawing, onNewDrawing }: HomeScreenProps) {
  const { drawings, loading, remove, refresh } = useStorage();
  const { width } = useWindowDimensions();

  const numColumns = width >= 768 ? 3 : 2;
  const cardWidth = (width - 24 * 2 - 12 * (numColumns - 1)) / numColumns;

  const handleNew = useCallback(() => {
    const drawing = newBlankDrawing(width, 800);
    onNewDrawing(drawing);
  }, [width, onNewDrawing]);

  const renderItem = useCallback(
    ({ item }: { item: Drawing }) => (
      <View style={{ width: cardWidth }}>
        <DrawingCard drawing={item} onOpen={onOpenDrawing} onDelete={remove} />
      </View>
    ),
    [cardWidth, onOpenDrawing, remove],
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>🎨 Rottapaint</Text>
        <Text style={styles.subtitle}>¡Tu galería de arte!</Text>
      </View>

      <Pressable
        onPress={handleNew}
        style={({ pressed }) => [styles.newButton, pressed && styles.newButtonPressed]}
        accessibilityRole="button"
        accessibilityLabel="Nuevo dibujo"
      >
        <Text style={styles.newButtonIcon}>✏️</Text>
        <Text style={styles.newButtonText}>¡Nuevo dibujo!</Text>
      </Pressable>

      {drawings.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🖼️</Text>
          <Text style={styles.emptyTitle}>¡Todavía no hay dibujos!</Text>
          <Text style={styles.emptySubtitle}>Tocá el botón de arriba para crear tu primer dibujo.</Text>
        </View>
      ) : (
        <FlatList
          data={drawings}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.list}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={refresh} tintColor="#FF6B6B" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FF6B6B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
  },
  newButton: {
    marginHorizontal: 24,
    marginVertical: 16,
    backgroundColor: '#FF6B6B',
    borderRadius: 20,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  newButtonPressed: {
    transform: [{ scale: 0.97 }],
    shadowOpacity: 0.2,
  },
  newButtonIcon: {
    fontSize: 28,
  },
  newButtonText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    gap: 12,
  },
  row: {
    gap: 12,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 72,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});
