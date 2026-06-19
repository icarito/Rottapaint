import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * Plantilla HTML que envuelve cada página web (solo se usa en web).
 * Aquí enlazamos el manifest de PWA, los meta tags de instalación y
 * registramos el service worker. No tiene efecto en iOS/Android.
 */
// En GitHub Pages la app vive bajo /Rottapaint/. EXPO_PUBLIC_BASE_URL lo
// fija app.config.js en CI; en local queda vacío y todo cuelga de "/".
const BASE = (process.env.EXPO_PUBLIC_BASE_URL || '').replace(/\/$/, '');

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* PWA: instalable */}
        <link rel="manifest" href={`${BASE}/manifest.json`} />
        <meta name="theme-color" content="#FF6B6B" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Rottapaint" />
        <link rel="apple-touch-icon" href={`${BASE}/icons/icon-192.png`} />

        {/* Registro del service worker para cache offline */}
        <script dangerouslySetInnerHTML={{ __html: swRegister(BASE) }} />

        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}

const swRegister = (base: string) => `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('${base}/service-worker.js', { scope: '${base}/' }).catch(function (err) {
      console.warn('SW registration failed:', err);
    });
  });
}
`;
