import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

/**
 * Wrapper sobre expo-haptics. En web los métodos de Haptics LANZAN
 * ("not available on web"), así que aquí los hacemos no-op en web y
 * tragamos cualquier error en nativo (el feedback háptico nunca debe
 * romper una acción del usuario).
 */
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

export function impactLight(): void {
  if (!enabled) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function notifyWarning(): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
}

export function notifySuccess(): void {
  if (!enabled) return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
