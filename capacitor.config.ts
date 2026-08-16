import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.roosterpizza.app',
  appName: 'Rooster Pizza & Grill',
  webDir: 'www',
  // SOLO para probar contra un backend http:// local (ej. BlueStacks/emulador
  // apuntando a la IP de la LAN). La WebView sirve la app por https://localhost,
  // y sin esto bloquea toda llamada a un backend en http:// por "Mixed Content".
  // Sacar esto (o volverlo condicional) el dia que el backend real tenga HTTPS.
  android: {
    allowMixedContent: true,
  },
};

export default config;
