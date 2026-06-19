import { type RefObject } from 'react';
import { Platform } from 'react-native';

/**
 * Exportar / compartir un dibujo de forma cross-platform.
 *
 * Los módulos nativos (expo-sharing, expo-file-system, expo-media-library)
 * lanzan "not available on web" si se invocan en el navegador, igual que
 * expo-haptics. Por eso cada función tiene un camino web propio y el camino
 * nativo está aislado para que el bundler no rompa.
 *
 * Importamos los módulos nativos de forma perezosa (require dentro de la
 * función) para no ejecutar su código de inicialización en web.
 */

export type ShareResult = { ok: boolean; reason?: string };

/**
 * Comparte un dibujo (dado como string SVG).
 *  - Web: usa la Web Share API si está disponible; si no, descarga el .svg.
 *  - Nativo: escribe el SVG a un archivo temporal y abre la hoja de compartir.
 */
export async function shareDrawingSvg(
  svg: string,
  fileName = 'rottapaint-dibujo',
): Promise<ShareResult> {
  if (Platform.OS === 'web') {
    return shareOnWeb(svg, fileName);
  }
  return shareOnNative(svg, fileName);
}

/**
 * Guarda el dibujo en la galería/fotos del dispositivo.
 * Solo tiene sentido en nativo; en web devuelve un no-op informativo
 * (en web el usuario guarda vía el diálogo de descarga/compartir).
 */
export async function saveDrawingToGallery(
  svg: string,
  fileName = 'rottapaint-dibujo',
): Promise<ShareResult> {
  if (Platform.OS === 'web') {
    // En web no hay "galería"; reutilizamos la descarga.
    return shareOnWeb(svg, fileName);
  }

  try {
    const MediaLibrary = require('expo-media-library');
    const FileSystem = require('expo-file-system');

    const perm = await MediaLibrary.requestPermissionsAsync();
    if (!perm.granted) {
      return { ok: false, reason: 'Permiso de galería denegado' };
    }

    const uri = `${FileSystem.cacheDirectory}${fileName}.svg`;
    await FileSystem.writeAsStringAsync(uri, svg, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await MediaLibrary.saveToLibraryAsync(uri);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}

/**
 * Captura un componente (p. ej. el Canvas) como imagen PNG y devuelve su URI.
 *  - Nativo: usa react-native-view-shot (captureRef).
 *  - Web: view-shot no funciona; devolvemos null para que el llamador caiga
 *    al camino SVG (shareDrawingSvg), que sí es nativo del navegador.
 */
export async function captureViewToPngUri(
  viewRef: RefObject<unknown>,
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }
  try {
    const { captureRef } = require('react-native-view-shot');
    return await captureRef(viewRef, { format: 'png', quality: 1 });
  } catch {
    return null;
  }
}

// --- Web ---

function shareOnWeb(svg: string, fileName: string): ShareResult {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { ok: false, reason: 'No disponible' };
  }

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const file = new File([blob], `${fileName}.svg`, { type: 'image/svg+xml' });

  // Web Share API con archivos (móvil/PWA). navigator.share es async pero
  // mantenemos la firma síncrona del camino web: lo disparamos y seguimos.
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
    share?: (data: { files: File[]; title?: string }) => Promise<void>;
  };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    nav.share({ files: [file], title: 'Rottapaint' }).catch(() => {
      downloadBlob(blob, `${fileName}.svg`);
    });
    return { ok: true };
  }

  // Fallback: descarga directa.
  downloadBlob(blob, `${fileName}.svg`);
  return { ok: true };
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// --- Nativo ---

async function shareOnNative(svg: string, fileName: string): Promise<ShareResult> {
  try {
    const Sharing = require('expo-sharing');
    const FileSystem = require('expo-file-system');

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, reason: 'Compartir no disponible en este dispositivo' };
    }

    const uri = `${FileSystem.cacheDirectory}${fileName}.svg`;
    await FileSystem.writeAsStringAsync(uri, svg, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/svg+xml',
      dialogTitle: 'Compartir dibujo',
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
